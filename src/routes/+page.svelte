<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import { indexCurriculum, type CurriculumData } from '$lib/curriculum/model';
	import { DEMO_STATES } from '$lib/landing-demo';
	import { weather } from '$lib/weather.svelte';

	let { data }: { data: { curriculum: CurriculumData; user: App.Locals['user'] } } = $props();
	const index = $derived(indexCurriculum(data.curriculum));
	const deleted = $derived(page.url.searchParams.get('deleted') === '1');

	// Heavy rain to begin with, like a new account. It thins a little for the visitor who stays.
	onMount(() => {
		weather.set(0.12);
		return () => weather.set(0);
	});
</script>

<svelte:head>
	<title>insomnia · a map for learning guitar</title>
	<meta
		name="description"
		content="a map of what to learn on guitar, and what you've let go quiet. the sky clears as you get better."
	/>
	<meta property="og:title" content="insomnia" />
	<meta
		property="og:description"
		content="a map of what to learn on guitar, and what you've let go quiet."
	/>
</svelte:head>

<main>
	{#if deleted}
		<p class="notice" role="status">your account is gone, and everything in it. take care.</p>
	{/if}

	<header>
		<Stamp tone="accent">still up?</Stamp>
		<h1>insomnia</h1>
		<p class="pitch">
			a map of what to learn on guitar, and what you've let go quiet. the sky is the progress bar:
			heavy rain when you start, breaks in the cloud as you get better.
		</p>
		{#if data.user}
			<Button href={resolve('/map')}>open the map</Button>
		{:else}
			<div class="actions">
				<Button href={resolve('/sign-up')}>make an account</Button>
				<Button href={resolve('/sign-in')} variant="ghost">sign in</Button>
			</div>
		{/if}
	</header>

	<section class="preview-wrap" aria-labelledby="preview-heading">
		<h2 id="preview-heading" class="sr-only">a look at the map</h2>
		<p class="caption text-dim">
			{data.curriculum.stops.length} stops in {data.curriculum.regions.length} regions. this is a made-up
			map a few weeks in. drag it around, nothing here is locked.
		</p>
		<div class="preview">
			<MapView {index} states={DEMO_STATES} />
		</div>
	</section>

	<section class="points" aria-label="what it does">
		<div>
			<h3>tick what you can actually do</h3>
			<p class="text-dim">
				every stop has concrete criteria. change between g and c in under two seconds, five times in
				a row. no self-grading on vibes.
			</p>
		</div>
		<div>
			<h3>see what's going quiet</h3>
			<p class="text-dim">
				leave a skill alone and a small cloud gathers over it. it isn't a punishment. it's just
				honest.
			</p>
		</div>
		<div>
			<h3>keep proof</h3>
			<p class="text-dim">
				record a clip now and another in two months. hear the difference. only you can hear them.
			</p>
		</div>
	</section>

	<footer>
		<nav aria-label="footer" class="text-dim">
			<a href={resolve('/privacy')}>privacy</a>
			<a href={resolve('/terms')}>terms</a>
		</nav>
	</footer>
</main>

<style>
	main {
		box-sizing: border-box;
		max-width: 40rem;
		margin: 0 auto;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--safe-bottom) + 1.5rem) calc(var(--safe-left) + 1rem);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.9rem;
	}
	h1 {
		font-size: clamp(2.6rem, 12vw, 4rem);
		transform: rotate(-0.6deg);
	}
	.pitch {
		font-size: 1.05rem;
		max-width: 32rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.notice {
		padding: 0.6rem 0.75rem;
		border-left: 3px solid var(--clear);
		background: color-mix(in srgb, var(--bg-cloud) 88%, transparent);
	}
	.preview-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.caption {
		font-size: 0.9375rem;
	}
	.preview {
		height: 65dvh;
		min-height: 24rem;
		margin-inline: -1rem;
	}
	.points {
		display: grid;
		gap: 1.25rem;
	}
	.points div {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-left: 0.75rem;
		border-left: 1px solid var(--line);
	}
	footer nav {
		display: flex;
		gap: 1.25rem;
	}
	footer a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
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
