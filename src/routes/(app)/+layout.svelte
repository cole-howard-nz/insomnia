<script lang="ts">
	import type { Snippet } from 'svelte';
	import TabBar from '$lib/components/TabBar.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<main>
	{@render children()}
</main>
<TabBar />

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
