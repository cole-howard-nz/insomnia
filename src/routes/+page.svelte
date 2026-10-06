<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
	import LandingDemo from '$lib/components/LandingDemo.svelte';
	import { indexCurriculum, type CurriculumData } from '$lib/curriculum/model';

	let { data }: { data: { curriculum: CurriculumData; user: App.Locals['user'] } } = $props();
	const index = $derived(indexCurriculum(data.curriculum));
	const deleted = $derived(page.url.searchParams.get('deleted') === '1');
</script>

<svelte:head>
	<title>insomnia</title>
	<meta
		name="description"
		content="a map of what to learn on guitar, and what you've let go quiet."
	/>
	<meta property="og:title" content="insomnia" />
	<meta
		property="og:description"
		content="a map of what to learn on guitar, and what you've let go quiet."
	/>
</svelte:head>

<main>
	{#if deleted}
		<p class="notice" role="status">your account is gone, and everything in it. take care.</p>
	{/if}

	<div class="hero">
		<header>
			<h1>insomnia</h1>
			<p class="pitch glass">
				a map of what to learn on guitar, and what you've let go quiet. it's always raining. you're
				still up.
			</p>
			{#if data.user}
				<Button href={resolve('/map')}>open the map</Button>
			{:else}
				<div class="actions">
					<Button href={resolve('/sign-up')}>make an account</Button>
					<Button href={resolve('/sign-in')} variant="ghost">sign in</Button>
				</div>
			{/if}
		</header>

		<section class="preview-wrap" aria-labelledby="preview-heading">
			<h2 id="preview-heading" class="sr-only">a look at the map</h2>
			<p class="caption text-dim">
				{data.curriculum.stops.length} stops in {data.curriculum.regions.length} regions. this is a made-up
				map a few weeks in. make an account to explore it yourself.
			</p>
			<div class="preview">
				<LandingDemo {index} />
			</div>
		</section>
	</div>

	<section class="points" aria-label="what it does">
		<div>
			<h3>tick what you can actually do</h3>
			<p class="text-dim">
				every stop has concrete criteria. change between g and c in under two seconds, five times in
				a row. no self-grading on vibes.
			</p>
		</div>
		<div>
			<h3>see what's going quiet</h3>
			<p class="text-dim">
				leave a skill alone and a small cloud gathers over it. it isn't a punishment. it's just
				honest.
			</p>
		</div>
		<div>
			<h3>keep proof</h3>
			<p class="text-dim">
				record a clip now and another in two months. hear the difference. only you can hear them.
			</p>
		</div>
	</section>

	<footer>
		<nav aria-label="footer" class="text-dim">
			<a href={resolve('/privacy')}>privacy</a>
			<a href={resolve('/terms')}>terms</a>
		</nav>
	</footer>
</main>

<style>
	main {
		box-sizing: border-box;
		max-width: 40rem;
		margin: 0 auto;
		padding: calc(var(--safe-top) + 1.5rem) calc(var(--safe-right) + 1rem)
			calc(var(--safe-bottom) + 1.5rem) calc(var(--safe-left) + 1rem);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.9rem;
	}
	.hero {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	h1 {
		font-size: clamp(3.4rem, 17vw, 5.5rem);
		font-weight: 800;
		font-variation-settings: 'wdth' 75;
		line-height: 0.85;
	}
	.pitch {
		font-size: 1.05rem;
		max-width: 32rem;
		padding: 0.9rem 1rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.notice {
		padding: 0.6rem 0.75rem;
		border-left: 3px solid var(--clear);
		background: color-mix(in srgb, var(--bg-cloud) 88%, transparent);
	}
	.preview-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.caption {
		font-size: 0.9375rem;
	}
	.preview {
		height: 65dvh;
		min-height: 24rem;
		margin-inline: -1rem;
	}
	.points {
		display: grid;
		gap: 1.25rem;
	}
	.points div {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding-left: 0.75rem;
		border-left: 1px solid var(--line);
	}
	footer nav {
		display: flex;
		gap: 1.25rem;
	}
	footer a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
	}
	/* Desktop: the map is the room, the name is painted on the window, and the lamp reads it. */
	@media (min-width: 64rem) {
		main {
			max-width: none;
			margin: 0;
			padding: 0;
			gap: 0;
		}
		.notice {
			position: fixed;
			top: 1rem;
			left: 50%;
			translate: -50% 0;
			z-index: 30;
		}
		.hero {
			position: relative;
			height: 100dvh;
			min-height: 40rem;
			display: block;
		}
		.preview-wrap {
			position: absolute;
			inset: 0;
		}
		.preview {
			height: 100%;
			margin: 0;
		}
		.caption {
			position: absolute;
			z-index: 2;
			right: 4vw;
			bottom: 4vh;
			max-width: 20rem;
			text-align: right;
			pointer-events: none;
		}
		header {
			position: absolute;
			inset: 0;
			z-index: 2;
			display: grid;
			grid-template-columns: 1fr 24rem;
			grid-template-rows: auto 1fr auto auto;
			padding: 5vh 4vw 5vh;
			gap: 0 2rem;
			pointer-events: none;
		}
		header > :global(*) {
			pointer-events: auto;
		}
		header > :global(.stamp) {
			justify-self: start;
			align-self: start;
		}
		.pitch {
			grid-column: 2;
			grid-row: 1 / 3;
			align-self: start;
			font-size: 1.1rem;
		}
		h1 {
			grid-column: 1 / -1;
			grid-row: 3;
			pointer-events: none;
			font-size: clamp(9rem, 27vw, 30rem);
			line-height: 0.74;
			letter-spacing: -0.045em;
			margin-left: -0.04em;
			color: color-mix(in srgb, var(--text) 6%, transparent);
			-webkit-text-stroke: 1.5px color-mix(in srgb, var(--text) 50%, transparent);
			mix-blend-mode: screen;
		}
		.actions,
		header > :global(a) {
			grid-row: 4;
			margin-top: 1.5rem;
		}

		.points {
			grid-template-columns: repeat(3, 1fr);
			gap: 4rem;
			padding: 14vh 6vw 22vh;
			align-items: start;
		}
		.points div {
			gap: 0.8rem;
			padding-left: 1.25rem;
			border-left-color: var(--glass-edge);
		}
		.points div:nth-child(2) {
			margin-top: 7rem;
		}
		.points div:nth-child(3) {
			margin-top: 14rem;
		}
		.points :global(h3) {
			font-size: clamp(1.9rem, 3vw, 2.8rem);
			font-weight: 700;
			line-height: 1;
		}
		footer {
			padding: 0 6vw 3rem;
		}
	}

	/* Where the browser can drive animation from scroll: the name widens and fades as you leave
	   the hero, and each point wipes in through the fog as it arrives. */
	@supports (animation-timeline: scroll()) {
		@media (min-width: 64rem) and (prefers-reduced-motion: no-preference) {
			h1 {
				animation: widen linear both;
				animation-timeline: scroll(root);
				animation-range: 0 90vh;
			}
			.points div {
				animation: wipe linear both;
				animation-timeline: view();
				animation-range: entry 5% entry 65%;
			}
		}
		@keyframes widen {
			to {
				font-variation-settings: 'wdth' 100;
				opacity: 0.1;
				letter-spacing: 0.01em;
			}
		}
		@keyframes wipe {
			from {
				opacity: 0;
				filter: blur(10px);
				translate: 0 3rem;
			}
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
