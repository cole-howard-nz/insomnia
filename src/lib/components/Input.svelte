<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(''),
		error,
		hint,
		...rest
	}: {
		id: string;
		label: string;
		value?: string;
		error?: string;
		hint?: string;
	} & Omit<HTMLInputAttributes, 'id' | 'value'> = $props();

	const describedBy = $derived(
		[error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="field">
	<label for={id}>{label}</label>
	<input
		{id}
		bind:value
		class="input"
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		{...rest}
	/>
	{#if hint}<p id="{id}-hint" class="hint">{hint}</p>{/if}
	{#if error}<p id="{id}-error" class="error">{error}</p>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	label {
		font-size: 0.9375rem;
		color: var(--text-dim);
	}
	.hint {
		font-size: 0.875rem;
		color: var(--text-dim);
	}
	.error {
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--rust) 45%, var(--text));
	}
</style>
