<script lang="ts">
	import { untrack } from 'svelte';
	import {
		CLOUD_ALPHA_CAP,
		CLOUD_COLOR,
		CLOUD_SCALE_MAX,
		CLOUD_SCALE_MIN
	} from '$lib/cloud-constants';

	let {
		density = 1,
		brightness = 0,
		animate = true,
		lowRes = false,
		onfail
	}: {
		/** 0..1 how much cloud there is. */
		density?: number;
		/** 0..1 how much light gets through. */
		brightness?: number;
		/** false renders a single still frame. */
		animate?: boolean;
		/** Render at half resolution and upscale. */
		lowRes?: boolean;
		/** Called when WebGL is unavailable or the context is lost. */
		onfail?: () => void;
	} = $props();

	let canvasEl: HTMLCanvasElement;
	let redraw: (() => void) | undefined;

	const f = (n: number) => n.toFixed(4);

	const VERTEX_SRC = `
		attribute vec2 aPosition;
		void main() {
			gl_Position = vec4(aPosition, 0.0, 1.0);
		}
	`;

	const FRAGMENT_SRC = `
		#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
		#else
		precision mediump float;
		#endif
		uniform vec2 uResolution;
		uniform float uTime;
		uniform float uDensity;
		uniform float uBrightness;

		const mat2 R = mat2(0.80, 0.60, -0.60, 0.80);

		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(41.31, 289.17))) * 26737.367);
		}

		float vnoise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			f = f * f * (3.0 - 2.0 * f);
			float a = hash(i);
			float b = hash(i + vec2(1.0, 0.0));
			float c = hash(i + vec2(0.0, 1.0));
			float d = hash(i + vec2(1.0, 1.0));
			return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
		}

		float fbm(vec2 p) {
			float sum = 0.0;
			float amp = 0.5;
			for (int i = 0; i < 3; i++) {
				sum += amp * vnoise(p);
				p = R * p * 2.03 + 19.19;
				amp *= 0.5;
			}
			return sum;
		}

		// Billow noise: sharp puffy ridges, like cauliflower cloud tops.
		float billow(vec2 p) {
			float sum = 0.0;
			float amp = 0.5;
			for (int i = 0; i < 4; i++) {
				sum += amp * (1.0 - abs(2.0 * vnoise(p) - 1.0));
				p = R * p * 2.11 + 13.37;
				amp *= 0.5;
			}
			return sum;
		}

		// Raw density for one cloud: an asymmetric envelope (dome top, flat
		// base) filled with domain-warped billow detail.
		float cloudDensity(vec2 p, vec2 c, vec2 r, float seed, float t) {
			vec2 q = p - c;
			float ry = q.y > 0.0 ? r.y : r.y * 0.42;
			float env = 1.0 - length(vec2(q.x / r.x, q.y / ry));
			if (env < -0.35) return 0.0;

			vec2 dp = q * (2.4 / r.x) + seed;
			dp += 0.6 * vec2(
				fbm(dp * 1.4 + t * 0.04),
				fbm(dp * 1.4 + 7.7 - t * 0.03)
			);
			float detail = billow(dp * 1.6);

			return env + (detail - 0.62) * 0.62;
		}

		// One cloud as straight (non-premultiplied) colour + alpha, so it
		// composites over the page's own dark background. Brightness scales
		// the colour; it is capped so text always stays readable.
		vec4 shadeCloud(vec2 p, vec2 c, vec2 r, float seed, float t) {
			float d = cloudDensity(p, c, r, seed, t);
			if (d < 0.02) return vec4(0.0);

			vec3 col = vec3(${f(CLOUD_COLOR[0])}, ${f(CLOUD_COLOR[1])}, ${f(CLOUD_COLOR[2])})
				* mix(${f(CLOUD_SCALE_MIN)}, ${f(CLOUD_SCALE_MAX)}, uBrightness);

			float alpha = smoothstep(0.02, 0.4, d) * 0.22;
			return vec4(col, alpha);
		}

		vec4 over(vec4 src, vec4 dst) {
			float a = src.a + dst.a * (1.0 - src.a);
			vec3 rgb = a > 0.0001
				? (src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a)) / a
				: vec3(0.0);
			return vec4(rgb, a);
		}

		// A lane tiles clouds endlessly along x in cells of cellWidth, so
		// coverage scales with aspect ratio. Each cell gets a randomized cloud
		// from a hash of its index, drifting left at spd. uDensity lowers the
		// occupancy threshold, and clouds fade in and out as it crosses their
		// hash, so changing the weather never pops a cloud.
		vec4 lanePass(vec4 acc, vec2 p, float t, float spd, float cellWidth, float y, float ySpread, vec2 rBase, vec2 rJitter, float occupancy, float laneSeed) {
			float xw = p.x + t * spd;
			float cell = floor(xw / cellWidth);
			float thr = occupancy * uDensity;
			for (int k = -1; k <= 1; k++) {
				float ci = cell + float(k);
				float h1 = hash(vec2(ci, laneSeed));
				float presence = 1.0 - smoothstep(thr - 0.08, thr, h1);
				if (presence <= 0.0) continue;

				float h2 = hash(vec2(ci, laneSeed + 7.7));
				float h3 = hash(vec2(ci, laneSeed + 13.1));
				float h4 = hash(vec2(ci, laneSeed + 21.9));

				float cx = (ci + 0.5) * cellWidth - t * spd + (h2 - 0.5) * cellWidth * 0.4;
				float cy = y + (h3 - 0.5) * ySpread;
				vec2 r = rBase + rJitter * h4;
				float seed = ci * 3.7 + laneSeed * 91.3;

				vec4 cloud = shadeCloud(p, vec2(cx, cy), r, seed, t);
				cloud.a *= presence;
				acc = over(cloud, acc);
			}
			return acc;
		}

		void main() {
			float aspect = uResolution.x / uResolution.y;
			vec2 uv = gl_FragCoord.xy / uResolution.xy;
			vec2 p = vec2(uv.x * aspect, uv.y);
			float t = uTime;

			// Far to near, so nearer lanes overlap farther ones.
			vec4 acc = vec4(0.0);
			acc = lanePass(acc, p, t, 0.045, 1.1, 0.86, 0.10, vec2(0.30, 0.15), vec2(0.12, 0.06), 0.3, 11.0);
			acc = lanePass(acc, p, t, 0.07, 1.4, 0.64, 0.14, vec2(0.40, 0.20), vec2(0.16, 0.08), 0.32, 37.0);
			acc = lanePass(acc, p, t, 0.10, 1.8, 0.42, 0.16, vec2(0.50, 0.25), vec2(0.18, 0.09), 0.34, 59.0);
			acc = lanePass(acc, p, t, 0.13, 2.3, 0.20, 0.14, vec2(0.62, 0.31), vec2(0.22, 0.11), 0.36, 83.0);

			// Fade toward the bottom so it blends into the page.
			float fade = smoothstep(0.0, 0.7, uv.y);

			gl_FragColor = vec4(acc.rgb, min(acc.a, ${f(CLOUD_ALPHA_CAP)}) * fade);
		}
	`;

	function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	$effect(() => {
		const shouldAnimate = animate;
		const scale = lowRes ? 0.5 : 1;

		const gl = canvasEl.getContext('webgl', { antialias: false, powerPreference: 'low-power' });
		const vertexShader = gl && compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
		const fragmentShader = gl && compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
		const program = gl && vertexShader && fragmentShader ? gl.createProgram() : null;
		if (!gl || !vertexShader || !fragmentShader || !program) {
			onfail?.();
			return;
		}
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			onfail?.();
			return;
		}
		gl.useProgram(program);

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const positionLoc = gl.getAttribLocation(program, 'aPosition');
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		const resolutionLoc = gl.getUniformLocation(program, 'uResolution');
		const timeLoc = gl.getUniformLocation(program, 'uTime');
		const densityLoc = gl.getUniformLocation(program, 'uDensity');
		const brightnessLoc = gl.getUniformLocation(program, 'uBrightness');

		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0, 0, 0, 0);

		function resize() {
			// Clouds are soft, so device pixel ratio is ignored. Half-res on top of that when asked.
			canvasEl.width = Math.max(1, Math.round(canvasEl.clientWidth * scale));
			canvasEl.height = Math.max(1, Math.round(canvasEl.clientHeight * scale));
			gl!.viewport(0, 0, canvasEl.width, canvasEl.height);
			draw(time);
		}

		const start = performance.now();
		let time = 0;
		function draw(t: number) {
			gl!.uniform2f(resolutionLoc, canvasEl.width, canvasEl.height);
			gl!.uniform1f(timeLoc, t);
			gl!.uniform1f(
				densityLoc,
				untrack(() => density)
			);
			gl!.uniform1f(
				brightnessLoc,
				untrack(() => brightness)
			);
			gl!.clear(gl!.COLOR_BUFFER_BIT);
			gl!.drawArrays(gl!.TRIANGLES, 0, 3);
		}

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(canvasEl);

		// Clouds drift slowly, so 30fps is indistinguishable and half the cost.
		const FRAME_MS = 1000 / 30;
		let raf = 0;
		let lastDraw = 0;
		let offset = 0;
		function frame(now: number) {
			raf = requestAnimationFrame(frame);
			if (now - lastDraw < FRAME_MS) return;
			lastDraw = now;
			time = ((now - start) / 1000 + offset) % 1000.0;
			draw(time);
		}

		function onVisibility() {
			cancelAnimationFrame(raf);
			if (!document.hidden && shouldAnimate) {
				// Continue from where the drift stopped instead of jumping.
				offset = time - (performance.now() - start) / 1000;
				raf = requestAnimationFrame(frame);
			}
		}

		function onLost(event: Event) {
			event.preventDefault();
			cancelAnimationFrame(raf);
			onfail?.();
		}
		canvasEl.addEventListener('webglcontextlost', onLost);

		redraw = () => draw(time);
		if (shouldAnimate) {
			raf = requestAnimationFrame(frame);
			document.addEventListener('visibilitychange', onVisibility);
		}

		return () => {
			redraw = undefined;
			cancelAnimationFrame(raf);
			observer.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			canvasEl.removeEventListener('webglcontextlost', onLost);
		};
	});

	// A still sky has no loop, so redraw when the weather changes.
	$effect(() => {
		void density;
		void brightness;
		if (!animate) redraw?.();
	});
</script>

<canvas bind:this={canvasEl} class="cloud-canvas" aria-hidden="true"></canvas>

<style>
	.cloud-canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100lvh;
		pointer-events: none;
		z-index: 0;
	}
</style>
