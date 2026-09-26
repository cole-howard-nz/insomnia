<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import { FEELS, type Feel } from '$lib/progress/model';
	import { send } from '$lib/progress/api';
	import { getProgressContext } from '$lib/progress/store.svelte';
	import { pushToast } from '$lib/toast.svelte';

	const progress = getProgressContext();

	// A session in progress survives a reload: which stops, and when the clock started.
	// running: the clock is counting. Paused time is banked in `banked` (ms).
	type Phase = 'pick' | 'running' | 'finish';
	const STORE_KEY = 'insomnia.practice';

	let phase = $state<Phase>('pick');
	let slugs = $state<string[]>([]);
	let startedAt = $state(0);
	let banked = $state(0);
	let paused = $state(false);
	let tick = $state(Date.now());
	let ready = $state(false);

	let minutes = $state(15);
	let feel = $state<Feel | null>(null);
	let note = $state('');
	let bpms = $state<Record<string, string>>({});
	let saving = $state(false);
	let query = $state('');

	const stops = $derived(progress.data.stops);
	const chosen = $derived(slugs.map((s) => stops.find((x) => x.slug === s)).filter((s) => !!s));
	const elapsed = $derived(banked + (phase === 'running' && !paused ? tick - startedAt : 0));

	const clock = $derived.by(() => {
		const total = Math.floor(elapsed / 1000);
		const h = Math.floor(total / 3600);
		const m = Math.floor((total % 3600) / 60);
		const s = total % 60;
		const pad = (n: number) => String(n).padStart(2, '0');
		return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
	});

	// Quick picks: what next, then whatever was touched most recently.
	const quick = $derived.by(() => {
		const out: { slug: string; name: string }[] = [];
		const add = (slug: string) => {
			const stop = stops.find((s) => s.slug === slug);
			if (stop && !slugs.includes(slug) && !out.some((o) => o.slug === slug)) {
				out.push({ slug, name: stop.name });
			}
		};
		progress.suggestions.forEach((s) => add(s.stop.slug));
		Object.entries(progress.derived.touched)
			.sort((a, b) => Date.parse(b[1] ?? '0') - Date.parse(a[1] ?? '0'))
			.forEach(([slug]) => add(slug));
		return out.slice(0, 6);
	});

	const matches = $derived(
		query.trim().length === 0
			? []
			: stops
					.filter(
						(s) =>
							!slugs.includes(s.slug) && s.name.toLowerCase().includes(query.trim().toLowerCase())
					)
					.slice(0, 6)
	);

	function save() {
		try {
			if (phase === 'pick' && slugs.length === 0) sessionStorage.removeItem(STORE_KEY);
			else
				sessionStorage.setItem(
					STORE_KEY,
					JSON.stringify({ phase, slugs, startedAt, banked, paused })
				);
		} catch {
			// storage can be blocked, the session just will not survive a reload
		}
	}

	onMount(() => {
		try {
			const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? 'null');
			if (saved && Array.isArray(saved.slugs)) {
				phase = saved.phase === 'running' || saved.phase === 'finish' ? saved.phase : 'pick';
				slugs = saved.slugs.filter((s: unknown) => typeof s === 'string');
				startedAt = Number(saved.startedAt) || Date.now();
				banked = Number(saved.banked) || 0;
				paused = Boolean(saved.paused);
				if (phase === 'finish') minutes = Math.max(1, Math.round(banked / 60000));
			}
		} catch {
			// nothing usable saved
		}
		ready = true;
		const timer = setInterval(() => (tick = Date.now()), 1000);
		return () => {
			clearInterval(timer);
			release();
		};
	});

	// Keep the screen on while playing, if the browser allows it.
	let lock: { release: () => Promise<void> } | undefined;
	async function hold() {
		try {
			lock = await (
				navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<typeof lock> } }
			).wakeLock?.request('screen');
		} catch {
			// not allowed, fine
		}
	}
	function release() {
		lock?.release().catch(() => {});
		lock = undefined;
	}

	function add(slug: string) {
		if (!slugs.includes(slug) && slugs.length < 10) slugs = [...slugs, slug];
		query = '';
		save();
	}
	function remove(slug: string) {
		slugs = slugs.filter((s) => s !== slug);
		save();
	}

	function begin() {
		startedAt = Date.now();
		tick = startedAt;
		banked = 0;
		paused = false;
		phase = 'running';
		hold();
		save();
	}

	function togglePause() {
		if (paused) {
			startedAt = Date.now();
			tick = startedAt;
			paused = false;
			hold();
		} else {
			banked += Date.now() - startedAt;
			paused = true;
			release();
		}
		save();
	}

	function finish() {
		if (!paused) banked += Date.now() - startedAt;
		paused = true;
		minutes = Math.max(1, Math.round(banked / 60000));
		phase = 'finish';
		release();
		save();
	}

	/** Skip the timer and log something already played. */
	function logPast() {
		banked = 0;
		minutes = 15;
		phase = 'finish';
		save();
	}

	function discard() {
		phase = 'pick';
		slugs = [];
		banked = 0;
		paused = false;
		feel = null;
		note = '';
		bpms = {};
		release();
		save();
	}

	const step = (n: number) => (minutes = Math.min(720, Math.max(1, minutes + n)));

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!feel || saving) return;
		saving = true;
		const body = {
			minutes,
			feel,
			note,
			stops: slugs.map((slug) => {
				const n = Number(bpms[slug]);
				return { slug, bpm: Number.isInteger(n) && n >= 20 && n <= 400 ? n : null };
			})
		};
		const res = await send('/practice/log', body);
		saving = false;
		if (!res) return;
		pushToast(`logged. ${minutes} minute${minutes === 1 ? '' : 's'}.`);
		discard();
		await invalidateAll();
		await goto(resolve('/log'));
	}
</script>

<svelte:head><title>practice · insomnia</title></svelte:head>

<h1>practice</h1>

{#if !ready}
	<p class="text-dim">&nbsp;</p>
{:else if phase === 'pick'}
	<section class="pick">
		<h2>what are you playing?</h2>
		<p class="text-dim">pick a stop or two. or none, and just play.</p>

		{#if chosen.length}
			<ul class="chips" aria-label="chosen stops">
				{#each chosen as stop (stop.slug)}
					<li>
						<button type="button" class="chip on" onclick={() => remove(stop.slug)}>
							{stop.name} <span aria-hidden="true">×</span>
							<span class="sr-only">remove</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if quick.length}
			<ul class="chips" aria-label="quick picks">
				{#each quick as q (q.slug)}
					<li><button type="button" class="chip" onclick={() => add(q.slug)}>{q.name}</button></li>
				{/each}
			</ul>
		{/if}

		<label class="search">
			<span class="text-dim">find a stop</span>
			<input type="search" bind:value={query} autocomplete="off" placeholder="barre, pentatonic…" />
		</label>
		{#if matches.length}
			<ul class="chips" aria-label="matches">
				{#each matches as m (m.slug)}
					<li><button type="button" class="chip" onclick={() => add(m.slug)}>{m.name}</button></li>
				{/each}
			</ul>
		{/if}
	</section>

	<div class="dock">
		<Button onclick={begin} class="wide">start</Button>
		<button type="button" class="link" onclick={logPast}>already played? log it</button>
	</div>
{:else if phase === 'running'}
	<section class="running" aria-label="session in progress">
		<p class="clock" role="timer" aria-live="off">{clock}</p>
		{#if paused}<p class="center text-dim">paused.</p>{/if}
		{#if chosen.length}
			<ul class="working">
				{#each chosen as stop (stop.slug)}<li>{stop.name}</li>{/each}
			</ul>
		{:else}
			<p class="center text-dim">just playing.</p>
		{/if}
	</section>

	<div class="dock">
		<Button onclick={finish} class="wide">finish</Button>
		<Button variant="ghost" onclick={togglePause} class="wide">{paused ? 'resume' : 'pause'}</Button
		>
	</div>
{:else}
	<form class="finish" onsubmit={submit}>
		<h2>how did it go?</h2>

		<div class="minutes">
			<button type="button" class="round" aria-label="5 minutes less" onclick={() => step(-5)}
				>−</button
			>
			<label>
				<span class="sr-only">minutes</span>
				<input
					type="number"
					inputmode="numeric"
					min="1"
					max="720"
					bind:value={minutes}
					aria-label="minutes"
				/>
				<span class="text-dim">minutes</span>
			</label>
			<button type="button" class="round" aria-label="5 minutes more" onclick={() => step(5)}
				>+</button
			>
		</div>

		<fieldset>
			<legend class="sr-only">how it felt</legend>
			<div class="feels">
				{#each FEELS as f (f)}
					<label class="feel" class:on={feel === f}>
						<input type="radio" name="feel" value={f} bind:group={feel} required />
						<span>{f}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		{#if chosen.length}
			<div class="bpms">
				<p class="text-dim">tempo you got to, if you kept track</p>
				{#each chosen as stop (stop.slug)}
					<label class="bpm">
						<span>{stop.name}</span>
						<input
							type="text"
							inputmode="numeric"
							placeholder="bpm"
							autocomplete="off"
							bind:value={bpms[stop.slug]}
						/>
					</label>
				{/each}
			</div>
		{/if}

		<label class="note">
			<span class="text-dim">a note, if you want one</span>
			<textarea rows="2" maxlength="1000" bind:value={note}></textarea>
		</label>

		<div class="dock static">
			<Button type="submit" disabled={!feel || saving} class="wide">
				{saving ? 'saving…' : 'save'}
			</Button>
			<button type="button" class="link" onclick={discard}>throw it away</button>
		</div>
	</form>
{/if}

<style>
	h2 {
		font-size: 1.2rem;
		margin: 0;
	}
	.pick,
	.finish {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.chip {
		min-height: var(--tap);
		padding: 0.3rem 0.8rem;
		background: var(--bg-cloud);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}
	.chip.on {
		border-color: var(--accent);
		color: var(--accent);
	}
	.search {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		min-height: var(--tap);
		padding: 0.5rem 0.7rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
	}
	/* The controls sit in the lower half, where a thumb rests. */
	.dock {
		position: fixed;
		left: 0;
		right: 0;
		bottom: calc(var(--tabbar-h) + var(--safe-bottom));
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		max-width: 40rem;
		margin: 0 auto;
		padding: 0.75rem calc(var(--safe-right) + 1rem) 0.75rem calc(var(--safe-left) + 1rem);
		background: color-mix(in srgb, var(--bg-deep) 92%, transparent);
	}
	.dock.static {
		position: static;
		padding: 0;
		background: none;
	}
	.dock :global(.wide) {
		width: 100%;
		min-height: 3.5rem;
		font-size: 1.25rem;
	}
	.link {
		min-height: var(--tap);
		background: none;
		border: none;
		color: var(--text-dim);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.running {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 2rem;
	}
	.clock {
		margin: 0;
		text-align: center;
		font-family: var(--font-display);
		font-size: clamp(3.5rem, 22vw, 6rem);
		font-variant-numeric: tabular-nums;
		color: var(--accent);
		letter-spacing: 0.02em;
	}
	.center {
		text-align: center;
	}
	.working {
		margin: 0;
		padding: 0;
		list-style: none;
		text-align: center;
		font-size: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.minutes {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	.minutes label {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.minutes input {
		width: 6rem;
		text-align: center;
		font-family: var(--font-display);
		font-size: 2rem;
		min-height: 3.5rem;
	}
	.round {
		width: 3.5rem;
		height: 3.5rem;
		background: var(--bg-cloud);
		border: 1px solid var(--line);
		color: var(--text);
		font-size: 1.5rem;
		cursor: pointer;
	}
	fieldset {
		border: none;
		margin: 0;
		padding: 0;
	}
	.feels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.feel {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 3.5rem;
		padding: 0.3rem;
		background: var(--bg-cloud);
		border: 1px solid var(--line);
		text-align: center;
		cursor: pointer;
		font-size: 0.9375rem;
	}
	.feel input {
		position: absolute;
		opacity: 0;
		inset: 0;
		min-height: 0;
		cursor: pointer;
	}
	.feel.on {
		border-color: var(--accent);
		color: var(--accent);
	}
	.feel:focus-within {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.bpms {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.bpm {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.bpm input {
		width: 5.5rem;
	}
	.note {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
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
