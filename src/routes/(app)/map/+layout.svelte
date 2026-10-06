<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import MapView from '$lib/components/MapView.svelte';
	import StopList from '$lib/components/StopList.svelte';
	import WhatNext from '$lib/components/WhatNext.svelte';
	import { celebrate } from '$lib/celebrate.svelte';
	import { getProgressContext } from '$lib/progress/store.svelte';
	import { indexCurriculum } from '$lib/curriculum/model';
	import { mapState } from '$lib/map-state.svelte';
	import { setMapContext } from '$lib/map-context';

	let {
		data,
		children
	}: { data: { curriculum: import('$lib/curriculum/model').CurriculumData }; children: Snippet } =
		$props();

	const index = $derived(indexCurriculum(data.curriculum));
	const progress = getProgressContext();
	const states = $derived(mapState.preview ? mapState.for(data.curriculum) : progress.states);
	const view = $derived(page.url.searchParams.get('view') === 'list' ? 'list' : 'map');
	const query = $derived(view === 'list' ? '?view=list' : '');
	const selected = $derived(page.params.stop);

	setMapContext({
		get index() {
			return index;
		},
		get states() {
			return states;
		},
		get query() {
			return query;
		}
	});
</script>

<svelte:head><title>map · insomnia</title></svelte:head>

<div class="hud" class:floating={view === 'map'}>
	<header>
		<h1>map</h1>
		<nav aria-label="map view">
			<a href={resolve('/map')} aria-current={view === 'map' ? 'page' : undefined}>map</a>
			<a href="{resolve('/map')}?view=list" aria-current={view === 'list' ? 'page' : undefined}
				>list</a
			>
		</nav>
	</header>

	{#if import.meta.env.DEV}
		<label class="dev">
			<input type="checkbox" bind:checked={mapState.preview} />
			dev: preview every state
		</label>
	{/if}

	<WhatNext suggestions={progress.suggestions} {query} />
</div>

{#if view === 'map'}
	<div class="stage" class:bleed={view === 'map'}>
		<div class="fill">
			<MapView
				{index}
				{states}
				{selected}
				{query}
				ignited={celebrate.ignited}
				cleared={progress.summary.cleared}
			/>
		</div>
	</div>
{:else}
	<StopList {index} {states} {selected} {query} />
{/if}

{@render children()}

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	nav {
		display: flex;
		border: 1px solid var(--glass-edge);
		background: var(--glass-bg);
		-webkit-backdrop-filter: blur(var(--glass-blur));
		backdrop-filter: blur(var(--glass-blur));
	}
	nav a {
		display: grid;
		place-items: center;
		min-width: 4.5rem;
		min-height: var(--tap);
		color: var(--text-dim);
		text-decoration: none;
		font-family: var(--font-display);
		letter-spacing: 0.04em;
	}
	nav a[aria-current='page'] {
		background: var(--bg-cloud-hi);
		color: var(--accent);
	}
	.dev {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-dim);
	}
	.dev input {
		min-height: 0;
	}
	.stage {
		position: relative;
		flex: 1;
		min-height: 26rem;
		margin-inline: -1rem;
	}
	.fill {
		position: absolute;
		inset: 0;
	}
	.hud {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Desktop: the map is the whole window, the rail on its left, and the controls float on it
	   as glass instead of sitting above it in a column. */
	@media (min-width: 64rem) {
		.stage.bleed {
			position: fixed;
			inset: 0 0 0 var(--rail-w);
			min-height: 0;
			margin: 0;
			z-index: 0;
		}
		.hud.floating {
			position: relative;
			z-index: 5;
			width: 23rem;
			padding: 1.1rem 1.1rem 1.2rem;
			background: var(--glass-bg);
			-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
			backdrop-filter: blur(var(--glass-blur)) saturate(1.2);
			border: 1px solid var(--glass-edge);
			box-shadow: 0 18px 40px -18px rgb(0 0 0 / 0.7);
		}
		.hud.floating h1 {
			font-size: clamp(3.5rem, 7vw, 6rem);
			font-weight: 800;
			font-variation-settings: 'wdth' 75;
			line-height: 0.85;
			margin-bottom: -0.2rem;
		}
	}
</style>
