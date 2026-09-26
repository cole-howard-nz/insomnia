<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		LEVEL_NAMES,
		UNSEEN,
		type CurriculumIndex,
		type StopModel,
		type StopState
	} from '$lib/curriculum/model';
	import Stamp from './Stamp.svelte';

	/** The body of the stop sheet. Read-only until progress arrives in phase 3. */
	let {
		index,
		stop,
		current = UNSEEN,
		query = ''
	}: { index: CurriculumIndex; stop: StopModel; current?: StopState; query?: string } = $props();

	const region = $derived(index.region(stop.regionSlug));
	const levels = [2, 3, 4] as const;

	// Links run both ways, so each direction gets its own sentence.
	const relations = $derived(
		[
			{ label: 'easier after', stops: index.incoming(stop.slug, 'helps') },
			{ label: 'more natural after', stops: index.incoming(stop.slug, 'unlocks') },
			{ label: 'helps with', stops: index.outgoing(stop.slug, 'helps') },
			{ label: 'opens up', stops: index.outgoing(stop.slug, 'unlocks') }
		].filter((r) => r.stops.length > 0)
	);

	// Jumping to another stop keeps the sheet open, so start it back at the top.
	let root: HTMLDivElement | undefined = $state();
	$effect(() => {
		void stop.slug;
		root?.parentElement?.scrollTo({ top: 0 });
	});

	const href = (slug: string) => `${resolve('/(app)/map/[stop]', { stop: slug })}${query}`;
	const kindLabel = { video: 'video', tab: 'tab', article: 'read', exercise: 'drill' } as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- every href comes from href(), which calls resolve() -->

<div class="detail" bind:this={root}>
	<p class="tags">
		<span class="text-dim">{region?.name}</span>
		{#if stop.kind === 'song'}<span class="text-dim">song</span>{/if}
		<Stamp tone={current.level >= 4 ? 'clear' : current.level >= 2 ? 'accent' : 'dim'}>
			{LEVEL_NAMES[current.level]}
		</Stamp>
		{#if current.rusting}<Stamp tone="rust">rusting</Stamp>{/if}
	</p>

	<p class="summary">{stop.summary}</p>

	{#if stop.targetBpm}
		<p class="bpm text-dim">target tempo <strong>{stop.targetBpm} bpm</strong></p>
	{/if}

	<section aria-labelledby="criteria-heading">
		<h3 id="criteria-heading">what counts</h3>
		{#each levels as level (level)}
			<div class="level">
				<h4>{LEVEL_NAMES[level]}</h4>
				<ul class="criteria">
					{#each stop.criteria.filter((c) => c.level === level) as criterion (criterion.id)}
						<li>{criterion.text}</li>
					{/each}
				</ul>
			</div>
		{/each}
	</section>

	{#if relations.length}
		<section aria-labelledby="links-heading">
			<h3 id="links-heading">nearby</h3>
			<p class="hint text-dim">nothing here is locked. these are only suggestions.</p>
			{#each relations as relation (relation.label)}
				<p class="relation">
					<span class="text-dim">{relation.label}:</span>
					{#each relation.stops as other, i (other.slug)}
						<a href={href(other.slug)}>{other.name}</a>{i < relation.stops.length - 1 ? ', ' : ''}
					{/each}
				</p>
			{/each}
		</section>
	{/if}

	<section aria-labelledby="resources-heading">
		<h3 id="resources-heading">go learn it</h3>
		<ul class="resources">
			{#each stop.resources as resource (resource.url)}
				<li>
					<a href={resource.url} target="_blank" rel="noopener noreferrer">
						{resource.title}<span class="sr-only"> (opens in a new tab)</span>
					</a>
					<span class="kind text-dim">{kindLabel[resource.kind]}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="notes-heading">
		<h3 id="notes-heading">notes</h3>
		<p class="text-dim">your notes for this one will live here.</p>
	</section>
</div>

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-self: stretch;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.875rem;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
	}
	h3 {
		font-size: 1.05rem;
		color: var(--text-dim);
	}
	h4 {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: 0.95rem;
		color: var(--accent);
		margin: 0;
	}
	.level {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.criteria li {
		position: relative;
		padding-left: 1.25rem;
	}
	/* Hollow tick boxes, read-only until progress exists. */
	.criteria li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5em;
		width: 0.65rem;
		height: 0.65rem;
		border: 1.5px solid var(--text-dim);
	}
	.hint {
		font-size: 0.9375rem;
	}
	.relation a {
		display: inline-block;
		min-height: 1.75rem;
	}
	.resources li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
	}
	.kind {
		flex: none;
		font-size: 0.875rem;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
