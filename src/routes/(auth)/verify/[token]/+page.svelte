<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>verify email · insomnia</title></svelte:head>

<h1>verify email</h1>

{#if form?.verified}
	<p role="status">done. that address is confirmed.</p>
	<Button href={resolve('/map')}>to the map</Button>
{:else}
	{#if form?.failed}
		<p class="error" role="alert">that link is used up or expired. ask for a new one from me.</p>
	{:else}
		<p class="text-dim">one tap to confirm this address.</p>
	{/if}
	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<Button type="submit" disabled={submitting}>confirm my email</Button>
	</form>
{/if}

<style>
	.error {
		color: color-mix(in srgb, var(--rust) 45%, var(--text));
	}
</style>
