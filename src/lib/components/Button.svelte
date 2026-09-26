<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		href,
		type = 'button',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: {
		variant?: 'primary' | 'ghost' | 'danger';
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	} = $props();
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- callers pass resolved or external hrefs -->
	<a {href} class="btn btn-{variant} {className}" aria-disabled={disabled || undefined} {onclick}>
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {onclick} class="btn btn-{variant} {className}">
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: var(--tap);
		padding: 0.5rem 1.1rem;
		border: 1px solid transparent;
		border-radius: 0;
		font-family: var(--font-display);
		font-size: 1.0625rem;
		letter-spacing: 0.04em;
		text-decoration: none;
		transition:
			background-color 0.12s,
			border-color 0.12s;
	}
	.btn-primary {
		background: var(--accent);
		color: var(--bg-deep);
	}
	.btn-primary:hover {
		background: color-mix(in srgb, var(--accent) 85%, var(--text));
	}
	.btn-ghost {
		background: transparent;
		color: var(--text);
		border-color: var(--line);
	}
	.btn-ghost:hover {
		background: var(--bg-cloud-hi);
	}
	.btn-danger {
		background: var(--rust);
		color: var(--text);
	}
	.btn-danger:hover {
		background: color-mix(in srgb, var(--rust) 85%, var(--text));
	}
	.btn:disabled,
	.btn[aria-disabled='true'] {
		opacity: 0.45;
		pointer-events: none;
	}
</style>
