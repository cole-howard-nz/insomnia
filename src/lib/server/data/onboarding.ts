import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	levelEvents,
	userCriteriaDone,
	userSettings,
	userStopProgress,
	users
} from '$lib/server/db/schema';
import type { StopModel } from '$lib/curriculum/model';
import type { SeedLevel } from '$lib/onboarding/seed';
import { DEFAULT_SETTINGS } from './settings';

export interface OnboardingAnswers {
	experience: 'new' | 'some' | 'plays' | null;
	chasing: string;
	weeklyTargetDays: number;
	/** The stops the user confirmed, already resolved against the curriculum. */
	seeds: { stop: StopModel; level: SeedLevel }[];
}

/**
 * Saves the answers, seeds the confirmed stops, and marks onboarding done, all at once.
 * Runs at most once per account: a second call changes nothing. Seeds are only ever Learning
 * or Playable (the type says so), and a stop the user already has progress on is left alone.
 * Playable means its Playable criteria are ticked, which is the user's own confirmation.
 */
export async function completeOnboarding(
	userId: string,
	answers: OnboardingAnswers
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const claimed = await tx
			.update(users)
			.set({ onboardingDone: true })
			.where(and(eq(users.id, userId), eq(users.onboardingDone, false)))
			.returning({ id: users.id });
		if (claimed.length === 0) return false;

		await tx
			.insert(userSettings)
			.values({
				...DEFAULT_SETTINGS,
				userId,
				weeklyTargetDays: answers.weeklyTargetDays,
				experience: answers.experience,
				chasing: answers.chasing
			})
			.onConflictDoUpdate({
				target: userSettings.userId,
				set: {
					weeklyTargetDays: answers.weeklyTargetDays,
					experience: answers.experience,
					chasing: answers.chasing
				}
			});

		const now = new Date();
		for (const { stop, level } of answers.seeds) {
			const inserted = await tx
				.insert(userStopProgress)
				.values({
					userId,
					stopId: stop.id,
					level,
					lastPracticedAt: level >= 2 ? now : null
				})
				.onConflictDoNothing()
				.returning({ stopId: userStopProgress.stopId });
			if (inserted.length === 0) continue; // already has progress, leave it

			await tx.insert(levelEvents).values({ userId, stopId: stop.id, fromLevel: 0, toLevel: 1 });
			if (level >= 2) {
				await tx.insert(levelEvents).values({ userId, stopId: stop.id, fromLevel: 1, toLevel: 2 });
				const playable = stop.criteria.filter((c) => c.level === 2);
				if (playable.length) {
					await tx
						.insert(userCriteriaDone)
						.values(playable.map((c) => ({ userId, criterionId: c.id })))
						.onConflictDoNothing();
				}
			}
		}
		return true;
	});
}
