<script lang="ts">
	import { onMount } from 'svelte';
	import { LEVEL_NAMES, type CurriculumIndex, type StopState } from '$lib/curriculum/model';
	import { DEMO_STATES } from '$lib/landing-demo';
	import MapView from './MapView.svelte';

	// The public page's map, playing itself: a ghost cursor pans and zooms the map, opens a stop,
	// ticks what counts, watches it level up, then clears a rusting one. It is the real MapView and
	// real curriculum text, with a stand-in for the stop pane. Nothing here takes input; using the
	// map for real takes an account.
	let { index }: { index: CurriculumIndex } = $props();

	let states = $state<Record<string, StopState>>({ ...DEMO_STATES });
	let selected = $state<string | undefined>();
	let ignited = $state<{ slug: string; key: number } | null>(null);
	let map: MapView | undefined = $state();
	let root: HTMLDivElement | undefined = $state();
	let cardEl: HTMLElement | undefined = $state();

	// The cursor, the ripple under it, and the stand-in stop pane.
	let cursor = $state({ x: 0, y: 0, visible: false, grabbing: false, ms: 900 });
	let ripple = $state(0);
	let card = $state<{ slug: string; ticked: number; practised: boolean } | null>(null);

	function patchCard(patch: { ticked?: number; practised?: boolean }) {
		if (card) card = { ...card, ...patch };
	}

	const stopOf = $derived(card ? index.stop(card.slug) : undefined);
	const cardState = $derived(card ? (states[card.slug] ?? { level: 0, rusting: false }) : null);
	const regionName = $derived(stopOf ? index.region(stopOf.regionSlug)?.name : '');

	let key = 0;
	const ignite = (slug: string) => (ignited = { slug, key: ++key });

	let alive = true;
	/** Waits, and keeps waiting while the tab is hidden so the demo doesn't run unseen. */
	async function sleep(ms: number) {
		await new Promise((r) => setTimeout(r, ms));
		while (alive && document.hidden) await new Promise((r) => setTimeout(r, 500));
	}

	const wide = () => matchMedia('(min-width: 64rem)').matches;
	/** Where on the map a stop is held while its pane is open, clear of the pane itself. */
	const anchor = () => (wide() ? ([0.64, 0.42] as const) : ([0.5, 0.27] as const));

	function moveCursor(x: number, y: number, ms = 900, grabbing = false) {
		cursor = { x, y, visible: true, grabbing, ms };
		return sleep(ms);
	}
	async function click() {
		cursor.grabbing = true;
		await sleep(110);
		ripple++;
		cursor.grabbing = false;
		await sleep(200);
	}
	/** The centre of an element, in this component's own coordinates. */
	function centreOf(el: Element) {
		const a = root!.getBoundingClientRect();
		const b = el.getBoundingClientRect();
		return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height / 2 };
	}

	async function openStop(slug: string) {
		const at = anchor();
		await map!.focusStop(slug, 1.15, at[0], at[1], 2000);
		const p = map!.project(slug);
		if (!p) return;
		await moveCursor(p.x + 4, p.y + 4, 900);
		await click();
		selected = slug;
		card = { slug, ticked: 0, practised: false };
		await sleep(900);
	}

	async function closeStop() {
		card = null;
		selected = undefined;
		await sleep(700);
	}

	async function tick(i: number) {
		const box = cardEl?.querySelectorAll('.box')[i];
		if (!box) return;
		const c = centreOf(box);
		await moveCursor(c.x, c.y, 800);
		await click();
		patchCard({ ticked: i + 1 });
		await sleep(650);
	}

	async function reel() {
		await sleep(1200);
		while (alive) {
			states = { ...DEMO_STATES };
			selected = undefined;
			card = null;
			cursor.visible = false;
			await map!.overview(1);
			await sleep(1600);

			// 1. into the foundations district
			await map!.focusRegion('foundations', 2800);
			await sleep(500);

			// 2. drag the map around
			if (!alive) break;
			const mid = { x: root!.clientWidth * 0.55, y: root!.clientHeight * 0.55 };
			await moveCursor(mid.x, mid.y, 700);
			cursor = { ...cursor, grabbing: true, ms: 1700, x: mid.x - 150, y: mid.y - 50 };
			await map!.panBy(-150, -50, 1700);
			cursor = { ...cursor, grabbing: false };
			await sleep(500);

			// 3. open a stop and tick what counts until it levels up
			if (!alive) break;
			const a = 'reading-chord-diagrams';
			await openStop(a);
			await tick(1);
			states[a] = { level: 3, rusting: false };
			ignite(a);
			await sleep(1800);
			await closeStop();

			// 4. across to chords, and a stop that has gone quiet
			if (!alive) break;
			cursor.visible = false;
			await map!.focusRegion('chords', 2800);
			await sleep(400);
			const b = 'chord-changes';
			await openStop(b);
			await sleep(1200);
			const btn = cardEl?.querySelector('.practised');
			if (btn) {
				const c = centreOf(btn);
				await moveCursor(c.x, c.y, 900);
				await click();
				patchCard({ practised: true });
				states[b] = { level: 2, rusting: false };
				ignite(b);
			}
			await sleep(2000);
			await closeStop();

			// 5. songs, then the whole map again
			if (!alive) break;
			cursor.visible = false;
			await map!.focusRegion('songs', 2800, 1);
			await sleep(2200);
			await map!.overview(3000);
			await sleep(2600);
		}
	}

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		// Between scenes the lit stops glow now and then, so the map is never dead.
		const lit = Object.keys(DEMO_STATES).filter((slug) => DEMO_STATES[slug].level >= 2);
		const ambient = setInterval(() => {
			if (!document.hidden && !selected) ignite(lit[Math.floor(Math.random() * lit.length)]);
		}, 2400);
		reel();
		return () => {
			alive = false;
			clearInterval(ambient);
		};
	});
</script>

<div class="demo" bind:this={root}>
	<MapView bind:this={map} {index} {states} {selected} {ignited} showcase />

	<div class="overlay" aria-hidden="true">
		{#if card && stopOf && cardState}
			<section class="card glass" bind:this={cardEl}>
				<p class="tags">
					<span class="text-dim">{regionName}</span>
					<span
						class="stamp"
						class:stamp-accent={cardState.level >= 2 && cardState.level < 4}
						class:stamp-clear={cardState.level >= 4}
					>
						{LEVEL_NAMES[cardState.level]}
					</span>
					{#if cardState.rusting}<span class="stamp stamp-rust">rusting</span>{/if}
				</p>
				<h3>{stopOf.name}</h3>
				{#if cardState.rusting}
					<p class="rust">it's been 24 days. it misses you.</p>
				{:else}
					<p class="summary text-dim">{stopOf.summary}</p>
				{/if}
				<ul>
					{#each stopOf.criteria as c, i (c.id)}
						{@const on = c.level <= cardState.level || i < card.ticked}
						<li class:done={on}>
							<span class="box" class:on></span>
							<span>{c.text}</span>
						</li>
					{/each}
				</ul>
				{#if cardState.rusting || card.practised}
					<span class="practised" class:pressed={card.practised}>
						{card.practised ? 'played it. cloud lifted.' : 'i played it today'}
					</span>
				{/if}
			</section>
		{/if}

		{#if cursor.visible}
			<div
				class="cursor"
				class:grabbing={cursor.grabbing}
				style:transform="translate({cursor.x}px, {cursor.y}px)"
				style:transition-duration="{cursor.ms}ms"
			>
				{#key ripple}<span class="ripple"></span>{/key}
				<svg width="22" height="26" viewBox="0 0 22 26">
					<path
						d="M2 2 2 20 7 15.5 10.5 23.5 14 22 10.6 14.2 17.5 14Z"
						fill="#f3efe4"
						stroke="#0c0d10"
						stroke-width="1.5"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
		{/if}
	</div>
</div>

<style>
	.demo {
		position: relative;
		width: 100%;
		height: 100%;
	}
	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 3;
	}

	.cursor {
		position: absolute;
		top: 0;
		left: 0;
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.45, 0, 0.2, 1);
		will-change: transform;
	}
	.cursor svg {
		display: block;
		filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.6));
		transition: scale 0.12s;
		transform-origin: 2px 2px;
	}
	.cursor.grabbing svg {
		scale: 0.88;
	}
	.ripple {
		position: absolute;
		left: -14px;
		top: -14px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: 2px solid var(--accent);
		opacity: 0;
		animation: ripple 0.7s ease-out;
	}
	@keyframes ripple {
		from {
			opacity: 0.9;
			scale: 0.3;
		}
		to {
			opacity: 0;
			scale: 2.2;
		}
	}

	/* The stand-in for the stop pane: a bottom card on a phone, a pane at the top left on desktop. */
	.card {
		position: absolute;
		inset: auto 0.75rem 0.75rem 0.75rem;
		padding: 0.9rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		animation: card-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes card-in {
		from {
			opacity: 0;
			translate: 0 1.5rem;
			filter: blur(8px);
		}
	}
	.tags {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}
	h3 {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.summary,
	.rust {
		font-size: 0.9rem;
		line-height: 1.45;
	}
	.rust {
		color: color-mix(in srgb, var(--rust) 40%, var(--text));
	}
	ul {
		list-style: none;
		margin: 0.2rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}
	li {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
		color: var(--text-dim);
		transition: color 0.3s;
	}
	li.done {
		color: var(--text);
	}
	.box {
		flex: none;
		width: 1.05rem;
		height: 1.05rem;
		margin-top: 0.1rem;
		border: 1.5px solid var(--text-dim);
		transition:
			background 0.25s,
			border-color 0.25s;
	}
	.box.on {
		background: var(--accent);
		border-color: var(--accent);
		box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 60%, transparent);
	}
	.practised {
		align-self: flex-start;
		margin-top: 0.3rem;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--accent);
		color: var(--accent);
		font-family: var(--font-display);
		transition:
			background 0.25s,
			color 0.25s;
	}
	.practised.pressed {
		background: var(--accent);
		color: var(--bg-deep);
	}

	@media (min-width: 64rem) {
		.card {
			inset: 5vh auto auto 4vw;
			width: 24rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
		}
	}
</style>
