<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import Moment from '$lib/components/Moment.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import type { CurriculumData } from '$lib/curriculum/model';
	import type { ProgressSnapshot } from '$lib/progress/model';
	import { ProgressStore, setProgressContext } from '$lib/progress/store.svelte';
	import { skyValue } from '$lib/progress/logic';
	import { page } from '$app/state';
	import { weather } from '$lib/weather.svelte';

	let {
		data,
		children
	}: {
		data: { curriculum: CurriculumData; progress: ProgressSnapshot; now: number };
		children: Snippet;
	} = $props();

	const store = new ProgressStore();
	const sync = () => store.load(data.curriculum, data.progress, data.now);
	setProgressContext(store);
	// Loaded up front so the first server render already has the user's map. Reloaded
	// whenever the layout data does (after a session is logged, say).
	sync();
	$effect.pre(sync);

	// The sky follows progress, in both directions: a rusting stop closes it back in.
	$effect(() => {
		weather.set(store.summary.sky);
		for (const [slug, value] of Object.entries(store.summary.regions)) {
			weather.setRegion(slug, skyValue(value));
		}
	});
	// Leaving the app (sign out) goes back to the heavy sky of the public page.
	onMount(() => () => weather.set(0));
</script>

<main>
	{@render children()}
</main>
{#if page.url.pathname !== '/welcome'}<TabBar />{/if}
<Moment />

<style>
	main {
		box-sizing: border-box;
		min-height: 100dvh;
		max-width: 40rem;
		margin: 0 auto;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--tabbar-h) + var(--safe-bottom) + 1.5rem) calc(var(--safe-left) + 1rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
