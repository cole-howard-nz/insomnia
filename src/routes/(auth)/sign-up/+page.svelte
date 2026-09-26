<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { PASSWORD_MIN } from '$lib/auth-constants';

	let { form } = $props();
	// Server actions return different error shapes, read them all as one.
	const errs = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let submitting = $state(false);
	let password = $state('');
</script>

<svelte:head><title>sign up · insomnia</title></svelte:head>

<h1>sign up</h1>
<p class="text-dim">
	email and a password. we'll ask you to verify the email later, it doesn't block anything now.
</p>

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
	{#if errs._}
		<p class="error" role="alert">{errs._}</p>
	{/if}
	<Input
		id="displayName"
		name="displayName"
		label="what should we call you"
		autocomplete="nickname"
		maxlength={40}
		value={form?.values?.displayName ?? ''}
		error={errs.displayName}
	/>
	<Input
		id="email"
		name="email"
		label="email"
		type="email"
		autocomplete="email"
		value={form?.values?.email ?? ''}
		error={errs.email}
	/>
	<PasswordInput
		id="password"
		name="password"
		label="password"
		autocomplete="new-password"
		hint="{PASSWORD_MIN} characters or more. a few words strung together works."
		bind:value={password}
		error={errs.password}
	/>
	<Button type="submit" disabled={submitting}>make an account</Button>
</form>

<p class="text-dim"><a href={resolve('/sign-in')}>already have one</a></p>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.error {
		color: color-mix(in srgb, var(--rust) 45%, var(--text));
	}
</style>
