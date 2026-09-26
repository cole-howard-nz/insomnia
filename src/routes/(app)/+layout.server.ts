import { redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { getProgress, getSettings } from '$lib/server/data';
import { userToday } from '$lib/server/today';

// The curriculum, the user's progress and their weekly target are needed by every tab,
// so they load once here. Progress is the only private part and is scoped to the user.
export async function load(event) {
	const { user } = requireUser(event);
	// A new account goes through onboarding once, before anything else in the app.
	if (!user.onboardingDone && event.url.pathname !== '/welcome') redirect(303, '/welcome');
	const [curriculum, progress, settings] = await Promise.all([
		loadCurriculum(),
		getProgress(user.id),
		getSettings(user.id)
	]);
	return {
		curriculum,
		progress,
		weeklyTarget: settings.weeklyTargetDays,
		rainSound: settings.rainSound,
		today: userToday(event.cookies),
		now: Date.now()
	};
}
