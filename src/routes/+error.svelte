<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import { invalidateAll } from '$app/navigation';

	const missing = $derived(page.status === 404);
</script>

<svelte:head><title>{page.status} · insomnia</title></svelte:head>

<main>
	<div class="taped">
		<Stamp tone="rust">{page.status}</Stamp>
		<h1>{missing ? 'nothing here.' : 'something broke.'}</h1>
		<p class="text-dim">
			{missing ? "that's okay. the page you wanted isn't here." : 'not you. try again.'}
		</p>
		<div class="actions">
			{#if !missing}
				<Button onclick={() => invalidateAll()}>try again</Button>
			{/if}
			<Button href="/map" variant="ghost">back to the map</Button>
		</div>
	</div>
</main>

<style>
	main {
		box-sizing: border-box;
		min-height: 100dvh;
		display: grid;
		align-content: center;
		max-width: 26rem;
		margin: 0 auto;
		padding: 1.5rem calc(var(--safe-right) + 1rem) calc(var(--safe-bottom) + 1.5rem)
			calc(var(--safe-left) + 1rem);
	}
	.taped {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
</style>
