<script lang="ts">
	import './layout.css';
	import { onMount, type Snippet } from 'svelte';
	import WeatherBackground from '$lib/components/WeatherBackground.svelte';
	import ToastStack from '$lib/components/ToastStack.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

	let { children }: { children: Snippet } = $props();

	// Days are the player's own, so the server needs to know their timezone.
	onMount(() => {
		const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (zone && !document.cookie.split('; ').includes(`tz=${encodeURIComponent(zone)}`)) {
			document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax`;
		}
	});
</script>

<svelte:head>
	<title>insomnia</title>
	<meta
		name="description"
		content="a map of what to learn on guitar, and what you've let go quiet."
	/>
</svelte:head>

<WeatherBackground />
<div class="grain" aria-hidden="true"></div>

<div class="app">
	{@render children()}
</div>

<ToastStack />
<LoadingOverlay />

<style>
	.app {
		position: relative;
		z-index: 10;
		min-height: 100dvh;
	}
</style>
