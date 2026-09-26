<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import { PASSWORD_MIN } from '$lib/auth-constants';

	let { data, form } = $props();
	// Server actions return different error shapes, read them all as one.
	const errs = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	let submitting = $state(false);
	let password = $state('');
</script>

<svelte:head><title>new password · insomnia</title></svelte:head>

<h1>new password</h1>

{#if data.live}
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
		<PasswordInput
			id="password"
			name="password"
			label="new password"
			autocomplete="new-password"
			hint="{PASSWORD_MIN} characters or more."
			bind:value={password}
			error={errs.password}
		/>
		<Button type="submit" disabled={submitting}>save it</Button>
	</form>
{:else}
	<p>that link is used up or expired.</p>
	<p class="text-dim"><a href={resolve('/reset')}>ask for a new one</a></p>
{/if}

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
