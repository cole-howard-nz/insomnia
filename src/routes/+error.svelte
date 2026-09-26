<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import { invalidateAll } from '$app/navigation';

	const lines = $derived(
		page.status === 404
			? {
					title: 'nothing here.',
					body: "that's okay. the page you wanted isn't here.",
					retry: false
				}
			: page.status === 403
				? {
						title: 'not yours.',
						body: "that one belongs to someone else, or isn't yours to open.",
						retry: false
					}
				: page.status === 429
					? {
							title: 'slow down a little.',
							body: 'too many tries in a row. give it a minute.',
							retry: true
						}
					: { title: 'something broke.', body: 'not you. try again.', retry: true }
	);
	const home = $derived(page.data.user ? '/map' : '/');
</script>

<svelte:head><title>{page.status} · insomnia</title></svelte:head>

<main>
	<div class="taped">
		<Stamp tone="rust">{page.status}</Stamp>
		<h1>{lines.title}</h1>
		<p class="text-dim">{lines.body}</p>
		<div class="actions">
			{#if lines.retry}
				<Button onclick={() => invalidateAll()}>try again</Button>
			{/if}
			<Button href={home} variant="ghost">{page.data.user ? 'back to the map' : 'back home'}</Button
			>
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
