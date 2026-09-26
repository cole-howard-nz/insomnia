<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import { PASSWORD_MIN } from '$lib/auth-constants';
	import { rainSound } from '$lib/rain-sound.svelte';
	import { pushToast } from '$lib/toast.svelte';

	let { data, form } = $props();
	const user = $derived(data.user!);

	let busy = $state('');
	let emailPassword = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let deletePassword = $state('');
	let confirmDelete = $state(false);

	// Errors and confirmations belong to the section that was submitted.
	const errors = (action: string) =>
		(form?.action === action ? form.errors : undefined) as
			Record<string, string | undefined> | undefined;
	const done = (action: string) => form?.action === action && 'done' in form && form.done;

	async function toggleRain() {
		const on = !rainSound.enabled;
		if (on) void rainSound.enable();
		else rainSound.disable();
		const res = await fetch('?/rain', {
			method: 'POST',
			headers: { 'x-sveltekit-action': 'true' },
			body: new URLSearchParams({ on: on ? '1' : '' })
		}).catch(() => null);
		if (!res?.ok) pushToast("couldn't save that. it'll reset next visit.", 'error');
	}

	/** Enhance handler: marks the section busy, clears its secrets when finished. */
	const submit =
		(action: string, clear: () => void = () => {}) =>
		() => {
			busy = action;
			return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
				await update({ reset: false });
				clear();
				busy = '';
			};
		};
</script>

<svelte:head><title>me · insomnia</title></svelte:head>

<h1>me</h1>

<section aria-labelledby="h-account">
	<h2 id="h-account">account</h2>
	<p>{user.displayName}</p>
	<p class="text-dim">
		{user.email}
		{#if user.emailVerified}<Stamp tone="clear">verified</Stamp>{:else}<Stamp tone="rust"
				>not verified</Stamp
			>{/if}
	</p>

	{#if !user.emailVerified}
		<form method="POST" action="?/resend" use:enhance={submit('resend')} class="inline">
			<p class="text-dim">
				{done('resend')
					? 'sent. check your inbox, and the junk folder.'
					: 'verify it to unlock uploads and reminders later. nothing else is blocked.'}
			</p>
			{#if errors('resend')?._}<p class="error" role="alert">{errors('resend')?._}</p>{/if}
			<Button type="submit" variant="ghost" disabled={busy === 'resend'}>resend the link</Button>
		</form>
	{/if}
</section>

<section aria-labelledby="h-name">
	<h2 id="h-name">display name</h2>
	<form method="POST" action="?/name" novalidate use:enhance={submit('name')}>
		<Input
			id="displayName"
			name="displayName"
			label="name"
			autocomplete="nickname"
			maxlength={40}
			value={user.displayName}
			error={errors('name')?.displayName}
		/>
		{#if done('name')}<p class="text-dim" role="status">saved.</p>{/if}
		<Button type="submit" variant="ghost" disabled={busy === 'name'}>save name</Button>
	</form>
</section>

<section aria-labelledby="h-email">
	<h2 id="h-email">change email</h2>
	<form
		method="POST"
		action="?/email"
		novalidate
		use:enhance={submit('email', () => (emailPassword = ''))}
	>
		{#if errors('email')?._}<p class="error" role="alert">{errors('email')?._}</p>{/if}
		<Input
			id="newEmail"
			name="email"
			label="new email"
			type="email"
			autocomplete="email"
			value={form?.action === 'email' && form.values ? form.values.email : ''}
			error={errors('email')?.email}
		/>
		<PasswordInput
			id="emailPassword"
			name="password"
			label="password"
			autocomplete="current-password"
			bind:value={emailPassword}
			error={errors('email')?.password}
		/>
		{#if done('email')}
			<p class="text-dim" role="status">
				changed. a link is on its way to the new address, and the old one was told.
			</p>
		{/if}
		<Button type="submit" variant="ghost" disabled={busy === 'email'}>change email</Button>
	</form>
</section>

<section aria-labelledby="h-password">
	<h2 id="h-password">change password</h2>
	<form
		method="POST"
		action="?/password"
		novalidate
		use:enhance={submit('password', () => {
			currentPassword = '';
			newPassword = '';
		})}
	>
		{#if errors('password')?._}<p class="error" role="alert">{errors('password')?._}</p>{/if}
		<PasswordInput
			id="currentPassword"
			name="currentPassword"
			label="current password"
			autocomplete="current-password"
			bind:value={currentPassword}
			error={errors('password')?.currentPassword}
		/>
		<PasswordInput
			id="newPassword"
			name="newPassword"
			label="new password"
			autocomplete="new-password"
			hint="{PASSWORD_MIN} characters or more."
			bind:value={newPassword}
			error={errors('password')?.newPassword}
		/>
		{#if done('password')}
			<p class="text-dim" role="status">changed. your other devices were signed out.</p>
		{/if}
		<Button type="submit" variant="ghost" disabled={busy === 'password'}>change password</Button>
	</form>
</section>

<section aria-labelledby="h-sound">
	<h2 id="h-sound">rain sound</h2>
	<p class="text-dim">
		optional, off unless you turn it on. a quiet rain under the app that fades as the sky clears.
	</p>
	<!-- The tap is what lets the browser start audio, so sound is switched here, then the choice is saved. -->
	<Button variant="ghost" onclick={toggleRain}>
		{rainSound.enabled ? 'turn the rain off' : 'turn the rain on'}
	</Button>
	<p role="status" class="text-dim">{rainSound.enabled ? 'the rain is on.' : 'the rain is off.'}</p>
</section>

<section aria-labelledby="h-sessions">
	<h2 id="h-sessions">where you're signed in</h2>
	<ul class="sessions">
		{#each data.sessions as s (s.id)}
			<li>
				<span>{s.deviceLabel}</span>
				<span class="text-dim">
					{#if s.current}this device{:else}last seen {s.lastSeen}{/if}
				</span>
			</li>
		{/each}
	</ul>
	<div class="row">
		<form method="POST" action="?/signOut">
			<Button type="submit" variant="ghost">sign out</Button>
		</form>
		<form method="POST" action="?/signOutAll">
			<Button type="submit" variant="ghost">sign out everywhere</Button>
		</form>
	</div>
</section>

<section aria-labelledby="h-data">
	<h2 id="h-data">your data</h2>
	<p class="text-dim">
		everything we hold about you. the json file has your progress and notes. the zip adds your
		recordings.
	</p>
	<!-- Downloads, not pages. Skip client routing so the browser saves the file. -->
	<div class="row" data-sveltekit-reload>
		<Button href={resolve('/me/export')} variant="ghost">export json</Button>
		<Button href={resolve('/me/export/zip')} variant="ghost">export zip with recordings</Button>
	</div>
</section>

<section aria-labelledby="h-delete">
	<h2 id="h-delete">delete account</h2>
	<p class="text-dim">
		this erases your account and everything in it, recordings included, right now. there is no undo
		and no backup to ask for.
	</p>
	{#if !confirmDelete}
		<Button variant="ghost" onclick={() => (confirmDelete = true)}>delete my account</Button>
	{:else}
		<form
			method="POST"
			action="?/delete"
			novalidate
			use:enhance={submit('delete', () => (deletePassword = ''))}
		>
			<PasswordInput
				id="deletePassword"
				name="password"
				label="password, to be sure"
				autocomplete="current-password"
				bind:value={deletePassword}
				error={errors('delete')?.password ?? errors('delete')?._}
			/>
			<div class="row">
				<Button type="submit" variant="danger" disabled={busy === 'delete'}>delete it all</Button>
				<Button variant="ghost" onclick={() => (confirmDelete = false)}>keep it</Button>
			</div>
		</form>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	form {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.75rem;
		width: 100%;
	}
	form.inline {
		align-items: flex-start;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.row form {
		width: auto;
	}
	.error {
		color: color-mix(in srgb, var(--rust) 45%, var(--text));
	}
	.sessions {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.sessions li {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0.75rem;
		background: var(--bg-cloud);
		border: 1px solid var(--line);
	}
</style>
