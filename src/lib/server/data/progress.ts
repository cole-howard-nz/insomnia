import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { levelEvents, userCriteriaDone, userStopProgress } from '$lib/server/db/schema';
import type { Level, StopModel } from '$lib/curriculum/model';
import { calcLevel } from '$lib/progress/logic';
import type { ProgressSnapshot, StopProgress } from '$lib/progress/model';

// Progress per stop and the criteria ticked. Rows are created lazily: no row is Unseen.
// Every function takes `userId` first and scopes every query by it.

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const toProgress = (row: typeof userStopProgress.$inferSelect): StopProgress => ({
	stopId: row.stopId,
	level: row.level as Level,
	lastPracticedAt: row.lastPracticedAt?.toISOString() ?? null,
	updatedAt: row.updatedAt.toISOString(),
	bestBpm: row.bestBpm,
	notes: row.notes
});

export async function getProgress(userId: string): Promise<ProgressSnapshot> {
	const [rows, done] = await Promise.all([
		db.select().from(userStopProgress).where(eq(userStopProgress.userId, userId)),
		db
			.select({ id: userCriteriaDone.criterionId })
			.from(userCriteriaDone)
			.where(eq(userCriteriaDone.userId, userId))
	]);
	return { stops: rows.map(toProgress), criteriaDone: done.map((d) => d.id) };
}

/**
 * Makes sure a progress row exists (a stop the user has touched is at least Learning) and
 * records the 0 to 1 level event when it is new. Returns the level the stop was at before.
 */
export async function ensureStarted(tx: Tx, userId: string, stopId: number): Promise<Level> {
	const inserted = await tx
		.insert(userStopProgress)
		.values({ userId, stopId, level: 1 })
		.onConflictDoNothing()
		.returning({ stopId: userStopProgress.stopId });
	if (inserted.length > 0) {
		await tx.insert(levelEvents).values({ userId, stopId, fromLevel: 0, toLevel: 1 });
		return 0;
	}
	const [row] = await tx
		.select({ level: userStopProgress.level })
		.from(userStopProgress)
		.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, stopId)));
	return row.level as Level;
}

export interface LevelChange {
	from: Level;
	to: Level;
	lastPracticedAt: string | null;
	/** True when this is the first time this user reached Mastered on any stop. */
	firstMastered: boolean;
}

/**
 * Ticks or unticks one criterion of a stop and recomputes the level. Ticking counts as
 * practising the stop (that is the re-check that clears rust), unticking does not.
 * `stop` comes from the curriculum, so the criterion is known to belong to it.
 */
export async function setCriterion(
	userId: string,
	stop: StopModel,
	criterionId: number,
	done: boolean
): Promise<LevelChange> {
	return db.transaction(async (tx) => {
		const startedAt = await ensureStarted(tx, userId, stop.id);
		const criterionIds = stop.criteria.map((c) => c.id);

		if (done) {
			await tx.insert(userCriteriaDone).values({ userId, criterionId }).onConflictDoNothing();
		} else {
			await tx
				.delete(userCriteriaDone)
				.where(
					and(eq(userCriteriaDone.userId, userId), eq(userCriteriaDone.criterionId, criterionId))
				);
		}

		const ticked = await tx
			.select({ id: userCriteriaDone.criterionId })
			.from(userCriteriaDone)
			.where(
				and(
					eq(userCriteriaDone.userId, userId),
					inArray(userCriteriaDone.criterionId, criterionIds)
				)
			);
		const to = calcLevel(stop.criteria, new Set(ticked.map((t) => t.id)), true);

		// ensureStarted already logged 0 to 1, so the change to report starts from Unseen only
		// when the row was new, and the event below carries on from wherever it stands now.
		const [current] = await tx
			.select({ level: userStopProgress.level })
			.from(userStopProgress)
			.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, stop.id)));
		const before = current.level as Level;

		let firstMastered = false;
		if (to !== before) {
			if (to === 4) {
				const [{ n }] = await tx
					.select({ n: sql<number>`count(*)::int` })
					.from(levelEvents)
					.where(and(eq(levelEvents.userId, userId), eq(levelEvents.toLevel, 4)));
				firstMastered = n === 0;
			}
			await tx
				.insert(levelEvents)
				.values({ userId, stopId: stop.id, fromLevel: before, toLevel: to });
		}

		const [row] = await tx
			.update(userStopProgress)
			.set({
				level: to,
				updatedAt: new Date(),
				...(done ? { lastPracticedAt: new Date() } : {})
			})
			.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, stop.id)))
			.returning({ lastPracticedAt: userStopProgress.lastPracticedAt });

		return {
			from: startedAt,
			to,
			lastPracticedAt: row.lastPracticedAt?.toISOString() ?? null,
			firstMastered
		};
	});
}

/** "Start learning": Unseen becomes Learning. Does nothing for a stop that is already started. */
export async function startStop(userId: string, stopId: number): Promise<void> {
	await db.transaction((tx) => ensureStarted(tx, userId, stopId).then(() => undefined));
}

/** Saves the notes and best tempo for a stop. Saving either counts as starting it. */
export async function saveStopDetails(
	userId: string,
	stopId: number,
	patch: { notes?: string; bestBpm?: number | null }
): Promise<void> {
	await db.transaction(async (tx) => {
		await ensureStarted(tx, userId, stopId);
		await tx
			.update(userStopProgress)
			.set({ ...patch, updatedAt: new Date() })
			.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, stopId)));
	});
}
