<script lang="ts">
	import { navigating } from '$app/state';
	import { fade } from 'svelte/transition';
	import { loading } from '$lib/loading.svelte';
</script>

{#if navigating.to || loading.active}
	<div
		class="overlay"
		role="status"
		aria-live="polite"
		aria-label="loading"
		transition:fade={{ duration: 120 }}
	>
		<span class="ring"></span>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		background: color-mix(in srgb, var(--bg-deep) 70%, transparent);
	}
	.ring {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--line);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		/* A frozen ring still reads as "working"; make it pulse in opacity instead. */
		.ring {
			animation: none;
			border-top-color: var(--accent);
			border-color: var(--accent);
			opacity: 0.6;
		}
	}
</style>
