import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { getProgress, setCriterion } from '$lib/server/data';
import { detectMilestones, derive } from '$lib/progress/snapshot';
import { stopState } from '$lib/progress/logic';

const body = z.object({ criterionId: z.number().int(), done: z.boolean() });

/** Ticks or unticks one criterion of the signed-in user's progress. */
export async function POST(event) {
	const { user } = requireUser(event);
	const parsed = body.safeParse(await event.request.json().catch(() => null));
	if (!parsed.success) error(400, 'bad request');
	const { criterionId, done } = parsed.data;

	const curriculum = await loadCurriculum();
	const stop = curriculum.stops.find((s) => s.criteria.some((c) => c.id === criterionId));
	if (!stop) error(404, 'no such criterion');

	const now = Date.now();
	const before = derive(curriculum, await getProgress(user.id), now).states;
	const change = await setCriterion(user.id, stop, criterionId, done);

	const milestones =
		change.to > change.from
			? detectMilestones(
					curriculum,
					before,
					{
						...before,
						[stop.slug]: stopState(
							{ level: change.to, lastPracticedAt: change.lastPracticedAt },
							now
						)
					},
					stop.slug,
					change.firstMastered
				)
			: [];

	return json({ level: change.to, milestones });
}
