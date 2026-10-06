<script lang="ts">
	import { onMount } from 'svelte';

	// A streetlight that follows the pointer. It only writes --lx / --ly on the root; the glow
	// itself is one fixed gradient, and the map and hero type read the same variables to light up
	// under it. Fine pointers only: on touch there is no cursor to carry a lamp.
	let enabled = $state(false);

	onMount(() => {
		const fine = matchMedia('(hover: hover) and (pointer: fine)');
		enabled = fine.matches;
		if (!enabled) return;

		const root = document.documentElement;
		let x = innerWidth * 0.7;
		let y = innerHeight * 0.3;
		let tx = x;
		let ty = y;
		let raf = 0;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

		// The lamp trails the cursor a little, like a swinging bulb.
		const frame = () => {
			x += (tx - x) * (reduced ? 1 : 0.14);
			y += (ty - y) * (reduced ? 1 : 0.14);
			root.style.setProperty('--lx', `${x.toFixed(1)}px`);
			root.style.setProperty('--ly', `${y.toFixed(1)}px`);
			raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(frame) : 0;
		};
		const move = (event: PointerEvent) => {
			tx = event.clientX;
			ty = event.clientY;
			if (!raf) raf = requestAnimationFrame(frame);
		};
		addEventListener('pointermove', move, { passive: true });
		return () => {
			removeEventListener('pointermove', move);
			cancelAnimationFrame(raf);
		};
	});
</script>

{#if enabled}<div class="lamp" aria-hidden="true"></div>{/if}

<style>
	.lamp {
		position: fixed;
		inset: 0;
		z-index: 12;
		pointer-events: none;
		mix-blend-mode: screen;
		background:
			radial-gradient(
				circle 26rem at var(--lx) var(--ly),
				color-mix(in srgb, var(--accent) 15%, transparent),
				transparent 70%
			),
			radial-gradient(
				circle 5rem at var(--lx) var(--ly),
				color-mix(in srgb, var(--accent) 12%, transparent),
				transparent 100%
			);
	}
</style>
