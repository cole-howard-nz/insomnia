// Runs against the real database (DATABASE_URL from .env.local, seeded) and skips without one.
// Files go to the local storage driver. Every user it makes is deleted at the end.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

try {
	process.loadEnvFile('.env.local');
} catch {
	// no local env file, rely on the real environment
}

const hasDb = Boolean(process.env.DATABASE_URL);
const run = `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe.skipIf(!hasDb)('evidence data layer', () => {
	let data: typeof import('./index');
	let db: typeof import('../db').db;
	let schema: typeof import('../db/schema');
	let orm: typeof import('drizzle-orm');
	let storage: typeof import('../storage');
	let stopId: number;
	let otherStopId: number;
	const created: string[] = [];

	async function makeUser(name: string) {
		const [row] = await db
			.insert(schema.users)
			.values({ email: `${name}-${run}@example.test`, passwordHash: 'x', displayName: name })
			.returning({ id: schema.users.id });
		created.push(row.id);
		return row.id;
	}

	/** Stores a small file the way the upload endpoint does, then records it. */
	async function attach(userId: string, bytes = 100, limit?: number) {
		const key = `${userId}/${crypto.randomUUID()}`;
		await storage.getStorage().put(key, new Uint8Array(bytes).fill(7), 'audio/webm');
		const added = await data.addEvidence(
			userId,
			{
				stopId,
				kind: 'audio',
				note: 'day 1',
				file: { storageKey: key, mime: 'audio/webm', bytes, durationSeconds: 30 }
			},
			limit
		);
		return { key, added };
	}

	beforeAll(async () => {
		data = await import('./index');
		db = (await import('../db')).db;
		schema = await import('../db/schema');
		orm = await import('drizzle-orm');
		storage = await import('../storage');
		const rows = await db.select({ id: schema.stops.id }).from(schema.stops).limit(2);
		[stopId, otherStopId] = rows.map((r) => r.id);
	});

	afterAll(async () => {
		if (!db) return;
		for (const id of created) {
			await data.deleteUserFiles(id);
			await db.delete(schema.users).where(orm.eq(schema.users.id, id));
		}
	});

	it('records the level the stop was at, and lists oldest first', async () => {
		const id = await makeUser('timeline');
		const first = await data.addEvidence(id, { stopId, kind: 'note', note: 'shaky' });
		expect(first.ok && first.item.levelAt).toBe(0);
		await data.startStop(id, stopId);
		const second = await data.addEvidence(id, { stopId, kind: 'note', note: 'better' });
		expect(second.ok && second.item.levelAt).toBe(1);

		const list = await data.listEvidence(id, stopId);
		expect(list.map((e) => e.note)).toEqual(['shaky', 'better']);
		expect(await data.listEvidence(id, otherStopId)).toEqual([]);
		expect((await data.listStopLevelEvents(id, stopId)).map((e) => e.toLevel)).toEqual([1]);
	});

	it('never lets one user read, list, delete or export another one’s evidence', async () => {
		const alice = await makeUser('alice');
		const bob = await makeUser('bob');
		const { key, added } = await attach(alice);
		expect(added.ok).toBe(true);
		const evidenceId = added.ok ? added.item.id : '';

		expect(await data.getEvidenceFile(bob, evidenceId)).toBeNull();
		expect(await data.listEvidence(bob, stopId)).toEqual([]);
		expect(await data.evidenceUsage(bob)).toBe(0);
		expect(await data.deleteEvidence(bob, evidenceId)).toBe(false);
		expect((await data.exportUserData(bob)).evidence).toEqual([]);
		// Bob's failed delete left it alone.
		expect(await data.getEvidenceFile(alice, evidenceId)).toMatchObject({ storageKey: key });

		const exported = await data.exportUserData(alice);
		expect(exported.evidence).toHaveLength(1);
		expect(JSON.stringify(exported)).not.toContain(key);
	});

	it('refuses an upload that would pass the limit, and counts exactly at it', async () => {
		const id = await makeUser('quota');
		expect((await attach(id, 60, 100)).added.ok).toBe(true);
		const over = await attach(id, 41, 100);
		expect(over.added).toEqual({ ok: false, reason: 'quota' });
		expect((await attach(id, 40, 100)).added.ok).toBe(true);
		expect(await data.evidenceUsage(id)).toBe(100);
		// Deleting frees the room again.
		const [row] = await data.listEvidence(id, stopId);
		await data.deleteEvidence(id, row.id);
		expect((await attach(id, 60, 100)).added.ok).toBe(true);
	});

	it('cannot be pushed over the limit by uploads landing at once', async () => {
		const id = await makeUser('race');
		const results = await Promise.all([1, 2, 3, 4, 5].map(() => attach(id, 40, 100)));
		expect(results.filter((r) => r.added.ok)).toHaveLength(2);
		expect(await data.evidenceUsage(id)).toBe(80);
	});

	it('deletes the file with the row, and every file with the account', async () => {
		const id = await makeUser('leaver');
		const one = await attach(id);
		const two = await attach(id);
		const local = (key: string) => path.resolve('.data', 'evidence', key);
		expect(existsSync(local(one.key))).toBe(true);

		const oneId = one.added.ok ? one.added.item.id : '';
		await data.deleteEvidence(id, oneId);
		expect(existsSync(local(one.key))).toBe(false);
		expect(existsSync(local(two.key))).toBe(true);

		await data.deleteUserFiles(id);
		expect(existsSync(local(two.key))).toBe(false);
		await db.delete(schema.users).where(orm.eq(schema.users.id, id));
		const left = await db.select().from(schema.evidence).where(orm.eq(schema.evidence.userId, id));
		expect(left).toEqual([]);
	});

	it('account deletion removes the recordings too, but only after the password checks out', async () => {
		const accounts = await import('../auth/accounts');
		const password = 'rain on the window';
		const signedUp = await accounts.signUp({
			email: `gone-${run}@example.test`,
			password,
			displayName: 'gone'
		});
		if (!signedUp.ok) throw new Error('sign up failed');
		created.push(signedUp.userId);
		const { key } = await attach(signedUp.userId);
		const local = path.resolve('.data', 'evidence', key);

		// A wrong password deletes nothing, files included.
		expect(await accounts.deleteAccount(signedUp.userId, 'not the password!')).toBe(false);
		expect(existsSync(local)).toBe(true);

		expect(await accounts.deleteAccount(signedUp.userId, password)).toBe(true);
		expect(existsSync(local)).toBe(false);
		const left = await db
			.select()
			.from(schema.evidence)
			.where(orm.eq(schema.evidence.userId, signedUp.userId));
		expect(left).toEqual([]);
	});
});
