<script lang="ts">
	import type { Snippet } from 'svelte';

	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<main>
	<a class="home" href={resolve('/')}><Logo size={28} />insomnia</a>
	<div class="taped">
		{@render children()}
	</div>
</main>

<style>
	main {
		box-sizing: border-box;
		min-height: 100dvh;
		max-width: 26rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1.5rem;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--safe-bottom) + 1.5rem) calc(var(--safe-left) + 1rem);
	}
	.home {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--text-dim);
		text-decoration: none;
	}
	.taped {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
