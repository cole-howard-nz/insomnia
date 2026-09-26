<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Sheet from '$lib/components/Sheet.svelte';
	import StopDetail from '$lib/components/StopDetail.svelte';
	import { UNSEEN } from '$lib/curriculum/model';
	import { getMapContext } from '$lib/map-context';

	let { data }: { data: { slug: string } } = $props();

	const map = getMapContext();
	const stop = $derived(map.index.stop(data.slug)!);

	let open = $state(true);

	// Closing the sheet returns to the map (or list) it was opened from.
	$effect(() => {
		if (!open) {
			untrack(() => {
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved below
				goto(`${resolve('/map')}${map.query}`, { noScroll: true, keepFocus: true });
			});
		}
	});
</script>

<svelte:head><title>{stop.name} · insomnia</title></svelte:head>

<Sheet bind:open title={stop.name}>
	<StopDetail
		index={map.index}
		{stop}
		current={map.states[stop.slug] ?? UNSEEN}
		query={map.query}
	/>
</Sheet>
