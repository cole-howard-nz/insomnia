<script lang="ts">
	import { onMount } from 'svelte';

	// Raindrops on the pane you are looking through, as opposed to the rain beyond it. Small lens
	// drops sit still, a few run down the glass in stick-and-slip jumps and leave a wet trail.
	// Drawn on one 2D canvas above the page, never intercepting a pointer, and kept tiny and
	// sparse so it never covers text for long.
	let canvas: HTMLCanvasElement | undefined = $state();

	type Drop = {
		x: number;
		y: number;
		r: number;
		vy: number; // 0 for a drop that is stuck
		hold: number; // seconds until it lets go again
		trail: boolean;
	};

	onMount(() => {
		const canvasEl = canvas!;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
		const nav = navigator as Navigator & { deviceMemory?: number };
		if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) return;

		const dpr = Math.min(devicePixelRatio || 1, 2);
		let w = 0;
		let h = 0;
		let drops: Drop[] = [];
		let trails: { x: number; y: number; r: number; life: number }[] = [];
		let raf = 0;
		let last = 0;

		const rand = (a: number, b: number) => a + Math.random() * (b - a);
		const make = (): Drop => {
			const big = Math.random() < 0.12;
			return {
				x: rand(0, w),
				y: rand(0, h),
				r: big ? rand(5, 9) : rand(1.4, 4),
				vy: 0,
				hold: big ? rand(0.5, 6) : rand(8, 60),
				trail: big
			};
		};

		function resize() {
			w = innerWidth;
			h = innerHeight;
			canvasEl.width = w * dpr;
			canvasEl.height = h * dpr;
			canvasEl.style.width = `${w}px`;
			canvasEl.style.height = `${h}px`;
			const count = Math.round(((w * h) / 9000) * (coarse ? 0.45 : 0.6));
			drops = Array.from({ length: Math.min(count, 150) }, make);
		}

		function lens(d: Drop) {
			// the big ones sit in front of the text, so they are the faintest
			ctx!.globalAlpha = d.trail ? 0.4 : 1;
			const g = ctx!.createRadialGradient(d.x, d.y + d.r * 0.25, d.r * 0.15, d.x, d.y, d.r);
			g.addColorStop(0, 'rgba(160,190,210,0.02)');
			g.addColorStop(0.7, 'rgba(10,12,16,0.22)');
			g.addColorStop(1, 'rgba(190,215,230,0.34)');
			ctx!.fillStyle = g;
			ctx!.beginPath();
			// slightly taller than wide: gravity
			ctx!.ellipse(d.x, d.y, d.r * 0.92, d.r * 1.08, 0, 0, Math.PI * 2);
			ctx!.fill();
			// the streetlight catching the top of the drop
			ctx!.fillStyle = 'rgba(255,214,150,0.55)';
			ctx!.beginPath();
			ctx!.arc(d.x - d.r * 0.3, d.y - d.r * 0.38, Math.max(0.6, d.r * 0.2), 0, Math.PI * 2);
			ctx!.fill();
			ctx!.globalAlpha = 1;
		}

		function draw(dt: number) {
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx!.clearRect(0, 0, w, h);
			for (const t of trails) {
				t.life -= dt;
				ctx!.fillStyle = `rgba(170,200,220,${Math.max(0, t.life) * 0.05})`;
				ctx!.fillRect(t.x - t.r * 0.35, t.y, t.r * 0.7, t.r * 1.6);
			}
			trails = trails.filter((t) => t.life > 0);
			for (let i = 0; i < drops.length; i++) {
				const d = drops[i];
				if (!reduced.matches) {
					d.hold -= dt;
					if (d.hold <= 0 && d.vy === 0) d.vy = rand(40, 150);
					if (d.vy > 0) {
						d.y += d.vy * dt;
						d.x += Math.sin(d.y * 0.05) * 0.15;
						d.vy *= 0.9 + Math.random() * 0.08;
						if (d.trail) trails.push({ x: d.x, y: d.y - d.r, r: d.r, life: 8 });
						if (d.vy < 6) {
							d.vy = 0;
							d.hold = rand(0.4, 5);
						}
						if (d.y - d.r > h) drops[i] = { ...make(), y: -10 };
					}
				}
				lens(drops[i]);
			}
		}

		function frame(now: number) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			draw(dt);
			raf = requestAnimationFrame(frame);
		}

		const start = () => {
			cancelAnimationFrame(raf);
			if (reduced.matches) {
				draw(0);
				return;
			}
			last = performance.now();
			raf = requestAnimationFrame(frame);
		};
		const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());

		resize();
		start();
		addEventListener('resize', resize);
		document.addEventListener('visibilitychange', onVisibility);
		reduced.addEventListener('change', start);
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('resize', resize);
			document.removeEventListener('visibilitychange', onVisibility);
			reduced.removeEventListener('change', start);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		z-index: 55;
		pointer-events: none;
		opacity: 0.85;
	}
</style>
