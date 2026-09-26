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
import { getStorage } from '$lib/server/storage';
import { zipStream } from '$lib/server/zip';
import { listEvidenceKeys } from './evidence';
import { getSettings } from './settings';

/** The name a recording has inside the zip export. */
export function evidenceFileName(e: {
	storageKey: string | null;
	mime: string | null;
	createdAt: Date;
}) {
	const ext = (e.mime ?? '').split('/')[1]?.replace('x-', '').replace('mpeg', 'mp3') || 'bin';
	const stamp = e.createdAt.toISOString().replace(/[:.]/g, '-');
	const id = (e.storageKey ?? '').split('/').pop()?.slice(0, 8) ?? 'file';
	return `evidence/${stamp}-${id}.${ext}`;
}

/**
 * Everything the app holds about one user, as plain JSON. Recordings are
 * listed here and included by `exportUserZip`. Stops are named by slug so the file reads
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

	const evidenceRows = await listEvidenceKeys(userId);
	const slugById = new Map(
		(await db.select({ id: stops.id, slug: stops.slug }).from(stops)).map((s) => [s.id, s.slug])
	);

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
		levelEvents: events,
		// Files are in the zip export, at `file`. A note has no file.
		evidence: evidenceRows
			.slice()
			.reverse()
			.map((e) => ({
				stop: slugById.get(e.stopId) ?? null,
				kind: e.kind,
				levelAt: e.levelAt,
				note: e.note,
				durationSeconds: e.durationSeconds,
				attachedAt: e.createdAt,
				file: e.storageKey ? evidenceFileName(e) : null
			}))
	};
}

/** The JSON export plus every recording, as a streamed zip. */
export async function exportUserZip(userId: string) {
	const [data, files] = await Promise.all([exportUserData(userId), listEvidenceKeys(userId)]);
	const storage = getStorage();
	return zipStream([
		{
			name: 'insomnia-export.json',
			data: async () => new TextEncoder().encode(JSON.stringify(data, null, 2))
		},
		...files.flatMap((e) =>
			e.storageKey
				? [
						{
							name: evidenceFileName(e),
							modified: e.createdAt,
							data: async () => {
								const stored = await storage.get(e.storageKey!);
								return stored
									? new Uint8Array(await new Response(stored.stream).arrayBuffer())
									: new Uint8Array();
							}
						}
					]
				: []
		)
	]);
}
