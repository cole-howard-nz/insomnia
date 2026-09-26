<script lang="ts">
	import { onMount } from 'svelte';
	import { weather } from '$lib/weather.svelte';
	import { averageFrameMs, nextTier, tierSettings } from '$lib/perf';
	import { weatherParams } from '$lib/weather-params';
	import CloudBackground from './CloudBackground.svelte';
	import RainBackground from './RainBackground.svelte';

	const params = $derived(weatherParams(weather.current));

	// Decided on the client after mount. Until then the CSS sky covers the first paint.
	let mounted = $state(false);
	let reducedMotion = $state(false);
	let lowPower = $state(false);
	let lowRes = $state(false);
	let webglFailed = $state(false);
	// The shader waits until the page has painted and gone quiet, so it never competes with load.
	let shaderReady = $state(false);

	// The governor steps quality down when real frame times say the sky is too heavy.
	let tier = $state(0);
	const quality = $derived(tierSettings(tier));

	// Still sky: reduced motion, a device that should not be animating, or one that cannot keep up.
	const animate = $derived(!reducedMotion && !lowPower && quality.animate);

	onMount(() => {
		mounted = true;

		const start = () => (shaderReady = true);
		const idle = window.requestIdleCallback
			? window.requestIdleCallback(start, { timeout: 2500 })
			: window.setTimeout(start, 800);

		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = motion.matches;
		const onMotion = () => (reducedMotion = motion.matches);
		motion.addEventListener('change', onMotion);

		// Half-res clouds on phones and small screens.
		lowRes = matchMedia('(pointer: coarse)').matches || innerWidth < 768;

		// Low-power: few cores or little memory, or a low battery that is not charging.
		const nav = navigator as Navigator & {
			deviceMemory?: number;
			getBattery?: () => Promise<{
				level: number;
				charging: boolean;
				addEventListener: (type: string, fn: () => void) => void;
			}>;
		};
		const weak = (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
		lowPower = weak;
		nav.getBattery?.().then((battery) => {
			const update = () => (lowPower = weak || (battery.level < 0.15 && !battery.charging));
			update();
			battery.addEventListener('levelchange', update);
			battery.addEventListener('chargingchange', update);
		});

		return () => {
			motion.removeEventListener('change', onMotion);
			if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
			else window.clearTimeout(idle);
		};
	});

	// Watches frame times in short windows while the sky animates, and steps down one tier
	// after a slow window. It stops after a few good windows in a row: the cost of the sky
	// only changes with the weather, and a quiet governor is a cheaper one.
	$effect(() => {
		if (!mounted || !animate) return;
		const WINDOW_MS = 4000;
		const GOOD_WINDOWS_TO_REST = 3;
		let frames: number[] = [];
		let last = performance.now();
		let windowStart = last;
		let good = 0;
		let raf = 0;
		const frame = (now: number) => {
			frames.push(now - last);
			last = now;
			if (now - windowStart >= WINDOW_MS) {
				const verdict = averageFrameMs(frames);
				const next = nextTier(tier, verdict);
				frames = [];
				windowStart = now;
				if (next !== tier) {
					good = 0;
					tier = next;
				} else if (verdict !== null && ++good >= GOOD_WINDOWS_TO_REST) {
					return;
				}
			}
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		const onVisibility = () => {
			// A hidden tab produces no frames, so start the window over on return.
			frames = [];
			last = windowStart = performance.now();
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});
</script>

<!-- CSS sky: first paint, and the fallback when WebGL is unavailable. No shader involved. -->
{#if !mounted || !shaderReady || webglFailed}
	<div class="css-sky" aria-hidden="true" style:--density={params.cloudDensity}>
		<span class="blob b1"></span>
		<span class="blob b2"></span>
		<span class="blob b3"></span>
	</div>
{/if}

{#if mounted && shaderReady && !webglFailed}
	<CloudBackground
		density={params.cloudDensity}
		brightness={params.cloudBrightness}
		{animate}
		lowRes={lowRes || quality.halfRes}
		onfail={() => (webglFailed = true)}
	/>
{/if}

{#if mounted}
	<RainBackground
		dropScale={params.dropScale * quality.rainShare}
		opacity={params.rainOpacity}
		{animate}
	/>
{/if}

<style>
	.css-sky {
		position: fixed;
		inset: 0;
		height: 100lvh;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		opacity: calc(0.35 + var(--density) * 0.65);
	}
	.blob {
		position: absolute;
		border-radius: 50%;
		background: rgb(87 84 77 / 0.22);
		filter: blur(36px);
	}
	.b1 {
		top: -6%;
		left: -20%;
		width: 90%;
		height: 26%;
	}
	.b2 {
		top: 14%;
		right: -30%;
		width: 100%;
		height: 22%;
	}
	.b3 {
		top: 30%;
		left: 10%;
		width: 70%;
		height: 16%;
	}
</style>
