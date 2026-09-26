<script lang="ts">
	import { weather } from '$lib/weather.svelte';
	import { weatherParams } from '$lib/weather-params';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import { pushToast } from '$lib/toast.svelte';
	import { loading } from '$lib/loading.svelte';

	let sheetOpen = $state(false);
	let name = $state('');
	let password = $state('');

	// Bound to the slider. Setting it eases the sky, never cuts.
	let value = $state(weather.target);
	$effect(() => weather.set(value));

	const params = $derived(weatherParams(weather.current));

	function flashLoading() {
		loading.active = true;
		setTimeout(() => (loading.active = false), 1200);
	}
</script>

<svelte:head>
	<title>weather · insomnia</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main>
	<h1>weather</h1>
	<p class="text-dim">dev page. drag the slider, watch the sky.</p>

	<section class="taped">
		<label for="w">weather: {value.toFixed(2)}</label>
		<input id="w" type="range" min="0" max="1" step="0.01" bind:value class="slider" />
		<div class="presets">
			<Button variant="ghost" onclick={() => (value = 0)}>new user</Button>
			<Button variant="ghost" onclick={() => (value = 0.5)}>exploring</Button>
			<Button variant="ghost" onclick={() => (value = 1)}>high progress</Button>
		</div>
		<dl class="readout">
			<dt>eased</dt>
			<dd>{weather.current.toFixed(3)}</dd>
			<dt>rain</dt>
			<dd>{Math.round(params.dropScale * 100)}% drops, {params.rainOpacity.toFixed(2)} opacity</dd>
			<dt>cloud</dt>
			<dd>{params.cloudDensity.toFixed(2)} density, {params.cloudBrightness.toFixed(2)} bright</dd>
		</dl>
	</section>

	<section class="taped taped-alt">
		<h2>kit</h2>
		<div class="stamps">
			<Stamp>unseen</Stamp>
			<Stamp tone="accent">playable</Stamp>
			<Stamp tone="rust">rusting</Stamp>
			<Stamp tone="clear">mastered</Stamp>
		</div>
		<Input id="name" label="name" placeholder="what do they call you" bind:value={name} />
		<PasswordInput id="pw" label="password" bind:value={password} autocomplete="off" />
		<div class="presets">
			<Button onclick={() => (sheetOpen = true)}>open sheet</Button>
			<Button variant="ghost" onclick={() => pushToast('saved. nothing was lost.')}>toast</Button>
			<Button variant="ghost" onclick={() => pushToast('something broke. not you.', 'error')}>
				error toast
			</Button>
			<Button variant="ghost" onclick={flashLoading}>loading</Button>
			<Button variant="danger">danger</Button>
		</div>
	</section>

	<p class="body-sample">
		body text at 16px over whatever sky is behind it. it has to stay readable in the brightest
		weather. <span class="text-dim">secondary text, dimmer, same rule.</span>
	</p>

	<Button href="/map" variant="ghost">back to the map</Button>
</main>

<Sheet bind:open={sheetOpen} title="barre chords">
	<p>drag the handle down to dismiss. or tap outside. or press escape.</p>
	<p class="text-dim">level 2 of 4. it's been 24 days. it misses you.</p>
	<Button onclick={() => (sheetOpen = false)}>okay</Button>
</Sheet>

<style>
	main {
		box-sizing: border-box;
		max-width: 40rem;
		margin: 0 auto;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--safe-bottom) + 2rem) calc(var(--safe-left) + 1rem);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.slider {
		width: 100%;
		min-height: var(--tap);
		accent-color: var(--accent);
	}
	.presets,
	.stamps {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.readout {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.15rem 0.75rem;
		margin: 0;
		font-size: 0.875rem;
	}
	dt {
		color: var(--text-dim);
	}
	dd {
		margin: 0;
	}
</style>
