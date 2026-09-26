import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { saveStopDetails, startStop } from '$lib/server/data';

const body = z.object({
	slug: z.string().max(100),
	/** Marks the stop as Learning. */
	start: z.boolean().optional(),
	notes: z.string().max(4000).optional(),
	bestBpm: z.number().int().min(20).max(400).nullable().optional()
});

/** Starts a stop, or saves its notes and best tempo. */
export async function POST(event) {
	const { user } = requireUser(event);
	const parsed = body.safeParse(await event.request.json().catch(() => null));
	if (!parsed.success) error(400, 'bad request');
	const { slug, start, notes, bestBpm } = parsed.data;

	const stop = (await loadCurriculum()).stops.find((s) => s.slug === slug);
	if (!stop) error(404, 'no such stop');

	if (start) await startStop(user.id, stop.id);
	if (notes !== undefined || bestBpm !== undefined) {
		await saveStopDetails(user.id, stop.id, { notes, bestBpm });
	}
	return json({ ok: true });
}
