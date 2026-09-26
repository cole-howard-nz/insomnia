<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Suggestion } from '$lib/progress/suggest';
	import Stamp from './Stamp.svelte';

	let { suggestions, query = '' }: { suggestions: Suggestion[]; query?: string } = $props();

	// Open when you arrive (so it greets you after sign-in), and stays how you leave it.
	const KEY = 'insomnia.next-open';
	let open = $state(true);
	onMount(() => {
		try {
			open = sessionStorage.getItem(KEY) !== 'closed';
		} catch {
			// storage blocked, stays open
		}
	});
	function toggled(event: Event) {
		open = (event.currentTarget as HTMLDetailsElement).open;
		try {
			sessionStorage.setItem(KEY, open ? 'open' : 'closed');
		} catch {
			// storage blocked, fine
		}
	}

	const label = { rusting: 'revisit', 'in-progress': 'push', fresh: 'new' } as const;
	const tone = { rusting: 'rust', 'in-progress': 'accent', fresh: 'dim' } as const;
	const href = (slug: string) => `${resolve('/(app)/map/[stop]', { stop: slug })}${query}`;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- every href comes from href(), which calls resolve() -->

<details class="next" {open} ontoggle={toggled}>
	<summary>what next?</summary>
	{#if suggestions.length === 0}
		<p class="text-dim">nothing to suggest. that's a strange, good place to be.</p>
	{:else}
		<ul>
			{#each suggestions as s (s.stop.slug)}
				<li>
					<a href={href(s.stop.slug)}>
						<span class="top">
							<Stamp tone={tone[s.kind]}>{label[s.kind]}</Stamp>
							<strong>{s.stop.name}</strong>
						</span>
						<span class="reason text-dim">{s.reason}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</details>

<style>
	.next {
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg-cloud) 85%, transparent);
		padding: 0 0.9rem;
	}
	summary {
		display: flex;
		align-items: center;
		min-height: var(--tap);
		cursor: pointer;
		font-family: var(--font-display);
		font-size: 1.05rem;
		letter-spacing: 0.04em;
		color: var(--accent);
	}
	ul {
		margin: 0;
		padding: 0 0 0.6rem;
		list-style: none;
		display: flex;
		flex-direction: column;
	}
	a {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-height: var(--tap);
		justify-content: center;
		padding: 0.35rem 0;
		color: var(--text);
		text-decoration: none;
		border-top: 1px solid var(--line);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.reason {
		font-size: 0.9375rem;
	}
	p {
		margin: 0;
		padding-bottom: 0.75rem;
	}
</style>
