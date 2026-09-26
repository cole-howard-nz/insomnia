<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import type { CurriculumData } from '$lib/curriculum/model';
	import {
		CHASING_OPTIONS,
		EXPERIENCE_OPTIONS,
		proposeSeeds,
		skippedSeeds,
		type Chasing,
		type Experience,
		type SeedProposal
	} from '$lib/onboarding/seed';

	let { data, form }: { data: { curriculum: CurriculumData }; form: { message?: string } | null } =
		$props();

	const names = $derived(new Map(data.curriculum.stops.map((s) => [s.slug, s.name])));
	const known = $derived(new Set(data.curriculum.stops.map((s) => s.slug)));

	// Steps 0 to 2 are the questions, 3 is the confirmation. Every answer has a default, so
	// any step can be skipped and the map is still never empty.
	let step = $state(0);
	let experience = $state<Experience | null>(null);
	let chasing = $state<Chasing[]>([]);
	let chasingText = $state('');
	let weeklyTargetDays = $state(3);
	let proposals = $state<SeedProposal[]>([]);
	let chosen = $state<string[]>([]);
	let submitting = $state(false);

	function toConfirm() {
		proposals = proposeSeeds({ experience: experience ?? 'new', chasing }, known);
		chosen = proposals.map((p) => p.slug);
		step = 3;
	}
	const next = () => (step === 2 ? toConfirm() : (step += 1));

	const payload = $derived(
		JSON.stringify({
			experience,
			chasing: [
				...CHASING_OPTIONS.filter((o) => chasing.includes(o.value)).map((o) => o.label),
				chasingText.trim()
			]
				.filter(Boolean)
				.join(', ')
				.slice(0, 200),
			weeklyTargetDays,
			seeds: (step === 3
				? proposals.filter((p) => chosen.includes(p.slug))
				: skippedSeeds(known)
			).map((p) => ({ slug: p.slug, level: p.level }))
		})
	);

	const playable = $derived(proposals.filter((p) => p.level === 2));
	const learning = $derived(proposals.filter((p) => p.level === 1));
</script>

<svelte:head><title>welcome · insomnia</title></svelte:head>

<div class="welcome">
	<header>
		<h1>{step === 3 ? 'here’s where we’d start you' : 'a few quick questions'}</h1>
		{#if step < 3}
			<p class="text-dim" aria-live="polite">{step + 1} of 3. skip any of them.</p>
		{:else}
			<p class="text-dim">
				untick anything that's wrong. the ones marked playable are only there because you said you
				can already do them.
			</p>
		{/if}
	</header>

	{#if form?.message}<p class="error" role="alert">{form.message}</p>{/if}

	{#if step === 0}
		<fieldset>
			<legend>where are you with the guitar?</legend>
			{#each EXPERIENCE_OPTIONS as option (option.value)}
				<label class="choice">
					<input type="radio" name="experience" value={option.value} bind:group={experience} />
					<span class="mark" aria-hidden="true"></span>
					<span>{option.label} <span class="text-dim">· {option.hint}</span></span>
				</label>
			{/each}
		</fieldset>
	{:else if step === 1}
		<fieldset>
			<legend>what are you chasing? pick any, or none.</legend>
			{#each CHASING_OPTIONS as option (option.value)}
				<label class="choice">
					<input type="checkbox" value={option.value} bind:group={chasing} />
					<span class="mark square" aria-hidden="true"></span>
					<span>{option.label}</span>
				</label>
			{/each}
			<label class="text">
				<span class="text-dim">or say it in your own words</span>
				<input
					type="text"
					maxlength="120"
					placeholder="a song, a band, a sound"
					bind:value={chasingText}
				/>
			</label>
		</fieldset>
	{:else if step === 2}
		<fieldset>
			<legend>how many days a week do you want to play?</legend>
			<div class="days" role="radiogroup" aria-label="days a week">
				{#each [1, 2, 3, 4, 5, 6, 7] as n (n)}
					<label class="day">
						<input type="radio" name="days" value={n} bind:group={weeklyTargetDays} />
						<span>{n}</span>
					</label>
				{/each}
			</div>
			<p class="text-dim">
				{weeklyTargetDays <= 2
					? 'small and steady counts.'
					: weeklyTargetDays <= 4
						? 'a good number. easy to keep.'
						: 'ambitious. the map will forgive a miss.'}
			</p>
		</fieldset>
	{:else}
		{#if proposals.length === 0}
			<p class="text-dim">nothing to suggest. you'll start with a clear map and a next step.</p>
		{/if}
		{#each [{ title: 'playable', list: playable, tone: 'accent' as const }, { title: 'learning', list: learning, tone: 'dim' as const }] as group (group.title)}
			{#if group.list.length}
				<fieldset>
					<legend><Stamp tone={group.tone}>{group.title}</Stamp></legend>
					{#each group.list as p (p.slug)}
						<label class="choice">
							<input type="checkbox" value={p.slug} bind:group={chosen} />
							<span class="mark square" aria-hidden="true"></span>
							<span>{names.get(p.slug)} <span class="text-dim">· {p.reason}</span></span>
						</label>
					{/each}
				</fieldset>
			{/if}
		{/each}
	{/if}

	<form
		method="POST"
		action="?/finish"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="payload" value={payload} />
		<div class="actions">
			{#if step < 3}
				<Button onclick={next}>next</Button>
				<Button variant="ghost" onclick={next}>skip this one</Button>
			{:else}
				<Button type="submit" disabled={submitting}
					>{submitting ? 'one sec…' : 'start with these'}</Button
				>
			{/if}
		</div>
		{#if step < 3}
			<Button type="submit" variant="ghost" disabled={submitting}
				>skip it all, just show me the map</Button
			>
		{:else}
			<Button variant="ghost" onclick={() => (step = 0)}>change my answers</Button>
		{/if}
	</form>
</div>

<style>
	.welcome {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	fieldset {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0 0 0.5rem;
		font-size: 1.05rem;
	}
	.choice {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-height: var(--tap);
		padding: 0.6rem 0;
		cursor: pointer;
	}
	.choice input {
		position: absolute;
		opacity: 0;
		width: 1.5rem;
		height: 1.5rem;
		margin: 0;
	}
	.mark {
		flex: none;
		width: 1.05rem;
		height: 1.05rem;
		margin-top: 0.2rem;
		border: 1.5px solid var(--text-dim);
		border-radius: 50%;
	}
	.mark.square {
		border-radius: 0;
	}
	.choice input:checked + .mark {
		background: var(--accent);
		border-color: var(--accent);
		box-shadow: inset 0 0 0 3px var(--bg-deep);
	}
	.choice input:focus-visible + .mark {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.5rem;
	}
	input[type='text'] {
		min-height: var(--tap);
		padding: 0 0.6rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
	}
	.days {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.day {
		position: relative;
	}
	.day input {
		position: absolute;
		opacity: 0;
		inset: 0;
		margin: 0;
		cursor: pointer;
	}
	.day span {
		display: grid;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		border: 1px solid var(--line);
		background: var(--bg-cloud);
	}
	.day input:checked + span {
		border-color: var(--accent);
		color: var(--accent);
	}
	.day input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.error {
		padding-left: 0.75rem;
		border-left: 3px solid var(--rust);
	}
</style>
