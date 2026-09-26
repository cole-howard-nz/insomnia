<script lang="ts">
	import { untrack } from 'svelte';

	let {
		dropScale = 1,
		opacity = 1,
		animate = true
	}: {
		/** 0..1 share of the drops that are drawn. */
		dropScale?: number;
		/** 0..1 multiplier on streak opacity. */
		opacity?: number;
		/** false draws a single still frame. */
		animate?: boolean;
	} = $props();

	let canvasEl: HTMLCanvasElement;
	let redraw: (() => void) | undefined;

	interface Layer {
		count: number;
		speed: [number, number];
		length: [number, number];
		opacity: number;
		lineWidth: number;
	}

	// Three depth layers: slower, fainter and thinner in the distance.
	const layers: Layer[] = [
		{ count: 70, speed: [260, 380], length: [10, 16], opacity: 0.14, lineWidth: 1 },
		{ count: 50, speed: [420, 560], length: [16, 24], opacity: 0.26, lineWidth: 1.2 },
		{ count: 32, speed: [620, 780], length: [22, 34], opacity: 0.4, lineWidth: 1.5 }
	];

	interface Drop {
		x: number;
		y: number;
		speed: number;
		length: number;
	}

	$effect(() => {
		const shouldAnimate = animate;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		let width = 0;
		let height = 0;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		function spawn(layer: Layer, initial: boolean): Drop {
			return {
				x: Math.random() * width,
				y: initial ? Math.random() * height : -layer.length[1],
				speed: layer.speed[0] + Math.random() * (layer.speed[1] - layer.speed[0]),
				length: layer.length[0] + Math.random() * (layer.length[1] - layer.length[0])
			};
		}

		let drops: Drop[][] = [];

		function resize() {
			width = canvasEl.clientWidth;
			height = canvasEl.clientHeight;
			canvasEl.width = width * dpr;
			canvasEl.height = height * dpr;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			drops = layers.map((layer) => Array.from({ length: layer.count }, () => spawn(layer, true)));
			draw(0);
		}

		function draw(dt: number) {
			// Read current prop values without making the effect re-run.
			const scale = untrack(() => dropScale);
			const alpha = untrack(() => opacity);
			ctx!.clearRect(0, 0, width, height);
			layers.forEach((layer, li) => {
				const active = Math.round(layer.count * scale);
				ctx!.strokeStyle = `rgba(104, 109, 117, ${layer.opacity * alpha})`;
				ctx!.lineWidth = layer.lineWidth;
				ctx!.beginPath();
				for (let i = 0; i < active; i++) {
					const drop = drops[li][i];
					drop.y += drop.speed * dt;
					if (drop.y - drop.length > height) Object.assign(drop, spawn(layer, false));
					ctx!.moveTo(drop.x, drop.y);
					ctx!.lineTo(drop.x - layer.lineWidth * 0.6, drop.y + drop.length);
				}
				ctx!.stroke();
			});
		}

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(canvasEl);

		let raf = 0;
		let last = performance.now();
		function frame(now: number) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			draw(dt);
			raf = requestAnimationFrame(frame);
		}

		function onVisibility() {
			cancelAnimationFrame(raf);
			if (!document.hidden && shouldAnimate) {
				last = performance.now();
				raf = requestAnimationFrame(frame);
			}
		}

		redraw = () => draw(0);
		if (shouldAnimate) {
			raf = requestAnimationFrame(frame);
			document.addEventListener('visibilitychange', onVisibility);
		}

		return () => {
			redraw = undefined;
			cancelAnimationFrame(raf);
			observer.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	// A still sky has no loop, so redraw when the weather changes.
	$effect(() => {
		void dropScale;
		void opacity;
		if (!animate) redraw?.();
	});
</script>

<canvas bind:this={canvasEl} class="rain-canvas" aria-hidden="true"></canvas>

<style>
	.rain-canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100lvh;
		pointer-events: none;
		z-index: 1;
	}
</style>
