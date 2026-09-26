import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { evidence, levelEvents, userStopProgress } from '$lib/server/db/schema';
import { MAX_USER_BYTES, type EvidenceKind } from '$lib/evidence/config';
import { getStorage } from '$lib/server/storage';

// Evidence rows. Every function takes `userId` first and scopes by it. The file behind a
// row is fetched by its id and the owner, so an id from a URL never reaches the storage
// layer without an ownership check. Storage keys are never sent to the client.

export interface EvidenceItem {
	id: string;
	stopId: number;
	kind: EvidenceKind;
	levelAt: number;
	note: string;
	mime: string | null;
	bytes: number;
	durationSeconds: number | null;
	createdAt: string;
}

export interface LevelEventItem {
	fromLevel: number;
	toLevel: number;
	createdAt: string;
}

const columns = {
	id: evidence.id,
	stopId: evidence.stopId,
	kind: evidence.kind,
	levelAt: evidence.levelAt,
	note: evidence.note,
	mime: evidence.mime,
	bytes: evidence.bytes,
	durationSeconds: evidence.durationSeconds,
	createdAt: evidence.createdAt
};

const toItem = (row: {
	id: string;
	stopId: number;
	kind: EvidenceKind;
	levelAt: number;
	note: string;
	mime: string | null;
	bytes: number;
	durationSeconds: number | null;
	createdAt: Date;
}): EvidenceItem => ({ ...row, createdAt: row.createdAt.toISOString() });

export async function evidenceUsage(userId: string): Promise<number> {
	const [row] = await db
		.select({ bytes: sql<number>`coalesce(sum(${evidence.bytes}), 0)::bigint` })
		.from(evidence)
		.where(eq(evidence.userId, userId));
	return Number(row?.bytes ?? 0);
}

/** Evidence for one stop, oldest first, which is the order the timeline reads in. */
export async function listEvidence(userId: string, stopId: number): Promise<EvidenceItem[]> {
	const rows = await db
		.select(columns)
		.from(evidence)
		.where(and(eq(evidence.userId, userId), eq(evidence.stopId, stopId)))
		.orderBy(asc(evidence.createdAt));
	return rows.map(toItem);
}

export async function listStopLevelEvents(
	userId: string,
	stopId: number
): Promise<LevelEventItem[]> {
	const rows = await db
		.select({
			fromLevel: levelEvents.fromLevel,
			toLevel: levelEvents.toLevel,
			createdAt: levelEvents.createdAt
		})
		.from(levelEvents)
		.where(and(eq(levelEvents.userId, userId), eq(levelEvents.stopId, stopId)))
		.orderBy(asc(levelEvents.createdAt));
	return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export interface NewEvidence {
	stopId: number;
	kind: EvidenceKind;
	note: string;
	/** Present for audio and video. The bytes are already in storage under `storageKey`. */
	file?: { storageKey: string; mime: string; bytes: number; durationSeconds: number | null };
}

/**
 * Records evidence, refusing when it would take the user over their storage limit. The
 * check and the insert share one transaction behind a per-user lock, so two uploads at
 * once cannot both slip under the limit. The caller removes the stored file on a refusal.
 */
export async function addEvidence(
	userId: string,
	input: NewEvidence,
	limit = MAX_USER_BYTES
): Promise<{ ok: true; item: EvidenceItem } | { ok: false; reason: 'quota' }> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
		const [used] = await tx
			.select({ bytes: sql<number>`coalesce(sum(${evidence.bytes}), 0)::bigint` })
			.from(evidence)
			.where(eq(evidence.userId, userId));
		const bytes = input.file?.bytes ?? 0;
		if (Number(used?.bytes ?? 0) + bytes > limit)
			return { ok: false as const, reason: 'quota' as const };

		const [progress] = await tx
			.select({ level: userStopProgress.level })
			.from(userStopProgress)
			.where(and(eq(userStopProgress.userId, userId), eq(userStopProgress.stopId, input.stopId)));

		const [row] = await tx
			.insert(evidence)
			.values({
				userId,
				stopId: input.stopId,
				kind: input.kind,
				levelAt: progress?.level ?? 0,
				note: input.note,
				storageKey: input.file?.storageKey ?? null,
				mime: input.file?.mime ?? null,
				bytes,
				durationSeconds: input.file?.durationSeconds ?? null
			})
			.returning(columns);
		return { ok: true as const, item: toItem(row) };
	});
}

/** The file behind one piece of evidence, only if it belongs to `userId`. */
export async function getEvidenceFile(userId: string, id: string) {
	const [row] = await db
		.select({ storageKey: evidence.storageKey, mime: evidence.mime, bytes: evidence.bytes })
		.from(evidence)
		.where(and(eq(evidence.id, id), eq(evidence.userId, userId)));
	if (!row?.storageKey || !row.mime) return null;
	return { storageKey: row.storageKey, mime: row.mime, bytes: row.bytes };
}

/** Deletes the row and then its file. Returns false when it is not this user's. */
export async function deleteEvidence(userId: string, id: string): Promise<boolean> {
	const [row] = await db
		.delete(evidence)
		.where(and(eq(evidence.id, id), eq(evidence.userId, userId)))
		.returning({ storageKey: evidence.storageKey });
	if (!row) return false;
	if (row.storageKey) await getStorage().delete([row.storageKey]);
	return true;
}

/** Every stored file key a user owns, newest first. For export and account deletion. */
export async function listEvidenceKeys(userId: string) {
	return db
		.select({
			id: evidence.id,
			stopId: evidence.stopId,
			storageKey: evidence.storageKey,
			mime: evidence.mime,
			kind: evidence.kind,
			note: evidence.note,
			levelAt: evidence.levelAt,
			durationSeconds: evidence.durationSeconds,
			createdAt: evidence.createdAt
		})
		.from(evidence)
		.where(eq(evidence.userId, userId))
		.orderBy(desc(evidence.createdAt));
}
