// Runs against the real database (DATABASE_URL from .env.local, seeded) and skips without one.
// Every user it makes is deleted at the end, which also proves the cascade.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

try {
	process.loadEnvFile('.env.local');
} catch {
	// no local env file, rely on the real environment
}

const hasDb = Boolean(process.env.DATABASE_URL);
const run = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe.skipIf(!hasDb)('progress data layer', () => {
	let data: typeof import('./index');
	let db: typeof import('../db').db;
	let schema: typeof import('../db/schema');
	let orm: typeof import('drizzle-orm');
	let curriculum: import('$lib/curriculum/model').CurriculumData;
	const created: string[] = [];

	async function makeUser(name: string) {
		const [row] = await db
			.insert(schema.users)
			.values({ email: `${name}-${run}@example.test`, passwordHash: 'x', displayName: name })
			.returning({ id: schema.users.id });
		created.push(row.id);
		return row.id;
	}

	beforeAll(async () => {
		data = await import('./index');
		db = (await import('../db')).db;
		schema = await import('../db/schema');
		orm = await import('drizzle-orm');
		curriculum = await (await import('../curriculum')).loadCurriculum();
	});

	afterAll(async () => {
		if (!db) return;
		for (const id of created) await db.delete(schema.users).where(orm.eq(schema.users.id, id));
	});

	const stopOf = (slug: string) => curriculum.stops.find((s) => s.slug === slug)!;

	it('starts with nothing: no row means Unseen', async () => {
		const id = await makeUser('empty');
		expect(await data.getProgress(id)).toEqual({ stops: [], criteriaDone: [] });
	});

	it('levels up as criteria are ticked and down as they are unticked', async () => {
		const id = await makeUser('ticker');
		const stop = stopOf('barre-f-shape');
		const level2 = stop.criteria.filter((c) => c.level === 2);

		for (const [i, c] of level2.entries()) {
			const change = await data.setCriterion(id, stop, c.id, true);
			expect(change.to).toBe(i === level2.length - 1 ? 2 : 1);
		}
		let progress = await data.getProgress(id);
		expect(progress.stops[0].level).toBe(2);
		expect(progress.stops[0].lastPracticedAt).not.toBeNull();
		expect(progress.criteriaDone.sort()).toEqual(level2.map((c) => c.id).sort());

		const down = await data.setCriterion(id, stop, level2[0].id, false);
		expect(down.to).toBe(1);
		progress = await data.getProgress(id);
		expect(progress.stops[0].level).toBe(1);

		// Ticking the same box twice changes nothing.
		await data.setCriterion(id, stop, level2[0].id, true);
		await data.setCriterion(id, stop, level2[0].id, true);
		expect((await data.getProgress(id)).criteriaDone).toHaveLength(level2.length);
	});

	it('records every level change, and only the first Mastered is a first', async () => {
		const id = await makeUser('mastery');
		const first = stopOf('barre-f-shape');
		const second = stopOf('chord-changes');

		const tickAll = async (stop: typeof first) => {
			let last;
			for (const c of stop.criteria) last = await data.setCriterion(id, stop, c.id, true);
			return last!;
		};
		const a = await tickAll(first);
		expect(a.to).toBe(4);
		expect(a.firstMastered).toBe(true);
		const b = await tickAll(second);
		expect(b.to).toBe(4);
		expect(b.firstMastered).toBe(false);

		const events = await db
			.select()
			.from(schema.levelEvents)
			.where(orm.eq(schema.levelEvents.userId, id));
		const forFirst = events
			.filter((e) => e.stopId === first.id)
			.map((e) => [e.fromLevel, e.toLevel])
			.sort();
		expect(forFirst).toEqual([
			[0, 1],
			[1, 2],
			[2, 3],
			[3, 4]
		]);
	});

	it('logs a session, counts it as practice, and keeps the best tempo', async () => {
		const id = await makeUser('player');
		const stop = stopOf('chord-changes');

		await data.logSession(id, {
			practicedOn: '2026-03-02',
			minutes: 20,
			feel: 'clean',
			note: 'felt ok',
			stops: [{ stopId: stop.id, bpm: 80 }]
		});
		await data.logSession(id, {
			practicedOn: '2026-03-03',
			minutes: 10,
			feel: 'sloppy',
			note: '',
			stops: [{ stopId: stop.id, bpm: 70 }]
		});

		const [row] = (await data.getProgress(id)).stops;
		expect(row.level).toBe(1);
		expect(row.bestBpm).toBe(80);
		expect(row.lastPracticedAt).not.toBeNull();

		const sessions = await data.listSessions(id, { limit: 10 });
		expect(sessions.map((s) => s.practicedOn)).toEqual(['2026-03-03', '2026-03-02']);
		expect(sessions[1].stops).toEqual([{ stopId: stop.id, bpm: 80 }]);

		const other = stopOf('barre-f-shape');
		expect(await data.listSessions(id, { stopId: other.id, limit: 10 })).toEqual([]);
		expect(await data.listSessions(id, { stopId: stop.id, limit: 10 })).toHaveLength(2);

		const days = await data.listSessionDays(id, '2026-03-03');
		expect(days).toEqual([{ practicedOn: '2026-03-03', minutes: 10 }]);
	});

	it('saves notes and a best tempo, and starts the stop', async () => {
		const id = await makeUser('notes');
		const stop = stopOf('chord-changes');
		await data.saveStopDetails(id, stop.id, { notes: 'watch the ring finger', bestBpm: 90 });
		const [row] = (await data.getProgress(id)).stops;
		expect(row).toMatchObject({ level: 1, notes: 'watch the ring finger', bestBpm: 90 });
	});

	it('keeps one user out of another one’s progress, sessions, events and export', async () => {
		const a = await makeUser('ann');
		const b = await makeUser('ben');
		const stop = stopOf('barre-f-shape');

		for (const c of stop.criteria) await data.setCriterion(a, stop, c.id, true);
		await data.saveStopDetails(a, stop.id, { notes: 'ann private note', bestBpm: 100 });
		await data.logSession(a, {
			practicedOn: '2026-03-02',
			minutes: 30,
			feel: 'breakthrough',
			note: 'ann private session',
			stops: [{ stopId: stop.id, bpm: 100 }]
		});

		// Ben sees nothing of Ann's.
		expect(await data.getProgress(b)).toEqual({ stops: [], criteriaDone: [] });
		expect(await data.listSessions(b, { limit: 50 })).toEqual([]);
		expect(await data.listSessions(b, { stopId: stop.id, limit: 50 })).toEqual([]);
		expect(await data.listSessionDays(b, '2000-01-01')).toEqual([]);
		const bExport = JSON.stringify(await data.exportUserData(b));
		expect(bExport).not.toContain('ann private');
		expect(bExport).not.toContain('barre-f-shape');

		// Ann's own export has all of it.
		const aExport = await data.exportUserData(a);
		expect(aExport.progress.map((p) => p.stop)).toEqual(['barre-f-shape']);
		expect(aExport.criteriaDone).toHaveLength(stop.criteria.length);
		expect(aExport.practiceSessions[0]).toMatchObject({ minutes: 30, note: 'ann private session' });
		expect(aExport.levelEvents.at(-1)).toMatchObject({ stop: 'barre-f-shape', toLevel: 4 });

		// Ben ticking and un-ticking the same criteria leaves Ann's alone.
		const first = stop.criteria[0];
		await data.setCriterion(b, stop, first.id, true);
		await data.setCriterion(b, stop, first.id, false);
		const after = await data.getProgress(a);
		expect(after.stops[0].level).toBe(4);
		expect(after.criteriaDone).toHaveLength(stop.criteria.length);
		expect((await data.getProgress(b)).criteriaDone).toEqual([]);
	});

	it('removes every row when the account is deleted', async () => {
		const id = await makeUser('gone');
		const stop = stopOf('chord-changes');
		await data.setCriterion(id, stop, stop.criteria[0].id, true);
		await data.logSession(id, {
			practicedOn: '2026-03-02',
			minutes: 5,
			feel: 'clean',
			note: '',
			stops: [{ stopId: stop.id, bpm: null }]
		});
		await db.delete(schema.users).where(orm.eq(schema.users.id, id));
		created.splice(created.indexOf(id), 1);

		for (const table of [
			schema.userStopProgress,
			schema.userCriteriaDone,
			schema.practiceSessions,
			schema.practiceSessionStops,
			schema.levelEvents
		]) {
			const rows = await db.select().from(table).where(orm.eq(table.userId, id));
			expect(rows).toEqual([]);
		}
	});
});
