import { jitter } from './jitter';
import { collectLinks, type Curriculum, type Layout } from './schema';

// Layout is generated once from the curriculum (npm run curriculum:layout) and
// committed as layout.json, so the map is stable across sessions and devices.
// Stops sit on a loose 3-column grid inside their region, ordered so that
// stops which help others come first. Regions are packed into two columns.

const COLS = 3;
const CELL_X = 140;
const CELL_Y = 110;
const STAGGER = 45;
const PAD_X = 55;
const PAD_TOP = 85;
const PAD_BOTTOM = 75;
const REGION_W = (COLS - 1) * CELL_X + STAGGER + PAD_X * 2;
const REGION_GAP_X = 120;
const REGION_GAP_Y = 100;

export function computeLayout(curriculum: Curriculum): Layout {
	const links = collectLinks(curriculum);
	const regionOf = new Map<string, string>();
	for (const region of curriculum)
		for (const stop of region.stops) regionOf.set(stop.slug, region.slug);

	const layout: Layout = { regions: {}, stops: {} };
	const columnBottom = [0, 60];

	for (const region of curriculum) {
		// Depth = longest chain of in-region links leading into the stop.
		const depth = new Map<string, number>();
		const depthOf = (slug: string): number => {
			const known = depth.get(slug);
			if (known !== undefined) return known;
			let d = 0;
			for (const [from, to] of links) {
				if (to === slug && regionOf.get(from) === region.slug) d = Math.max(d, depthOf(from) + 1);
			}
			depth.set(slug, d);
			return d;
		};
		const ordered = region.stops
			.map((stop, index) => ({ slug: stop.slug, index, depth: depthOf(stop.slug) }))
			.sort((a, b) => a.depth - b.depth || a.index - b.index);

		const rows = Math.ceil(ordered.length / COLS);
		const height = PAD_TOP + (rows - 1) * CELL_Y + PAD_BOTTOM;

		const column = columnBottom[0] <= columnBottom[1] ? 0 : 1;
		const x = Math.round(column * (REGION_W + REGION_GAP_X) + jitter(`${region.slug}x`) * 25);
		const y = Math.round(columnBottom[column] + jitter(`${region.slug}y`) * 15);
		columnBottom[column] = y + height + REGION_GAP_Y;
		layout.regions[region.slug] = { x, y, w: REGION_W, h: height };

		ordered.forEach(({ slug }, i) => {
			const col = i % COLS;
			const row = Math.floor(i / COLS);
			layout.stops[slug] = {
				x: Math.round(x + PAD_X + col * CELL_X + (row % 2) * STAGGER + jitter(`${slug}x`) * 8),
				y: Math.round(y + PAD_TOP + row * CELL_Y + jitter(`${slug}y`) * 8)
			};
		});
	}
	return layout;
}
