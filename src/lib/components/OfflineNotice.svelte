<script lang="ts">
	import { onMount } from 'svelte';

	// Saves are network requests, so say so when the network is gone rather than let a tick
	// look saved. It goes away by itself when the connection comes back.
	let offline = $state(false);

	onMount(() => {
		const update = () => (offline = !navigator.onLine);
		update();
		addEventListener('online', update);
		addEventListener('offline', update);
		return () => {
			removeEventListener('online', update);
			removeEventListener('offline', update);
		};
	});
</script>

{#if offline}
	<p class="offline" role="status">
		offline. what you do now won't be saved until you're back. nothing is lost yet.
	</p>
{/if}

<style>
	.offline {
		position: fixed;
		inset: calc(var(--safe-top) + 0.5rem) 0.75rem auto 0.75rem;
		z-index: 60;
		max-width: 32rem;
		margin-inline: auto;
		padding: 0.5rem 0.75rem;
		background: var(--bg-cloud-hi);
		border: 1px solid var(--line);
		border-left: 3px solid var(--rust);
		font-size: 0.9375rem;
	}
</style>
