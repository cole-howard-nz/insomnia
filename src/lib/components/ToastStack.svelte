<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { toasts, dismissToast } from '$lib/toast.svelte';

	let stackEl: HTMLDivElement;

	$effect(() => {
		// Re-promote to the top layer on every new toast so it renders above an
		// open <dialog> (a Sheet), which would otherwise cover a fixed div.
		if (toasts.length === 0 || !stackEl) return;
		if (stackEl.matches(':popover-open')) stackEl.hidePopover();
		stackEl.showPopover();
	});
</script>

<div class="toast-stack" popover="manual" bind:this={stackEl} role="status" aria-live="polite">
	{#each toasts as toast (toast.id)}
		<div
			class="toast toast-{toast.variant}"
			in:fly={{ y: 16, duration: 200 }}
			out:fade={{ duration: 120 }}
		>
			<span>{toast.message}</span>
			<button type="button" class="toast-close" onclick={() => dismissToast(toast.id)}>
				<span class="sr-only">dismiss</span>
				<span aria-hidden="true">&#x2715;</span>
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-stack {
		position: fixed;
		inset: auto 0 calc(var(--tabbar-h) + var(--safe-bottom) + 0.75rem) 0;
		margin: 0 auto;
		width: min(100% - 2rem, 26rem);
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		overflow: visible;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}
	.toast-stack:not(:popover-open) {
		display: none;
	}
	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.5rem 0.5rem 0.9rem;
		background: var(--bg-cloud-hi);
		border: 1px solid var(--line);
		border-left: 3px solid var(--accent);
		font-size: 0.9375rem;
	}
	.toast-error {
		border-left-color: var(--rust);
	}
	.toast-close {
		flex: none;
		min-width: var(--tap);
		background: none;
		border: none;
		color: var(--text-dim);
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
