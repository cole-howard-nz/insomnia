<script lang="ts">
	import type { StopKind, StopState } from '$lib/curriculum/model';

	// One stop, drawn around (0, 0). Level is never colour alone: outline, half
	// fill, full fill, halo and ring all differ. Songs are diamonds, skills circles.
	let {
		state,
		kind,
		r = 14,
		ignite = 0
	}: {
		state: StopState;
		kind: StopKind;
		r?: number;
		/** Changes each time the stop levels up, which plays the glow once. 0 is off. */
		ignite?: number;
	} = $props();

	const full = $derived(
		kind === 'song'
			? `M0 ${-r * 1.25}L${r * 1.25} 0L0 ${r * 1.25}L${-r * 1.25} 0Z`
			: `M${-r} 0A${r} ${r} 0 1 0 ${r} 0A${r} ${r} 0 1 0 ${-r} 0Z`
	);
	const half = $derived(
		kind === 'song'
			? `M0 ${-r * 1.25}L${-r * 1.25} 0L0 ${r * 1.25}Z`
			: `M0 ${-r}A${r} ${r} 0 0 0 0 ${r}Z`
	);
	const halo = $derived(
		kind === 'song'
			? (m: number) => `M0 ${-r * 1.25 * m}L${r * 1.25 * m} 0L0 ${r * 1.25 * m}L${-r * 1.25 * m} 0Z`
			: (m: number) =>
					`M${-r * m} 0A${r * m} ${r * m} 0 1 0 ${r * m} 0A${r * m} ${r * m} 0 1 0 ${-r * m} 0Z`
	);
	const dim = $derived(state.rusting ? 0.5 : 1);
	// Focus is skill: a stop you have not touched is a streetlight out of focus through wet glass,
	// and it sharpens a notch at a time until a mastered one is razor clear. Hover or focus pulls it in.
	const blur = $derived([2.4, 1.5, 0.7, 0, 0][state.level] ?? 0);
</script>

<g class="glyph" style:--blur="{blur}px">
	{#if state.level === 3}
		<path d={halo(2.1)} fill="var(--accent)" opacity={0.1 * dim} />
		<path d={halo(1.5)} fill="var(--accent)" opacity={0.18 * dim} />
	{/if}

	{#if state.level === 0}
		<path
			d={full}
			fill="var(--bg-deep)"
			fill-opacity="0.55"
			stroke="var(--text-dim)"
			stroke-width="1.5"
		/>
	{:else if state.level === 1}
		<path
			d={full}
			fill="var(--bg-deep)"
			fill-opacity="0.55"
			stroke="var(--accent)"
			stroke-width="1.5"
		/>
		<path class="flicker" d={half} fill="var(--accent)" opacity="0.6" />
	{:else if state.level === 2}
		<path
			d={full}
			fill="var(--accent)"
			fill-opacity="0.45"
			stroke="var(--accent)"
			stroke-width="1.5"
		/>
	{:else if state.level === 3}
		<path d={full} fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5" />
	{:else}
		<path d={halo(1.4)} fill="none" stroke="var(--clear)" stroke-width="2" />
		<path d={full} fill="var(--bg-deep)" stroke="var(--clear)" stroke-width="1.5" />
		<path d={halo(0.5)} fill="var(--clear)" />
	{/if}

	{#if ignite}
		{#key ignite}
			<path class="ignite" d={halo(1)} fill="var(--accent)" />
		{/key}
	{/if}

	{#if state.rusting}
		<!-- a small cloud of rust gathering over the stop -->
		<g class="drift">
			<path
				transform="translate(0 {-r * 0.55}) scale({r * 1.35})"
				d="M-1.1 -0.3C-0.9 -1 0.2 -1.25 0.9 -0.7C1.35 -0.2 1.1 0.8 0.3 1.1C-0.5 1.35 -1.3 0.6 -1.1 -0.3Z"
				fill="var(--rust)"
				opacity="0.2"
			/>
		</g>
		<path
			transform="scale({r})"
			d="M-1.1 -0.3C-0.9 -1 0.2 -1.25 0.9 -0.7C1.35 -0.2 1.1 0.8 0.3 1.1C-0.5 1.35 -1.3 0.6 -1.1 -0.3Z"
			fill="var(--rust)"
			opacity="0.62"
		/>
	{/if}
</g>

<style>
	.glyph {
		filter: blur(var(--blur, 0px));
		transition: filter 0.5s ease-out;
	}
	:global(.stop:hover) .glyph,
	:global(.stop:focus-visible) .glyph,
	:global(.stop.selected) .glyph {
		filter: blur(0);
	}
	.ignite {
		transform-box: fill-box;
		transform-origin: center;
		opacity: 0;
		animation: ignite 1.8s ease-out;
	}
	@keyframes ignite {
		0% {
			opacity: 0.55;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(3.2);
		}
	}
	.drift {
		animation: drift 9s ease-in-out infinite alternate;
	}
	@keyframes drift {
		from {
			transform: translateX(-2px);
		}
		to {
			transform: translateX(2px);
		}
	}
	.flicker {
		animation: flicker 3.2s steps(1, end) infinite;
	}
	@keyframes flicker {
		0%,
		100% {
			opacity: 0.6;
		}
		46% {
			opacity: 0.35;
		}
		52% {
			opacity: 0.6;
		}
		78% {
			opacity: 0.45;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.glyph {
			transition: none;
		}
		.flicker,
		.drift,
		.ignite {
			animation: none;
		}
	}
</style>
