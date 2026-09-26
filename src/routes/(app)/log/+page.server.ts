import { requireUser } from '$lib/server/auth/guards';
import { listSessionDays, listSessions } from '$lib/server/data';
import { LOG_PAGE_SIZE } from '$lib/progress/config';
import { addDays, summariseStreak } from '$lib/progress/streak';

export async function load(event) {
	const { user } = requireUser(event);
	const { curriculum, today, weeklyTarget } = await event.parent();

	// `?stop=slug` narrows the history. An unknown slug shows everything.
	const slug = event.url.searchParams.get('stop');
	const stop = curriculum.stops.find((s) => s.slug === slug);

	const [sessions, days] = await Promise.all([
		listSessions(user.id, { stopId: stop?.id, limit: LOG_PAGE_SIZE }),
		listSessionDays(user.id, addDays(today, -800))
	]);

	return {
		sessions,
		filter: stop?.slug ?? null,
		streak: summariseStreak(days, today, weeklyTarget)
	};
}
