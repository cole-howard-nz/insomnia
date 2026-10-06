<script lang="ts">
	import { onMount } from 'svelte';
	import { weather } from '$lib/weather.svelte';

	// Distant storm light, every so often. It never snaps to white: the sky catches, flickers once
	// more, then fades. The strike is a faint branching bolt low in the cloud, and the town takes
	// the flash through --flash on the root. Rarer as the weather clears, gone when it is clear
	// enough, and off entirely for people who asked for less motion.
	let flash = $state(0);
	let bolt = $state<{ d: string; x: number } | null>(null);

	function makeBolt(w: number, h: number) {
		let x = w * (0.1 + Math.random() * 0.8);
		let y = 0;
		const parts: string[] = [`M${x.toFixed(0)} 0`];
		const reach = h * (0.38 + Math.random() * 0.2);
		while (y < reach) {
			y += 14 + Math.random() * 26;
			x += (Math.random() - 0.5) * 38;
			parts.push(`L${x.toFixed(0)} ${y.toFixed(0)}`);
			// the odd fork
			if (Math.random() < 0.22) {
				let fx = x;
				let fy = y;
				parts.push(`M${fx.toFixed(0)} ${fy.toFixed(0)}`);
				for (let i = 0; i < 3; i++) {
					fy += 10 + Math.random() * 18;
					fx += (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 20);
					parts.push(`L${fx.toFixed(0)} ${fy.toFixed(0)}`);
				}
				parts.push(`M${x.toFixed(0)} ${y.toFixed(0)}`);
			}
		}
		return { d: parts.join(' '), x };
	}

	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		const root = document.documentElement;
		let timer = 0;
		let raf = 0;

		const set = (v: number) => {
			flash = v;
			root.style.setProperty('--flash', v.toFixed(3));
		};

		// [peak, hold ms] pulses with a fade between: catch, flicker, main, afterglow.
		function strike() {
			bolt = makeBolt(innerWidth, innerHeight);
			const pulses: [number, number][] = [
				[0.55, 70],
				[0.2, 90],
				[1, 130]
			];
			let i = 0;
			const pulse = () => {
				if (i >= pulses.length) return fade();
				set(pulses[i][0]);
				const hold = pulses[i][1];
				i++;
				timer = window.setTimeout(pulse, hold);
			};
			const fade = () => {
				const from = performance.now();
				const step = (now: number) => {
					const t = Math.min(1, (now - from) / 900);
					set(Math.pow(1 - t, 2.2) * 0.45);
					if (t < 1) raf = requestAnimationFrame(step);
					else {
						set(0);
						bolt = null;
						schedule();
					}
				};
				raf = requestAnimationFrame(step);
			};
			pulse();
			// the bolt itself is only there for the first flashes
			window.setTimeout(() => (bolt = null), 330);
		}

		function schedule() {
			clearTimeout(timer);
			const clear = weather.current;
			// 14-40s in heavy weather, stretching out as it clears, and none once it has.
			const gap = (14000 + Math.random() * 26000) / Math.max(0.25, 1 - clear);
			timer = window.setTimeout(() => {
				if (reduced.matches || document.hidden || clear > 0.85) return schedule();
				strike();
			}, gap);
		}

		if (!reduced.matches) schedule();
		return () => {
			clearTimeout(timer);
			cancelAnimationFrame(raf);
			root.style.removeProperty('--flash');
		};
	});
</script>

<div class="sky-flash" style:opacity={flash * 0.16} aria-hidden="true"></div>
{#if bolt}
	<svg class="bolt" aria-hidden="true" style:opacity={Math.min(1, flash * 1.4)}>
		<path d={bolt.d} />
	</svg>
{/if}

<style>
	.sky-flash {
		position: fixed;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		mix-blend-mode: screen;
		background: radial-gradient(
			ellipse 90% 70% at 50% 15%,
			color-mix(in srgb, var(--clear) 70%, white),
			color-mix(in srgb, var(--clear) 25%, transparent) 70%
		);
	}
	.bolt {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		pointer-events: none;
		mix-blend-mode: screen;
	}
	.bolt path {
		fill: none;
		stroke: color-mix(in srgb, var(--clear) 55%, white);
		stroke-width: 1.4;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 6px var(--clear)) drop-shadow(0 0 16px var(--clear));
	}
</style>
