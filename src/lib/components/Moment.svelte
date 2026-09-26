<script lang="ts">
	import { celebrate } from '$lib/celebrate.svelte';
</script>

<!-- A cold break in the cloud for a few seconds. Gone entirely with reduced motion (the toast still says it). -->
{#if celebrate.moment}
	{#key celebrate.moment.key}
		<div class="moment" aria-hidden="true" onanimationend={() => (celebrate.moment = null)}></div>
	{/key}
{/if}

<style>
	.moment {
		position: fixed;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		background: radial-gradient(
			ellipse at 50% 18%,
			color-mix(in srgb, var(--clear) 34%, transparent),
			transparent 62%
		);
		opacity: 0;
		animation: break-in-the-cloud 5s ease-in-out forwards;
	}
	@keyframes break-in-the-cloud {
		0%,
		100% {
			opacity: 0;
		}
		30%,
		60% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.moment {
			display: none;
		}
	}
</style>
