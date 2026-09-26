<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	let { form } = $props();
	// Server actions return different error shapes, read them all as one.
	const errs = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let submitting = $state(false);
</script>

<svelte:head><title>reset password · insomnia</title></svelte:head>

<h1>reset password</h1>

{#if form?.sent}
	<p role="status">if that email has an account, a link is on its way. it works for an hour.</p>
	<p class="text-dim">
		only verified emails get one. if yours never was, that's a dead end for now. sorry.
	</p>
{:else}
	<p class="text-dim">enter the email you signed up with.</p>
	<form
		method="POST"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
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
		<Button type="submit" disabled={submitting}>send the link</Button>
	</form>
{/if}

<p class="text-dim"><a href={resolve('/sign-in')}>back to sign in</a></p>

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
