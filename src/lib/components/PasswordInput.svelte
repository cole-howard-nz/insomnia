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
	} & Omit<HTMLInputAttributes, 'id' | 'value' | 'type'> = $props();

	let revealed = $state(false);

	const describedBy = $derived(
		[error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="wrap">
		<input
			{id}
			type={revealed ? 'text' : 'password'}
			bind:value
			class="input"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			{...rest}
		/>
		<button
			type="button"
			class="toggle"
			aria-label={revealed ? 'hide password' : 'show password'}
			aria-pressed={revealed}
			onclick={() => (revealed = !revealed)}
		>
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M1 8.5s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
					stroke="currentColor"
					stroke-width="1.3"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<circle cx="8" cy="8.5" r="2" stroke="currentColor" stroke-width="1.3" />
				{#if !revealed}
					<path d="M2 2l12 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
				{/if}
			</svg>
		</button>
	</div>
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
	.wrap {
		position: relative;
	}
	.wrap :global(.input) {
		padding-right: var(--tap);
	}
	.toggle {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: var(--tap);
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-dim);
	}
	.toggle:hover {
		color: var(--text);
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
