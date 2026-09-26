<script lang="ts">
	import { celebrate } from '$lib/celebrate.svelte';
</script>

<!--
	A few seconds of light, and never a flash: it rises and falls slowly, at low strength.
	Each milestone comes from a different place. With reduced motion there is no animation
	at all (the toast still says what happened).
-->
{#if celebrate.moment}
	{#key celebrate.moment.key}
		<div
			class="moment {celebrate.moment.kind}"
			aria-hidden="true"
			onanimationend={() => (celebrate.moment = null)}
		></div>
	{/key}
{/if}

<style>
	.moment {
		position: fixed;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		opacity: 0;
		animation: glow 5s ease-in-out forwards;
	}
	/* A region cleared: the cloud opens above and cold light comes through. */
	.region-cleared {
		background: radial-gradient(
			ellipse at 50% 18%,
			color-mix(in srgb, var(--clear) 34%, transparent),
			transparent 62%
		);
	}
	/* First mastered stop: a single cold ring ignites in the middle of the screen and widens. */
	.first-mastered {
		background: radial-gradient(
			circle at 50% 42%,
			transparent 0 14%,
			color-mix(in srgb, var(--clear) 30%, transparent) 15% 17%,
			transparent 30%
		);
		animation-name: glow, widen;
		animation-duration: 5s, 5s;
		transform-origin: 50% 42%;
	}
	/* Hours logged: amber, low, like a streetlight on wet road. */
	.hours {
		background: radial-gradient(
			ellipse at 50% 108%,
			color-mix(in srgb, var(--accent) 30%, transparent),
			transparent 58%
		);
	}
	@keyframes glow {
		0%,
		100% {
			opacity: 0;
		}
		30%,
		60% {
			opacity: 1;
		}
	}
	@keyframes widen {
		from {
			transform: scale(0.85);
		}
		to {
			transform: scale(1.15);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.moment {
			display: none;
		}
	}
</style>
