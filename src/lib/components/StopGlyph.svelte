<script lang="ts">
	import type { StopKind, StopState } from '$lib/curriculum/model';

	// One stop, drawn around (0, 0). Level is never colour alone: outline, half
	// fill, full fill, halo and ring all differ. Songs are diamonds, skills circles.
	let { state, kind, r = 14 }: { state: StopState; kind: StopKind; r?: number } = $props();

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
</script>

<g class="glyph">
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

	{#if state.rusting}
		<!-- a rust smudge over the stop -->
		<path
			transform="scale({r})"
			d="M-1.1 -0.3C-0.9 -1 0.2 -1.25 0.9 -0.7C1.35 -0.2 1.1 0.8 0.3 1.1C-0.5 1.35 -1.3 0.6 -1.1 -0.3Z"
			fill="var(--rust)"
			opacity="0.62"
		/>
	{/if}
</g>

<style>
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
		.flicker {
			animation: none;
		}
	}
</style>
