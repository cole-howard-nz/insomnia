<script lang="ts">
	import { onMount } from 'svelte';
	import { rainSound } from '$lib/rain-sound.svelte';
	import { weather } from '$lib/weather.svelte';

	/** Mounted once in the app layout. Starts the rain on the first tap when it is switched on. */
	let { enabled }: { enabled: boolean } = $props();

	$effect(() => {
		rainSound.init(enabled);
	});
	$effect(() => {
		rainSound.follow(weather.current);
	});

	onMount(() => {
		const begin = () => void rainSound.resume();
		addEventListener('pointerdown', begin);
		addEventListener('keydown', begin);
		return () => {
			removeEventListener('pointerdown', begin);
			removeEventListener('keydown', begin);
			rainSound.stop();
		};
	});
</script>
