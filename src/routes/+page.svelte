<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { indexCurriculum, type CurriculumData } from '$lib/curriculum/model';

	// The seed of the landing page (phase 4): a read-only look at the map.
	let { data }: { data: { curriculum: CurriculumData; user: App.Locals['user'] } } = $props();
	const index = $derived(indexCurriculum(data.curriculum));
</script>

<svelte:head><title>insomnia</title></svelte:head>

<main>
	<header>
		<h1>insomnia</h1>
		<p class="text-dim">
			a map of what to learn on guitar, and what you've let go quiet. still up? good time to play.
		</p>
		{#if data.user}
			<Button href={resolve('/map')}>open the map</Button>
		{:else}
			<div class="actions">
				<Button href={resolve('/sign-up')}>sign up</Button>
				<Button href={resolve('/sign-in')} variant="ghost">sign in</Button>
			</div>
		{/if}
	</header>

	<div class="preview">
		<MapView {index} />
	</div>
</main>

<style>
	main {
		box-sizing: border-box;
		max-width: 40rem;
		margin: 0 auto;
		padding: calc(var(--safe-top) + 1.5rem) 1rem calc(var(--safe-bottom) + 1.5rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.preview {
		height: 65dvh;
		min-height: 24rem;
		margin-inline: -1rem;
	}
</style>
