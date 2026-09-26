import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { completeOnboarding } from '$lib/server/data';

export function load(event) {
	const { user } = requireUser(event);
	// Already through it: nothing to do here.
	if (user.onboardingDone) redirect(303, '/map');
	return {};
}

const payload = z.object({
	experience: z.enum(['new', 'some', 'plays']).nullable(),
	chasing: z.string().trim().max(200),
	weeklyTargetDays: z.number().int().min(1).max(7),
	// Never above Playable, whatever the client sends.
	seeds: z
		.array(z.object({ slug: z.string().max(100), level: z.union([z.literal(1), z.literal(2)]) }))
		.max(40)
});

export const actions = {
	finish: async (event) => {
		const { user } = requireUser(event);
		const raw = (await event.request.formData()).get('payload');
		let json: unknown = null;
		try {
			json = JSON.parse(String(raw));
		} catch {
			// falls through to the failure below
		}
		const parsed = payload.safeParse(json);
		if (!parsed.success) return fail(400, { message: 'something broke. not you. try again.' });

		const stops = new Map((await loadCurriculum()).stops.map((s) => [s.slug, s]));
		const seeds = parsed.data.seeds.flatMap(({ slug, level }) => {
			const stop = stops.get(slug);
			return stop ? [{ stop, level }] : [];
		});

		await completeOnboarding(user.id, { ...parsed.data, seeds });
		redirect(303, '/map');
	}
};
