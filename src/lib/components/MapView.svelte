<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import {
		describeStop,
		type CurriculumIndex,
		type StopState,
		UNSEEN
	} from '$lib/curriculum/model';
	import { wobblyLine, wobblyRect, wrapLabel } from '$lib/map/geometry';
	import {
		MAX_ZOOM,
		boxView,
		centerOn,
		clampView,
		lerpView,
		zoomAt,
		type Box,
		type View
	} from '$lib/map/viewport';
	import StopGlyph from './StopGlyph.svelte';

	/**
	 * The skill map: regions as districts, stops as nodes, links as thin lines.
	 * Drag to pan, pinch or wheel to zoom, tap a region to zoom in, tap a stop
	 * to open it. Stops are real links to `/map/[stop]`, so it works without
	 * pointer gestures too (the list view is the full alternative).
	 *
	 * `states` feeds every node (missing means Unseen). `selected` is the open stop.
	 */
	let {
		index,
		states = {},
		selected,
		query = ''
	}: {
		index: CurriculumIndex;
		states?: Record<string, StopState>;
		selected?: string;
		/** Appended to stop links, e.g. "?view=map". */
		query?: string;
	} = $props();

	const NODE_R = 14;
	const HIT_R = 24;
	/** Below this zoom the map is an overview: regions are the tap targets. */
	const DETAIL_K = 0.55;

	const world: Box = $derived({
		x: index.bounds.x - 40,
		y: index.bounds.y - 40,
		w: index.bounds.w + 80,
		h: index.bounds.h + 80
	});

	let width = $state(0);
	let height = $state(0);
	let view = $state<View | undefined>();
	let atFit = true;

	const size = $derived({ w: width, h: height });
	const fit = $derived(width && height ? boxView(world, size, 12) : undefined);
	const minK = $derived((fit?.k ?? 0.1) * 0.9);
	const detail = $derived((view?.k ?? 0) >= DETAIL_K);

	// Fit on first size, and keep fitting on resize until the user moves the map.
	$effect(() => {
		const next = fit;
		untrack(() => {
			if (next && (!view || atFit)) view = next;
		});
	});

	const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	let animation = 0;
	function animateTo(target: View, ms = 320) {
		cancelAnimationFrame(animation);
		if (!view) return;
		if (reduced()) {
			view = target;
			return;
		}
		const from = view;
		const start = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / ms);
			view = lerpView(from, target, 1 - Math.pow(1 - t, 3));
			if (t < 1) animation = requestAnimationFrame(step);
		};
		animation = requestAnimationFrame(step);
	}

	function moved(next: View) {
		atFit = false;
		view = clampView(next, world, size);
	}

	// Pointers: one pans, two pinch. Capture only once a drag starts, so taps
	// still land on the stop under the finger.
	const pointers = new SvelteMap<number, { x: number; y: number }>();
	let dragging = false;
	let didDrag = false;
	let pinchDistance = 0;
	let downAt = { x: 0, y: 0 };
	let container: HTMLDivElement | undefined = $state();

	const local = (event: { clientX: number; clientY: number }) => {
		const rect = container!.getBoundingClientRect();
		return { x: event.clientX - rect.left, y: event.clientY - rect.top };
	};

	function onPointerDown(event: PointerEvent) {
		cancelAnimationFrame(animation);
		if (pointers.size === 0) didDrag = false;
		pointers.set(event.pointerId, local(event));
		downAt = local(event);
		if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
			didDrag = true;
		}
	}

	function onPointerMove(event: PointerEvent) {
		const previous = pointers.get(event.pointerId);
		if (!previous || !view) return;
		const point = local(event);
		pointers.set(event.pointerId, point);

		if (pointers.size >= 2) {
			const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)![1];
			const distance = Math.hypot(point.x - other.x, point.y - other.y);
			if (pinchDistance > 0) {
				// Zoom about the old midpoint, then follow the midpoint as it moves.
				const from = { x: (previous.x + other.x) / 2, y: (previous.y + other.y) / 2 };
				const to = { x: (point.x + other.x) / 2, y: (point.y + other.y) / 2 };
				const zoomed = zoomAt(view, (view.k * distance) / pinchDistance, from.x, from.y, minK);
				moved({ ...zoomed, x: zoomed.x + to.x - from.x, y: zoomed.y + to.y - from.y });
			}
			pinchDistance = distance;
			return;
		}

		if (!dragging) {
			if (Math.hypot(point.x - downAt.x, point.y - downAt.y) < 6) return;
			dragging = true;
			didDrag = true;
			container?.setPointerCapture(event.pointerId);
		}
		moved({ ...view, x: view.x + point.x - previous.x, y: view.y + point.y - previous.y });
	}

	function onPointerUp(event: PointerEvent) {
		pointers.delete(event.pointerId);
		pinchDistance = 0;
		if (pointers.size === 0) dragging = false;
		// A finger left over from a pinch starts a fresh drag from where it is.
		else downAt = [...pointers.values()][0];
	}

	/** A drag or pinch must not also count as a tap on whatever was underneath. */
	function onClickCapture(event: MouseEvent) {
		if (didDrag) {
			event.preventDefault();
			event.stopPropagation();
			didDrag = false;
		}
	}

	function onWheel(event: WheelEvent) {
		if (!view) return;
		event.preventDefault();
		cancelAnimationFrame(animation);
		const { x, y } = local(event);
		const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015));
		moved(zoomAt(view, view.k * factor, x, y, minK));
	}

	function zoomBy(factor: number) {
		if (!view) return;
		atFit = false;
		animateTo(clampView(zoomAt(view, view.k * factor, width / 2, height / 2, minK), world, size));
	}

	function reset() {
		atFit = true;
		if (fit) animateTo(fit);
	}

	function zoomToRegion(slug: string) {
		const region = index.region(slug);
		if (!region) return;
		atFit = false;
		animateTo(boxView(region, size, 16, 1.4));
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.target !== container || !view) return;
		const pan = 80;
		const keys: Record<string, () => void> = {
			ArrowLeft: () => moved({ ...view!, x: view!.x + pan }),
			ArrowRight: () => moved({ ...view!, x: view!.x - pan }),
			ArrowUp: () => moved({ ...view!, y: view!.y + pan }),
			ArrowDown: () => moved({ ...view!, y: view!.y - pan }),
			'+': () => zoomBy(1.4),
			'=': () => zoomBy(1.4),
			'-': () => zoomBy(1 / 1.4),
			'0': reset
		};
		const action = keys[event.key];
		if (action) {
			event.preventDefault();
			action();
		}
	}

	// When a stop opens, bring it into the top half (the sheet covers the rest).
	let lastSelected: string | undefined;
	const ready = $derived(view !== undefined && height > 0);
	$effect(() => {
		const slug = selected;
		if (!ready || slug === lastSelected) return;
		lastSelected = slug;
		untrack(() => {
			const stop = slug ? index.stop(slug) : undefined;
			if (!stop || !view) return;
			atFit = false;
			const k = Math.min(Math.max(view.k, 0.9), MAX_ZOOM);
			animateTo(clampView(centerOn(stop.x, stop.y, k, width / 2, height * 0.28), world, size));
		});
	});

	const hulls = $derived(
		index.data.regions.map((r) => ({
			region: r,
			path: wobblyRect(r.x, r.y, r.w, r.h, r.slug)
		}))
	);

	// In-region links are always drawn. Links to other regions only for the
	// open stop, otherwise the songs region turns the map into string.
	const links = $derived(
		index.data.links.flatMap((link) => {
			const a = index.stop(link.from);
			const b = index.stop(link.to);
			if (!a || !b) return [];
			const inside = a.regionSlug === b.regionSlug;
			const active = selected === link.from || selected === link.to;
			if (!inside && !active) return [];
			return [
				{
					key: `${link.from}>${link.to}>${link.kind}`,
					d: wobblyLine(a.x, a.y, b.x, b.y, `${link.from}${link.to}`),
					kind: link.kind,
					active
				}
			];
		})
	);

	const labelSize = $derived(Math.min(64, Math.max(22, 15 / (view?.k ?? 1))));
	const href = (slug: string) => `${resolve('/(app)/map/[stop]', { stop: slug })}${query}`;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- every href comes from href(), which calls resolve() -->

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="map"
	bind:this={container}
	bind:clientWidth={width}
	bind:clientHeight={height}
	role="application"
	aria-label="skill map. drag to pan, pinch or scroll to zoom. the list view has everything on it."
	tabindex="0"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
	onclickcapture={onClickCapture}
	onwheel={onWheel}
	onkeydown={onKeyDown}
>
	{#if view}
		<svg {width} {height}>
			<g transform="translate({view.x} {view.y}) scale({view.k})">
				{#each hulls as { region, path } (region.slug)}
					<g class="region" class:tappable={!detail}>
						<path class="hull" d={path} />
						{#if !detail}
							<rect
								class="region-hit"
								x={region.x}
								y={region.y}
								width={region.w}
								height={region.h}
								role="button"
								tabindex="0"
								aria-label="{region.name}, {region.stopSlugs.length} stops. zoom to region"
								onclick={() => zoomToRegion(region.slug)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										zoomToRegion(region.slug);
									}
								}}
							/>
						{/if}
						<text
							class="region-name"
							x={region.x + 18}
							y={region.y + 12 + labelSize * 0.8}
							font-size={labelSize}
							aria-hidden="true">{region.name}</text
						>
					</g>
				{/each}

				<g class="links" aria-hidden="true">
					{#each links as link (link.key)}
						<path
							class="link"
							class:unlocks={link.kind === 'unlocks'}
							class:active={link.active}
							d={link.d}
						/>
					{/each}
				</g>

				<g class="stops" class:inert={!detail}>
					{#each index.data.stops as stop (stop.slug)}
						{@const state = states[stop.slug] ?? UNSEEN}
						{@const lines = wrapLabel(stop.name)}
						<g transform="translate({stop.x} {stop.y})">
							<a
								class="stop"
								class:selected={selected === stop.slug}
								href={href(stop.slug)}
								aria-label={describeStop(stop, index.region(stop.regionSlug), state)}
								aria-current={selected === stop.slug ? 'true' : undefined}
								tabindex={detail ? undefined : -1}
							>
								<circle class="hit" r={HIT_R} />
								{#if selected === stop.slug}
									<circle class="selection" r={NODE_R + 10} />
								{/if}
								<StopGlyph {state} kind={stop.kind} r={NODE_R} />
								{#if detail}
									<text class="label" y={NODE_R + 20} text-anchor="middle" aria-hidden="true">
										{#each lines as line, i (i)}
											<tspan x="0" dy={i === 0 ? 0 : 15}>{line}</tspan>
										{/each}
									</text>
								{/if}
							</a>
						</g>
					{/each}
				</g>
			</g>
		</svg>
	{/if}

	<div class="controls">
		<button type="button" aria-label="zoom in" onclick={() => zoomBy(1.4)}>+</button>
		<button type="button" aria-label="zoom out" onclick={() => zoomBy(1 / 1.4)}>&minus;</button>
		<button type="button" aria-label="reset view" onclick={reset}>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="square"
				/>
			</svg>
		</button>
	</div>
</div>

<style>
	.map {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 22rem;
		overflow: hidden;
		touch-action: none;
		cursor: grab;
		user-select: none;
		-webkit-user-select: none;
	}
	.map:active {
		cursor: grabbing;
	}
	.map:focus-visible {
		outline-offset: -3px;
	}
	svg {
		display: block;
	}

	.hull {
		fill: color-mix(in srgb, var(--bg-cloud) 55%, transparent);
		stroke: var(--line);
		stroke-width: 1.5;
	}
	.region-name {
		font-family: var(--font-display);
		fill: var(--text-dim);
		letter-spacing: 0.02em;
		pointer-events: none;
	}
	.region-hit {
		fill: transparent;
		cursor: pointer;
	}
	.region:not(.tappable) .region-hit {
		display: none;
	}

	.link {
		fill: none;
		stroke: var(--text-dim);
		stroke-opacity: 0.28;
		stroke-width: 1.2;
		stroke-linecap: round;
	}
	.link.unlocks {
		stroke-dasharray: 5 5;
	}
	.link.active {
		stroke: var(--accent);
		stroke-opacity: 0.9;
		stroke-width: 1.8;
	}

	.stops.inert .stop {
		pointer-events: none;
	}
	.stop {
		cursor: pointer;
		outline: none;
	}
	.hit {
		fill: transparent;
	}
	.selection {
		fill: none;
		stroke: var(--text);
		stroke-width: 1.5;
		stroke-dasharray: 4 3;
	}
	.stop:focus-visible .hit {
		stroke: var(--accent);
		stroke-width: 2;
	}
	.label {
		font-family: var(--font-body);
		font-size: 13px;
		fill: var(--text);
		paint-order: stroke;
		stroke: var(--bg-deep);
		stroke-width: 4px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	.stop.selected .label {
		font-weight: 500;
	}

	.controls {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.controls button {
		display: grid;
		place-items: center;
		width: var(--tap);
		min-height: var(--tap);
		background: var(--bg-cloud);
		color: var(--text);
		border: 1px solid var(--line);
		font-family: var(--font-display);
		font-size: 1.4rem;
		line-height: 1;
	}
	.controls button:hover {
		background: var(--bg-cloud-hi);
	}
</style>
