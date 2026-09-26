<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { celebrate } from '$lib/celebrate.svelte';
	import { LEVEL_NAMES, type StopModel } from '$lib/curriculum/model';
	import {
		MAX_CLIP_SECONDS,
		MAX_FILE_BYTES,
		MAX_NOTE_CHARS,
		megabytes
	} from '$lib/evidence/config';
	import { clock } from '$lib/evidence/recorder';
	import { buildTimeline, dayLabel, defaultCompare, recordings } from '$lib/evidence/timeline';
	import type { EvidenceItem, StopEvidence } from '$lib/evidence/types';
	import { getProgressContext } from '$lib/progress/store.svelte';
	import { pushToast } from '$lib/toast.svelte';
	import Button from './Button.svelte';
	import Recorder from './Recorder.svelte';

	/** Recordings and notes on a stop, the timeline of its levels, and day 1 versus day 60. */
	let { stop }: { stop: StopModel } = $props();

	const progress = getProgressContext();
	const verified = $derived(page.data.user?.emailVerified ?? false);
	const justLevelledUp = $derived(celebrate.ignited?.slug === stop.slug);

	let loaded = $state<StopEvidence | null>(null);
	let loadFailed = $state(false);
	let mode = $state<'idle' | 'audio' | 'video' | 'note'>('idle');
	let draft = $state<{ blob: Blob; seconds: number | null; url: string } | null>(null);
	let caption = $state('');
	let saving = $state(false);
	let confirming = $state<string | null>(null);

	/** `quiet` refetches without blanking the list, for changes the person just made elsewhere. */
	async function load(quiet = false) {
		const slug = stop.slug;
		if (!quiet) loaded = null;
		loadFailed = false;
		try {
			const res = await fetch(`${resolve('/(app)/evidence')}?stop=${encodeURIComponent(slug)}`);
			if (!res.ok) throw new Error(String(res.status));
			const body = (await res.json()) as StopEvidence;
			if (slug === stop.slug) loaded = body;
		} catch {
			if (slug === stop.slug) loadFailed = true;
		}
	}
	$effect(() => {
		void stop.slug;
		// A new stop starts clean. Only the slug is tracked, not the draft this resets.
		untrack(() => {
			clearDraft();
			mode = 'idle';
			confirming = null;
			void load();
		});
	});

	// A tick that has just been saved may have added a level event to this stop's timeline.
	let lastSaved = progress.saved;
	$effect(() => {
		const saved = progress.saved;
		if (saved === lastSaved) return;
		lastSaved = saved;
		untrack(() => void load(true));
	});

	function clearDraft() {
		if (draft) URL.revokeObjectURL(draft.url);
		draft = null;
		caption = '';
	}
	onDestroy(clearDraft);

	const timeline = $derived(loaded ? buildTimeline(loaded.levels, loaded.items) : []);
	const clips = $derived(loaded ? recordings(loaded.items) : []);

	// "Day 1 versus day 60": two picks, the first and the latest by default.
	let leftId = $state<string | null>(null);
	let rightId = $state<string | null>(null);
	$effect(() => {
		const pair = loaded ? defaultCompare(loaded.items) : null;
		leftId = pair?.[0].id ?? null;
		rightId = pair?.[1].id ?? null;
	});
	const byId = (id: string | null) => clips.find((c) => c.id === id);
	const firstAt = $derived(timeline[0]?.at);
	const dayOf = (item: EvidenceItem) => timeline.find((t) => t.at === item.createdAt)?.day ?? 1;

	const src = (id: string) => resolve('/(app)/evidence/[id]', { id });
	const describe = (item: EvidenceItem) =>
		`${dayLabel(dayOf(item))}, ${LEVEL_NAMES[item.levelAt as 0 | 1 | 2 | 3 | 4]}`;
	const when = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	function keep(blob: Blob, seconds: number | null) {
		clearDraft();
		draft = { blob, seconds, url: URL.createObjectURL(blob) };
		mode = 'idle';
	}

	/** Reads a picked file's length from its own metadata, or null when the browser cannot. */
	function probeSeconds(file: File): Promise<number | null> {
		return new Promise((done) => {
			const el = document.createElement(file.type.startsWith('video') ? 'video' : 'audio');
			const url = URL.createObjectURL(file);
			const finish = (value: number | null) => {
				URL.revokeObjectURL(url);
				done(value);
			};
			el.preload = 'metadata';
			el.onloadedmetadata = () => finish(Number.isFinite(el.duration) ? el.duration : null);
			el.onerror = () => finish(null);
			setTimeout(() => finish(null), 4000);
			el.src = url;
		});
	}

	async function picked(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		if (file.size > MAX_FILE_BYTES) {
			pushToast(
				`that's ${megabytes(file.size)} mb. the limit is ${megabytes(MAX_FILE_BYTES)}. try a shorter clip.`,
				'error'
			);
			return;
		}
		const seconds = await probeSeconds(file);
		if (seconds !== null && seconds > MAX_CLIP_SECONDS) {
			pushToast(`clips are ${MAX_CLIP_SECONDS / 60} minutes at most.`, 'error');
			return;
		}
		keep(file, seconds === null ? null : Math.round(seconds));
	}

	async function upload(form: { note: string; file?: { blob: Blob; seconds: number | null } }) {
		saving = true;
		try {
			const body = new FormData();
			body.set('slug', stop.slug);
			body.set('note', form.note);
			if (form.file) {
				const type = form.file.blob.type || 'application/octet-stream';
				body.set('file', new File([form.file.blob], 'clip', { type }));
				if (form.file.seconds !== null) body.set('seconds', String(form.file.seconds));
			}
			const res = await fetch(resolve('/(app)/evidence'), { method: 'POST', body });
			if (!res.ok) {
				const message = ((await res.json().catch(() => null)) as { message?: string } | null)
					?.message;
				pushToast(message ?? 'something broke. not you. try again.', 'error');
				return false;
			}
			clearDraft();
			mode = 'idle';
			await load();
			return true;
		} finally {
			saving = false;
		}
	}

	const saveDraft = () => upload({ note: caption, file: draft ?? undefined });

	async function remove(id: string) {
		const res = await fetch(src(id), { method: 'DELETE' });
		confirming = null;
		if (!res.ok) return pushToast('something broke. not you. try again.', 'error');
		await load();
	}
</script>

<section aria-labelledby="evidence-heading">
	<h3 id="evidence-heading">proof</h3>
	<p class="hint text-dim">
		only you can see or hear any of this. record it now, hear it again in a month.
	</p>

	{#if justLevelledUp}
		<p class="prompt">you just moved up. record how it sounds now?</p>
	{/if}

	{#if !verified}
		<p class="text-dim">
			recordings need a verified email. <a href={resolve('/me')}>verify it on your account page</a>.
			notes are fine until then.
		</p>
	{/if}

	{#if draft}
		<div class="review">
			{#if draft.blob.type.startsWith('video')}
				<video src={draft.url} controls playsinline preload="metadata"
					><track kind="captions" /></video
				>
			{:else}
				<audio src={draft.url} controls preload="metadata"></audio>
			{/if}
			<label class="sr-only" for="caption">caption</label>
			<input
				id="caption"
				type="text"
				maxlength={MAX_NOTE_CHARS}
				placeholder="a caption, if you want one"
				bind:value={caption}
			/>
			<div class="actions">
				<Button onclick={saveDraft} disabled={saving}>{saving ? 'saving…' : 'keep it'}</Button>
				<Button variant="ghost" onclick={clearDraft} disabled={saving}>throw it away</Button>
			</div>
		</div>
	{:else if mode === 'audio' || mode === 'video'}
		<Recorder
			kind={mode}
			ondone={(clip) => keep(clip.blob, clip.seconds)}
			oncancel={() => (mode = 'idle')}
		/>
	{:else if mode === 'note'}
		<form
			class="note-form"
			onsubmit={async (e) => {
				e.preventDefault();
				if (await upload({ note: caption })) caption = '';
			}}
		>
			<label class="sr-only" for="evidence-note">a note for this moment</label>
			<textarea
				id="evidence-note"
				rows="3"
				maxlength={MAX_NOTE_CHARS}
				placeholder="how does it feel right now? honest, not kind."
				bind:value={caption}></textarea>
			<div class="actions">
				<Button type="submit" disabled={saving || !caption.trim()}>save note</Button>
				<Button
					variant="ghost"
					onclick={() => {
						mode = 'idle';
						caption = '';
					}}>cancel</Button
				>
			</div>
		</form>
	{:else}
		<div class="actions">
			<Button variant="ghost" onclick={() => (mode = 'audio')} disabled={!verified}>
				record audio
			</Button>
			<Button variant="ghost" onclick={() => (mode = 'video')} disabled={!verified}>
				record video
			</Button>
			<label class="pick btn btn-ghost" class:disabled={!verified}>
				pick a file
				<input type="file" accept="audio/*,video/*" onchange={picked} disabled={!verified} />
			</label>
			<Button variant="ghost" onclick={() => (mode = 'note')}>write a note</Button>
		</div>
		<p class="hint text-dim">
			up to {MAX_CLIP_SECONDS / 60} minutes, {megabytes(MAX_FILE_BYTES)} mb.
		</p>
	{/if}

	{#if loadFailed}
		<p class="text-dim" role="alert">
			couldn't load your proof. <button class="link" onclick={() => load()}>try again</button>
		</p>
	{:else if loaded === null}
		<p class="text-dim" role="status">looking…</p>
	{:else}
		{@const left = byId(leftId)}
		{@const right = byId(rightId)}
		{#if left && right}
			<div class="compare" aria-label="compare two recordings">
				<h4>then and now</h4>
				<div class="pair">
					{#each [{ id: 'left', item: left, pick: leftId }, { id: 'right', item: right, pick: rightId }] as side (side.id)}
						<div class="side">
							<label class="text-dim" for="pick-{side.id}">{describe(side.item)}</label>
							<select
								id="pick-{side.id}"
								value={side.pick}
								onchange={(e) =>
									side.id === 'left'
										? (leftId = e.currentTarget.value)
										: (rightId = e.currentTarget.value)}
							>
								{#each clips as clip (clip.id)}
									<option value={clip.id}>{describe(clip)} · {when(clip.createdAt)}</option>
								{/each}
							</select>
							{#key side.item.id}
								{#if side.item.kind === 'video'}
									<video src={src(side.item.id)} controls playsinline preload="metadata"
										><track kind="captions" /></video
									>
								{:else}
									<audio src={src(side.item.id)} controls preload="metadata"></audio>
								{/if}
							{/key}
						</div>
					{/each}
				</div>
			</div>
		{:else if clips.length === 1}
			<p class="text-dim">one recording so far. add another later and they'll play side by side.</p>
		{/if}

		{#if timeline.length === 0}
			<p class="text-dim">nothing here yet. that's okay.</p>
		{:else}
			<ol class="timeline" aria-label="timeline for {stop.name}">
				{#each timeline as entry (entry.type + entry.at + (entry.type === 'evidence' ? entry.item.id : entry.event.toLevel))}
					<li class={entry.type}>
						<span class="when text-dim">{dayLabel(entry.day)} · {when(entry.at)}</span>
						{#if entry.type === 'level'}
							<span class="what">
								{entry.event.toLevel > entry.event.fromLevel ? 'reached' : 'back to'}
								<strong>{LEVEL_NAMES[entry.event.toLevel as 0 | 1 | 2 | 3 | 4]}</strong>
							</span>
						{:else}
							{@const item = entry.item}
							<span class="what">
								{item.kind === 'note' ? 'a note' : item.kind}
								{#if item.durationSeconds}<span class="text-dim">{clock(item.durationSeconds)}</span
									>{/if}
							</span>
							{#if item.note}<p class="caption">{item.note}</p>{/if}
							{#if item.kind === 'audio'}
								<audio src={src(item.id)} controls preload="none"></audio>
							{:else if item.kind === 'video'}
								<video src={src(item.id)} controls playsinline preload="none"
									><track kind="captions" /></video
								>
							{/if}
							{#if confirming === item.id}
								<span class="confirm" role="alert">
									delete this for good?
									<button class="link danger" onclick={() => remove(item.id)}>delete</button>
									<button class="link" onclick={() => (confirming = null)}>keep</button>
								</span>
							{:else}
								<button class="link danger" onclick={() => (confirming = item.id)}>
									delete<span class="sr-only"> this {item.kind} from {when(item.createdAt)}</span>
								</button>
							{/if}
						{/if}
					</li>
				{/each}
			</ol>
			{#if firstAt}
				<p class="hint text-dim">
					{megabytes(loaded.usedBytes)} of {megabytes(loaded.limitBytes)} mb used across the app.
				</p>
			{/if}
		{/if}
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
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
	.hint {
		font-size: 0.9375rem;
	}
	.prompt {
		padding-left: 0.75rem;
		border-left: 3px solid var(--clear);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.review,
	.note-form,
	.side {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.pick {
		position: relative;
		cursor: pointer;
	}
	.pick input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
		width: 100%;
	}
	.pick:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.pick.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	audio,
	video {
		width: 100%;
	}
	video {
		max-height: 16rem;
		background: var(--bg-deep);
	}
	input[type='text'],
	textarea,
	select {
		width: 100%;
		box-sizing: border-box;
		min-height: var(--tap);
		padding: 0.6rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
	}
	textarea {
		resize: vertical;
	}
	.compare {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
	}
	.pair {
		display: grid;
		gap: 0.9rem;
	}
	@media (min-width: 34rem) {
		.pair {
			grid-template-columns: 1fr 1fr;
		}
	}
	.timeline {
		margin: 0;
		padding: 0 0 0 0.9rem;
		list-style: none;
		border-left: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.timeline li {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
	}
	.timeline li::before {
		content: '';
		position: absolute;
		left: calc(-0.9rem - 4px);
		top: 0.5rem;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--text-dim);
	}
	.timeline li.evidence::before {
		background: var(--accent);
	}
	.when {
		font-size: 0.875rem;
	}
	.caption {
		margin: 0;
	}
	.link {
		background: none;
		border: 0;
		padding: 0.35rem 0;
		min-height: 1.75rem;
		color: var(--text-dim);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.link.danger {
		color: var(--text-dim);
	}
	.link:hover,
	.link:focus-visible {
		color: var(--text);
	}
	.confirm {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
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
