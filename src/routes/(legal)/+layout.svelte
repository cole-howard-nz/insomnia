<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';

	let { children }: { children: Snippet } = $props();
</script>

<main>
	<a class="home" href={resolve('/')}>insomnia</a>
	<article>
		{@render children()}
	</article>
	<nav aria-label="legal" class="text-dim">
		<a href={resolve('/privacy')}>privacy</a>
		<a href={resolve('/terms')}>terms</a>
		<a href={resolve('/')}>home</a>
	</nav>
</main>

<style>
	main {
		box-sizing: border-box;
		min-height: 100dvh;
		max-width: 40rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--safe-bottom) + 2rem) calc(var(--safe-left) + 1rem);
	}
	.home {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--text-dim);
		text-decoration: none;
	}
	article {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: color-mix(in srgb, var(--bg-cloud) 88%, transparent);
		border: 1px solid var(--line);
	}
	article :global(h2) {
		font-size: 1.2rem;
		margin-top: 0.75rem;
	}
	article :global(ul) {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
	}
</style>
