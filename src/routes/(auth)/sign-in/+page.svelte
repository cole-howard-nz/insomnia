<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';

	let { data, form } = $props();
	// Server actions return different error shapes, read them all as one.
	const errs = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let submitting = $state(false);
	let password = $state('');
</script>

<svelte:head><title>sign in · insomnia</title></svelte:head>

<h1>sign in</h1>

{#if data.justReset}
	<p role="status" class="text-dim">password changed. sign in with the new one.</p>
{/if}

<form
	method="POST"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			password = '';
			submitting = false;
		};
	}}
>
	<input type="hidden" name="next" value={data.next} />
	{#if errs._}
		<p class="error" role="alert">{errs._}</p>
	{/if}
	<Input
		id="email"
		name="email"
		label="email"
		type="email"
		autocomplete="email"
		value={form?.email ?? ''}
		error={errs.email}
	/>
	<PasswordInput
		id="password"
		name="password"
		label="password"
		autocomplete="current-password"
		bind:value={password}
		error={errs.password}
	/>
	<Button type="submit" disabled={submitting}>sign in</Button>
</form>

<p class="links text-dim">
	<a href={resolve('/reset')}>forgot it?</a>
	<a href={resolve('/sign-up')}>no account yet</a>
</p>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.error {
		color: color-mix(in srgb, var(--rust) 45%, var(--text));
	}
	.links {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
</style>
