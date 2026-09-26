import { z } from 'zod';

// Source format for the curriculum files. Authored by hand, validated before
// seeding and in tests. Imports here must stay relative (tsx runs the seed script).

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case');
const criterionList = z.array(z.string().min(8).max(200)).min(1).max(4);

export const resourceSchema = z.object({
	title: z.string().min(2).max(80),
	url: z.url().refine((u) => u.startsWith('https://'), 'resources must be https links'),
	kind: z.enum(['video', 'tab', 'article', 'exercise'])
});

export const stopSchema = z.object({
	slug,
	name: z.string().min(2).max(30),
	summary: z.string().min(20).max(260),
	kind: z.enum(['skill', 'song']).default('skill'),
	targetBpm: z.number().int().min(30).max(300).optional(),
	/** Stops that make this one easier. Each becomes a `helps` link into this stop. */
	helpedBy: z.array(slug).default([]),
	/** Stops after which this one is much more natural. Each becomes an `unlocks` link. */
	unlockedBy: z.array(slug).default([]),
	criteria: z.object({ 2: criterionList, 3: criterionList, 4: criterionList }),
	resources: z.array(resourceSchema).min(1).max(5)
});

export const regionSchema = z.object({
	slug,
	name: z.string().min(2).max(24),
	blurb: z.string().min(10).max(200),
	stops: z.array(stopSchema).min(1)
});

export const curriculumSchema = z.array(regionSchema).min(1);

export type ResourceSource = z.input<typeof resourceSchema>;
export type StopSource = z.input<typeof stopSchema>;
export type RegionSource = z.input<typeof regionSchema>;
export type Curriculum = z.output<typeof curriculumSchema>;

export const layoutSchema = z.object({
	regions: z.record(slug, z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })),
	stops: z.record(slug, z.object({ x: z.number(), y: z.number() }))
});
export type Layout = z.infer<typeof layoutSchema>;

/** Every link as [fromSlug, toSlug, kind], from prerequisite to dependent. */
export function collectLinks(curriculum: Curriculum) {
	const links: [string, string, 'helps' | 'unlocks'][] = [];
	for (const region of curriculum) {
		for (const stop of region.stops) {
			for (const from of stop.helpedBy) links.push([from, stop.slug, 'helps']);
			for (const from of stop.unlockedBy) links.push([from, stop.slug, 'unlocks']);
		}
	}
	return links;
}

/**
 * Parses the source and checks what a schema cannot: unique slugs, links that
 * resolve, no self links, no duplicate links, no cycles, layout coverage.
 * Throws with every problem listed.
 */
export function validateCurriculum(input: unknown, layout?: unknown): Curriculum {
	const parsed = curriculumSchema.safeParse(input);
	if (!parsed.success) throw new Error(`invalid curriculum:\n${z.prettifyError(parsed.error)}`);
	const curriculum = parsed.data;
	const problems: string[] = [];

	const stopSlugs = new Set<string>();
	const regionSlugs = new Set<string>();
	for (const region of curriculum) {
		if (regionSlugs.has(region.slug)) problems.push(`duplicate region slug "${region.slug}"`);
		regionSlugs.add(region.slug);
		for (const stop of region.stops) {
			if (stopSlugs.has(stop.slug)) problems.push(`duplicate stop slug "${stop.slug}"`);
			stopSlugs.add(stop.slug);
		}
	}

	const seen = new Set<string>();
	const edges = new Map<string, string[]>();
	for (const [from, to, kind] of collectLinks(curriculum)) {
		if (!stopSlugs.has(from)) problems.push(`"${to}" ${kind}-links to unknown stop "${from}"`);
		if (from === to) problems.push(`"${to}" links to itself`);
		const key = `${from}>${to}>${kind}`;
		if (seen.has(key)) problems.push(`duplicate ${kind} link ${from} -> ${to}`);
		seen.add(key);
		edges.set(from, [...(edges.get(from) ?? []), to]);
	}

	// Depth-first cycle check over all links.
	const state = new Map<string, 1 | 2>();
	const visit = (node: string, path: string[]) => {
		if (state.get(node) === 2) return;
		if (state.get(node) === 1) {
			problems.push(`link cycle: ${[...path.slice(path.indexOf(node)), node].join(' -> ')}`);
			return;
		}
		state.set(node, 1);
		for (const next of edges.get(node) ?? []) visit(next, [...path, node]);
		state.set(node, 2);
	};
	for (const node of stopSlugs) visit(node, []);

	if (layout !== undefined) {
		const parsedLayout = layoutSchema.safeParse(layout);
		if (!parsedLayout.success) {
			problems.push(`invalid layout: ${z.prettifyError(parsedLayout.error)}`);
		} else {
			for (const region of curriculum) {
				if (!parsedLayout.data.regions[region.slug])
					problems.push(`no layout for region "${region.slug}"`);
			}
			for (const slug of stopSlugs) {
				if (!parsedLayout.data.stops[slug]) problems.push(`no layout for stop "${slug}"`);
			}
		}
	}

	if (problems.length) throw new Error(`invalid curriculum:\n- ${problems.join('\n- ')}`);
	return curriculum;
}
