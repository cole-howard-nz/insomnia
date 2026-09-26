<script lang="ts">
	import './layout.css';
	import type { Snippet } from 'svelte';
	import WeatherBackground from '$lib/components/WeatherBackground.svelte';
	import ToastStack from '$lib/components/ToastStack.svelte';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

	let { children }: { children: Snippet } = $props();
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
