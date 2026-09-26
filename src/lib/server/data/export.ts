import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	criteria,
	levelEvents,
	practiceSessionStops,
	practiceSessions,
	stops,
	userCriteriaDone,
	userStopProgress,
	users
} from '$lib/server/db/schema';
import { getSettings } from './settings';

/**
 * Everything the app holds about one user, as plain JSON. Later phases add their
 * tables (evidence metadata) as new keys. Stops are named by slug so the file reads
 * without the curriculum. Never includes the password hash or session and token hashes.
 */
export async function exportUserData(userId: string) {
	const [account] = await db
		.select({
			id: users.id,
			email: users.email,
			emailVerifiedAt: users.emailVerifiedAt,
			displayName: users.displayName,
			onboardingDone: users.onboardingDone,
			createdAt: users.createdAt
		})
		.from(users)
		.where(eq(users.id, userId));

	const progress = await db
		.select({
			stop: stops.slug,
			level: userStopProgress.level,
			lastPracticedAt: userStopProgress.lastPracticedAt,
			bestBpm: userStopProgress.bestBpm,
			notes: userStopProgress.notes
		})
		.from(userStopProgress)
		.innerJoin(stops, eq(stops.id, userStopProgress.stopId))
		.where(eq(userStopProgress.userId, userId))
		.orderBy(asc(stops.sort));

	const criteriaDone = await db
		.select({
			stop: stops.slug,
			level: criteria.level,
			criterion: criteria.text,
			doneAt: userCriteriaDone.doneAt
		})
		.from(userCriteriaDone)
		.innerJoin(criteria, eq(criteria.id, userCriteriaDone.criterionId))
		.innerJoin(stops, eq(stops.id, criteria.stopId))
		.where(eq(userCriteriaDone.userId, userId))
		.orderBy(asc(userCriteriaDone.doneAt));

	const sessionRows = await db
		.select()
		.from(practiceSessions)
		.where(eq(practiceSessions.userId, userId))
		.orderBy(asc(practiceSessions.practicedOn), asc(practiceSessions.createdAt));
	const sessionStops = await db
		.select({
			sessionId: practiceSessionStops.sessionId,
			stop: stops.slug,
			bpm: practiceSessionStops.bpm
		})
		.from(practiceSessionStops)
		.innerJoin(stops, eq(stops.id, practiceSessionStops.stopId))
		.where(eq(practiceSessionStops.userId, userId));

	const events = await db
		.select({
			stop: stops.slug,
			fromLevel: levelEvents.fromLevel,
			toLevel: levelEvents.toLevel,
			at: levelEvents.createdAt
		})
		.from(levelEvents)
		.innerJoin(stops, eq(stops.id, levelEvents.stopId))
		.where(eq(levelEvents.userId, userId))
		.orderBy(asc(levelEvents.createdAt));

	return {
		exportedAt: new Date().toISOString(),
		account: account ?? null,
		settings: await getSettings(userId),
		progress,
		criteriaDone,
		practiceSessions: sessionRows.map((s) => ({
			practicedOn: s.practicedOn,
			minutes: s.minutes,
			feel: s.feel,
			note: s.note,
			loggedAt: s.createdAt,
			stops: sessionStops
				.filter((x) => x.sessionId === s.id)
				.map((x) => ({ stop: x.stop, bpm: x.bpm }))
		})),
		levelEvents: events
	};
}
