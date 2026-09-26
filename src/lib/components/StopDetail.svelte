<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { celebrate } from '$lib/celebrate.svelte';
	import { send } from '$lib/progress/api';
	import { daysSince } from '$lib/progress/logic';
	import type { Milestone } from '$lib/progress/model';
	import { getProgressContext } from '$lib/progress/store.svelte';
	import Button from './Button.svelte';
	import EvidencePanel from './EvidencePanel.svelte';
	import {
		LEVEL_NAMES,
		UNSEEN,
		type CurriculumIndex,
		type StopModel,
		type StopState
	} from '$lib/curriculum/model';
	import Stamp from './Stamp.svelte';

	/** The body of the stop sheet: what the stop is, and the user's own progress on it. */
	let {
		index,
		stop,
		current = UNSEEN,
		query = ''
	}: { index: CurriculumIndex; stop: StopModel; current?: StopState; query?: string } = $props();

	const progress = getProgressContext();
	const region = $derived(index.region(stop.regionSlug));
	const row = $derived(progress.row(stop.id));
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

	// Ticking changes the level at once. The request follows, and a failure reloads the truth.
	async function toggle(criterionId: number, done: boolean) {
		const { from, to } = progress.tick(stop, criterionId, done);
		if (to > from && to >= 2) celebrate.levelUp(stop.slug, to);
		const res = await send<{ level: number; milestones: Milestone[] }>('/progress/criteria', {
			criterionId,
			done
		});
		if (res) celebrate.milestones(res.milestones, (slug) => index.region(slug)?.name ?? slug);
	}

	async function start() {
		progress.start(stop.id);
		await send('/progress/stop', { slug: stop.slug, start: true });
	}

	// Notes and best tempo save when the field is left, not on every key.
	let notes = $state('');
	let bpm = $state('');
	$effect(() => {
		void stop.slug;
		untrack(() => {
			notes = row?.notes ?? '';
			bpm = row?.bestBpm?.toString() ?? '';
		});
	});

	async function saveNotes() {
		if (notes === (row?.notes ?? '')) return;
		progress.saveDetails(stop.id, { notes });
		await send('/progress/stop', { slug: stop.slug, notes });
	}

	async function saveBpm() {
		const value = bpm.trim() === '' ? null : Number(bpm);
		if (value !== null && (!Number.isInteger(value) || value < 20 || value > 400)) {
			bpm = row?.bestBpm?.toString() ?? '';
			return;
		}
		if (value === (row?.bestBpm ?? null)) return;
		progress.saveDetails(stop.id, { bestBpm: value });
		await send('/progress/stop', { slug: stop.slug, bestBpm: value });
	}

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

	{#if current.rusting && row?.lastPracticedAt}
		<p class="rust-note">
			it's been {daysSince(row.lastPracticedAt, progress.now)} days. it misses you. play it for a minute,
			or re-tick the top criteria.
		</p>
	{/if}

	<p class="summary">{stop.summary}</p>

	{#if current.level === 0}
		<Button variant="ghost" onclick={start}>start learning this</Button>
	{/if}

	<div class="tempo">
		{#if stop.targetBpm}
			<p class="text-dim">target tempo <strong>{stop.targetBpm} bpm</strong></p>
		{/if}
		<label class="best">
			<span class="text-dim">your best</span>
			<input
				type="text"
				inputmode="numeric"
				placeholder="bpm"
				autocomplete="off"
				bind:value={bpm}
				onblur={saveBpm}
				onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
			/>
		</label>
	</div>

	<section aria-labelledby="criteria-heading">
		<h3 id="criteria-heading">what counts</h3>
		{#each levels as level (level)}
			<div class="level">
				<h4>{LEVEL_NAMES[level]}</h4>
				<ul class="criteria">
					{#each stop.criteria.filter((c) => c.level === level) as criterion (criterion.id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={progress.done.has(criterion.id)}
									onchange={(e) => toggle(criterion.id, e.currentTarget.checked)}
								/>
								<span class="box" aria-hidden="true"></span>
								<span>{criterion.text}</span>
							</label>
						</li>
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

	<EvidencePanel {stop} />

	<section aria-labelledby="notes-heading">
		<h3 id="notes-heading">notes</h3>
		<label class="sr-only" for="notes">notes for {stop.name}</label>
		<textarea
			id="notes"
			rows="3"
			maxlength="4000"
			placeholder="what clicked, what didn't. only you see this."
			bind:value={notes}
			onblur={saveNotes}></textarea>
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
	.criteria label {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		min-height: var(--tap);
		padding: 0.55rem 0;
		cursor: pointer;
	}
	.criteria input {
		position: absolute;
		opacity: 0;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0;
	}
	.box {
		flex: none;
		width: 1.05rem;
		height: 1.05rem;
		margin-top: 0.2rem;
		border: 1.5px solid var(--text-dim);
		transition: background-color 0.15s;
	}
	.criteria input:checked + .box {
		background: var(--accent);
		border-color: var(--accent);
		box-shadow: inset 0 0 0 3px var(--bg-cloud);
	}
	.criteria input:focus-visible + .box {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.tempo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.best {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.best input {
		width: 5rem;
		min-height: var(--tap);
		padding: 0 0.6rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.6rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
		resize: vertical;
	}
	.rust-note {
		padding-left: 0.75rem;
		border-left: 3px solid var(--rust);
		color: var(--text);
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
