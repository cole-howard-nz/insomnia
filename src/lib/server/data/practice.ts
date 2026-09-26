import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { practiceSessionStops, practiceSessions, userStopProgress } from '$lib/server/db/schema';
import type { Feel, PracticeSession } from '$lib/progress/model';
import { ensureStarted } from './progress';

export interface NewSession {
	practicedOn: string;
	minutes: number;
	feel: Feel;
	note: string;
	/** Stop ids come from the curriculum, checked by the route. */
	stops: { stopId: number; bpm: number | null }[];
}

/** Saves a session and counts it as practice on every stop in it. Also returns the total logged minutes. */
export async function logSession(
	userId: string,
	session: NewSession
): Promise<{ id: string; totalMinutes: number }> {
	return db.transaction(async (tx) => {
		const [row] = await tx
			.insert(practiceSessions)
			.values({
				userId,
				practicedOn: session.practicedOn,
				minutes: session.minutes,
				feel: session.feel,
				note: session.note
			})
			.returning({ id: practiceSessions.id });

		if (session.stops.length > 0) {
			await tx
				.insert(practiceSessionStops)
				.values(session.stops.map((s) => ({ sessionId: row.id, userId, ...s })));
		}

		const now = new Date();
		for (const { stopId, bpm } of session.stops) {
			await ensureStarted(tx, userId, stopId);
			await tx
				.update(userStopProgress)
				.set({
					lastPracticedAt: now,
					updatedAt: now,
					...(bpm === null
						? {}
						: { bestBpm: sql`greatest(coalesce(${userStopProgress.bestBpm}, 0), ${bpm})` })
				})
				.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, stopId)));
		}
		const [total] = await tx
			.select({ minutes: sql<number>`coalesce(sum(${practiceSessions.minutes}), 0)::int` })
			.from(practiceSessions)
			.where(eq(practiceSessions.userId, userId));
		return { id: row.id, totalMinutes: total.minutes };
	});
}

/** Newest first. `stopId` narrows to sessions that included that stop. */
export async function listSessions(
	userId: string,
	opts: { stopId?: number; limit: number }
): Promise<PracticeSession[]> {
	const rows = await db
		.select()
		.from(practiceSessions)
		.where(
			and(
				eq(practiceSessions.userId, userId),
				opts.stopId === undefined
					? undefined
					: inArray(
							practiceSessions.id,
							db
								.select({ id: practiceSessionStops.sessionId })
								.from(practiceSessionStops)
								.where(
									and(
										eq(practiceSessionStops.userId, userId),
										eq(practiceSessionStops.stopId, opts.stopId)
									)
								)
						)
			)
		)
		.orderBy(desc(practiceSessions.practicedOn), desc(practiceSessions.createdAt))
		.limit(opts.limit);
	if (rows.length === 0) return [];

	const stopRows = await db
		.select()
		.from(practiceSessionStops)
		.where(
			and(
				eq(practiceSessionStops.userId, userId),
				inArray(
					practiceSessionStops.sessionId,
					rows.map((r) => r.id)
				)
			)
		);

	return rows.map((r) => ({
		id: r.id,
		practicedOn: r.practicedOn,
		createdAt: r.createdAt.toISOString(),
		minutes: r.minutes,
		feel: r.feel,
		note: r.note,
		stops: stopRows
			.filter((s) => s.sessionId === r.id)
			.map((s) => ({ stopId: s.stopId, bpm: s.bpm }))
	}));
}

/** Date and minutes of every session since a date, for streaks and weekly totals. */
export async function listSessionDays(userId: string, sinceDate: string) {
	return db
		.select({ practicedOn: practiceSessions.practicedOn, minutes: practiceSessions.minutes })
		.from(practiceSessions)
		.where(and(eq(practiceSessions.userId, userId), gte(practiceSessions.practicedOn, sinceDate)));
}
