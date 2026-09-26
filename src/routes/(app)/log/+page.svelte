<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Stamp from '$lib/components/Stamp.svelte';
	import type { CurriculumData } from '$lib/curriculum/model';
	import type { PracticeSession } from '$lib/progress/model';
	import type { StreakSummary } from '$lib/progress/streak';

	let {
		data
	}: {
		data: {
			curriculum: CurriculumData;
			sessions: PracticeSession[];
			filter: string | null;
			streak: StreakSummary;
		};
	} = $props();

	const stopName = (id: number) => data.curriculum.stops.find((s) => s.id === id)?.name ?? 'a stop';
	const streak = $derived(data.streak);

	// Only stops the user has been in a session with are worth filtering by, plus the current one.
	const filterable = $derived(
		data.curriculum.stops
			.filter(
				(s) =>
					data.filter === s.slug ||
					data.sessions.some((x) => x.stops.some((y) => y.stopId === s.id))
			)
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	const days = $derived.by(() => {
		const out: { date: string; sessions: PracticeSession[] }[] = [];
		for (const session of data.sessions) {
			const last = out.at(-1);
			if (last?.date === session.practicedOn) last.sessions.push(session);
			else out.push({ date: session.practicedOn, sessions: [session] });
		}
		return out;
	});

	const dayLabel = (date: string) =>
		new Date(`${date}T00:00:00Z`)
			.toLocaleDateString('en-NZ', {
				weekday: 'short',
				day: 'numeric',
				month: 'short',
				timeZone: 'UTC'
			})
			.toLowerCase();
	const feelLabel = { sloppy: 'sloppy', clean: 'clean', breakthrough: 'breakthrough' } as const;
	const feelTone = { sloppy: 'dim', clean: 'accent', breakthrough: 'clear' } as const;

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	function filterBy(slug: string) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved here
		goto(slug ? `${resolve('/log')}?stop=${encodeURIComponent(slug)}` : resolve('/log'), {
			keepFocus: true
		});
	}
</script>

<svelte:head><title>log · insomnia</title></svelte:head>

<h1>log</h1>

<section class="week" aria-label="this week">
	<p class="big">
		<strong>{streak.daysThisWeek}</strong> of {plural(streak.target, 'day')} this week
	</p>
	<p class="text-dim">
		{streak.minutesThisWeek} minutes so far.
		{#if streak.dayStreak > 1}{streak.dayStreak} days in a row.{/if}
		{#if streak.weekStreak > 1}{streak.weekStreak} weeks in a row on target.{/if}
		{#if streak.dayStreak === 0 && streak.daysThisWeek === 0}
			no pressure. the guitar is still there.
		{/if}
	</p>
</section>

{#if data.sessions.length > 0 || data.filter}
	<label class="filter">
		<span class="text-dim">filter by stop</span>
		<select value={data.filter ?? ''} onchange={(e) => filterBy(e.currentTarget.value)}>
			<option value="">all stops</option>
			{#each filterable as stop (stop.slug)}
				<option value={stop.slug}>{stop.name}</option>
			{/each}
		</select>
	</label>
{/if}

{#if data.sessions.length === 0}
	<p class="text-dim">nothing here yet. that's okay.</p>
{:else}
	{#each days as day (day.date)}
		<section class="day">
			<h2>{dayLabel(day.date)}</h2>
			{#each day.sessions as session (session.id)}
				<article>
					<p class="head">
						<strong>{plural(session.minutes, 'min')}</strong>
						<Stamp tone={feelTone[session.feel]}>{feelLabel[session.feel]}</Stamp>
					</p>
					{#if session.stops.length > 0}
						<ul>
							{#each session.stops as s (s.stopId)}
								<li>
									{stopName(s.stopId)}{#if s.bpm}
										<span class="text-dim"> · {s.bpm} bpm</span>{/if}
								</li>
							{/each}
						</ul>
					{/if}
					{#if session.note}<p class="note text-dim">{session.note}</p>{/if}
				</article>
			{/each}
		</section>
	{/each}
{/if}

<style>
	.week {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.9rem;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg-cloud) 85%, transparent);
	}
	.big {
		font-size: 1.15rem;
	}
	.big strong {
		color: var(--accent);
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 400;
	}
	.filter {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	select {
		min-height: var(--tap);
		padding: 0 0.6rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
		color: var(--text);
		font: inherit;
	}
	.day {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	h2 {
		font-size: 1rem;
		color: var(--text-dim);
		margin: 0;
	}
	article {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg-cloud) 85%, transparent);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.note {
		font-size: 0.9375rem;
		white-space: pre-wrap;
	}
</style>
