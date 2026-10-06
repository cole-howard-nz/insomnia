<script lang="ts">
	import './layout.css';
	import { onMount, type Snippet } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { weather } from '$lib/weather.svelte';
	import GlassDrops from '$lib/components/GlassDrops.svelte';
	import Lamp from '$lib/components/Lamp.svelte';
	import WeatherBackground from '$lib/components/WeatherBackground.svelte';
	import ToastStack from '$lib/components/ToastStack.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import OfflineNotice from '$lib/components/OfflineNotice.svelte';

	let { children }: { children: Snippet } = $props();

	// Pages cross-fade through fog instead of cutting (see layout.css).
	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// The glass fogs up in heavy weather and clears with the sky.
	$effect(() => {
		document.documentElement.style.setProperty('--fog', String(1 - weather.current));
	});

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
<Lamp />
<GlassDrops />
<div class="grain" aria-hidden="true"></div>

<div class="app">
	{@render children()}
</div>

<ToastStack />
<LoadingOverlay />
<OfflineNotice />

<style>
	.app {
		position: relative;
		z-index: 10;
		min-height: 100dvh;
	}
</style>
