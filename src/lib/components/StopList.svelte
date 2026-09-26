<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		LEVEL_NAMES,
		UNSEEN,
		describeStop,
		type CurriculumIndex,
		type StopState
	} from '$lib/curriculum/model';
	import Stamp from './Stamp.svelte';

	/**
	 * The list view: every stop, grouped by region, as plain links. An equal
	 * alternative to the map, and the one screen readers and keyboards use.
	 */
	let {
		index,
		states = {},
		selected,
		query = ''
	}: {
		index: CurriculumIndex;
		states?: Record<string, StopState>;
		selected?: string;
		query?: string;
	} = $props();

	const STATE_FILTERS = ['all', ...LEVEL_NAMES, 'rusting'] as const;

	let search = $state('');
	let regionFilter = $state('all');
	let stateFilter = $state<(typeof STATE_FILTERS)[number]>('all');

	const stateName = (s: StopState) => (s.rusting ? 'rusting' : LEVEL_NAMES[s.level]);
	const matchesState = (s: StopState) =>
		stateFilter === 'all' ||
		(stateFilter === 'rusting' ? s.rusting : LEVEL_NAMES[s.level] === stateFilter);

	const groups = $derived.by(() => {
		const needle = search.trim().toLowerCase();
		return index.data.regions
			.filter((r) => regionFilter === 'all' || r.slug === regionFilter)
			.map((region) => ({
				region,
				stops: region.stopSlugs
					.map((slug) => index.stop(slug)!)
					.filter((stop) => {
						if (!matchesState(states[stop.slug] ?? UNSEEN)) return false;
						return (
							!needle ||
							stop.name.toLowerCase().includes(needle) ||
							stop.summary.toLowerCase().includes(needle)
						);
					})
			}))
			.filter((g) => g.stops.length > 0);
	});
	const total = $derived(groups.reduce((n, g) => n + g.stops.length, 0));

	const href = (slug: string) => `${resolve('/(app)/map/[stop]', { stop: slug })}${query}`;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- every href comes from href(), which calls resolve() -->

<div class="list">
	<div class="filters">
		<div class="field wide">
			<label for="stop-search">search</label>
			<input
				id="stop-search"
				class="input"
				type="search"
				placeholder="barre, pentatonic, wonderwall..."
				bind:value={search}
			/>
		</div>
		<div class="field">
			<label for="stop-region">region</label>
			<select id="stop-region" class="input" bind:value={regionFilter}>
				<option value="all">all regions</option>
				{#each index.data.regions as region (region.slug)}
					<option value={region.slug}>{region.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="stop-state">state</label>
			<select id="stop-state" class="input" bind:value={stateFilter}>
				{#each STATE_FILTERS as name (name)}
					<option value={name}>{name === 'all' ? 'any state' : name}</option>
				{/each}
			</select>
		</div>
	</div>

	<p class="count text-dim" aria-live="polite">
		{total === 1 ? '1 stop' : `${total} stops`}
	</p>

	{#each groups as { region, stops } (region.slug)}
		<section aria-labelledby="region-{region.slug}">
			<h2 id="region-{region.slug}">{region.name}</h2>
			<p class="blurb text-dim">{region.blurb}</p>
			<ul>
				{#each stops as stop (stop.slug)}
					{@const state = states[stop.slug] ?? UNSEEN}
					<li>
						<a
							href={href(stop.slug)}
							aria-label={describeStop(stop, region, state)}
							aria-current={selected === stop.slug ? 'true' : undefined}
						>
							<span class="name">{stop.name}</span>
							<span class="meta" aria-hidden="true">
								{#if stop.kind === 'song'}<span class="text-dim">song</span>{/if}
								{#if state.rusting}
									<Stamp tone="rust">rusting</Stamp>
								{:else if state.level >= 4}
									<Stamp tone="clear">{stateName(state)}</Stamp>
								{:else if state.level >= 2}
									<Stamp tone="accent">{stateName(state)}</Stamp>
								{:else}
									<Stamp>{stateName(state)}</Stamp>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="empty text-dim">nothing here yet. that's okay.</p>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.filters {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.field.wide {
		grid-column: 1 / -1;
	}
	label {
		font-size: 0.9375rem;
		color: var(--text-dim);
	}
	.count {
		font-size: 0.875rem;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.blurb {
		font-size: 0.9375rem;
	}
	ul {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		background: color-mix(in srgb, var(--bg-cloud) 88%, transparent);
		border: 1px solid var(--line);
	}
	li + li {
		border-top: 1px solid var(--line);
	}
	a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		min-height: var(--tap);
		padding: 0.4rem 0.75rem;
		color: var(--text);
		text-decoration: none;
	}
	a:hover,
	a[aria-current='true'] {
		background: var(--bg-cloud-hi);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex: none;
		font-size: 0.875rem;
	}
	.empty {
		padding: 1rem 0;
	}
</style>
