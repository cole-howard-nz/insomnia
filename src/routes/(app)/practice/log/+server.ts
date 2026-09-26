import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { logSession } from '$lib/server/data';
import { userToday } from '$lib/server/today';

const body = z.object({
	minutes: z.number().int().min(1).max(720),
	feel: z.enum(['sloppy', 'clean', 'breakthrough']),
	note: z.string().max(1000).default(''),
	stops: z
		.array(
			z.object({
				slug: z.string().max(100),
				bpm: z.number().int().min(20).max(400).nullable().default(null)
			})
		)
		.max(20)
});

/** Saves a finished practice session for the signed-in user. */
export async function POST(event) {
	const { user } = requireUser(event);
	const parsed = body.safeParse(await event.request.json().catch(() => null));
	if (!parsed.success) error(400, 'bad request');
	const input = parsed.data;

	const curriculum = await loadCurriculum();
	const stops: { stopId: number; bpm: number | null }[] = [];
	for (const { slug, bpm } of input.stops) {
		const stop = curriculum.stops.find((s) => s.slug === slug);
		if (!stop) error(404, 'no such stop');
		if (!stops.some((s) => s.stopId === stop.id)) stops.push({ stopId: stop.id, bpm });
	}

	const { id } = await logSession(user.id, {
		practicedOn: userToday(event.cookies),
		minutes: input.minutes,
		feel: input.feel,
		note: input.note.trim(),
		stops
	});
	return json({ id });
}
