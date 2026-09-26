// Runs against the real database (DATABASE_URL from .env.local) and skips without one.
// Every user it makes is deleted at the end.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const sent = vi.hoisted(() => ({ verify: [] as string[], reset: [] as string[], notices: 0 }));

vi.mock('./email', () => ({
	sendVerifyEmail: async (_to: string, _name: string, token: string) =>
		void sent.verify.push(token),
	sendResetEmail: async (_to: string, _name: string, token: string) => void sent.reset.push(token),
	sendEmailChangedNotice: async () => void sent.notices++
}));

try {
	process.loadEnvFile('.env.local');
} catch {
	// no local env file, rely on the real environment
}

const hasDb = Boolean(process.env.DATABASE_URL);
const run = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const emailOf = (name: string) => `${name}-${run}@example.test`;
const PASSWORD = 'rain on the window';

describe.skipIf(!hasDb)('account lifecycle', () => {
	let accounts: typeof import('./accounts');
	let session: typeof import('./session');
	let data: typeof import('../data');
	let limits: typeof import('../rate-limit');
	let db: typeof import('../db').db;
	let schema: typeof import('../db/schema');
	let orm: typeof import('drizzle-orm');
	const created: string[] = [];

	beforeAll(async () => {
		accounts = await import('./accounts');
		session = await import('./session');
		data = await import('../data');
		limits = await import('../rate-limit');
		db = (await import('../db')).db;
		schema = await import('../db/schema');
		orm = await import('drizzle-orm');
	});

	afterAll(async () => {
		if (!db) return;
		for (const id of created) {
			await db.delete(schema.users).where(orm.eq(schema.users.id, id));
		}
	});

	async function makeUser(name: string) {
		const result = await accounts.signUp({
			email: emailOf(name),
			password: PASSWORD,
			displayName: name
		});
		if (!result.ok) throw new Error('sign up failed');
		created.push(result.userId);
		return result.userId;
	}

	it('signs up, hides the password, and sends a verification link', async () => {
		const before = sent.verify.length;
		const id = await makeUser('ann');
		expect(sent.verify.length).toBe(before + 1);

		const user = await accounts.findUserByEmail(emailOf('ann'));
		expect(user?.id).toBe(id);
		expect(user?.passwordHash).not.toContain(PASSWORD);
		expect(user?.emailVerifiedAt).toBeNull();
		expect(user?.isCurriculumAdmin).toBe(false);
	});

	it('refuses a second account on the same email', async () => {
		const again = await accounts.signUp({
			email: emailOf('ann'),
			password: PASSWORD,
			displayName: 'ann two'
		});
		expect(again).toEqual({ ok: false, reason: 'email-taken' });
	});

	it('verifies once, and the link is single use', async () => {
		const token = sent.verify.at(-1)!;
		expect(await accounts.verifyEmail(token)).toBe(true);
		expect((await accounts.findUserByEmail(emailOf('ann')))?.emailVerifiedAt).not.toBeNull();
		expect(await accounts.verifyEmail(token)).toBe(false);
		expect(await accounts.verifyEmail('not-a-token')).toBe(false);
	});

	it('signs in with the right password only, and unknown emails look the same', async () => {
		expect((await accounts.authenticate(emailOf('ann'), PASSWORD))?.displayName).toBe('ann');
		expect(await accounts.authenticate(emailOf('ann'), 'wrong password!')).toBeNull();
		expect(await accounts.authenticate(emailOf('nobody'), PASSWORD)).toBeNull();
	});

	it('stores only a hash of the session token and honours expiry and revocation', async () => {
		const user = (await accounts.findUserByEmail(emailOf('ann')))!;
		const { token } = await session.createSession(user.id, 'Mozilla/5.0 Chrome/120 Windows');

		const [row] = await db
			.select()
			.from(schema.sessions)
			.where(orm.eq(schema.sessions.userId, user.id));
		expect(row.id).not.toBe(token);
		expect(row.deviceLabel).toBe('chrome on windows');

		const ok = await session.validateSessionToken(token);
		expect(ok.user?.email).toBe(emailOf('ann'));
		expect(ok.user).not.toHaveProperty('passwordHash');

		await db
			.update(schema.sessions)
			.set({ expiresAt: new Date(Date.now() - 1000) })
			.where(orm.eq(schema.sessions.id, row.id));
		expect((await session.validateSessionToken(token)).user).toBeNull();

		const second = await session.createSession(user.id, null);
		const live = await session.validateSessionToken(second.token);
		await session.invalidateSession(live.session!.id);
		expect((await session.validateSessionToken(second.token)).user).toBeNull();
	});

	it('renews a session once it is past half its life', async () => {
		const user = (await accounts.findUserByEmail(emailOf('ann')))!;
		const { token } = await session.createSession(user.id, null);
		const id = (await session.validateSessionToken(token)).session!.id;
		const soon = new Date(Date.now() + 5 * 24 * 3600 * 1000);
		await db.update(schema.sessions).set({ expiresAt: soon }).where(orm.eq(schema.sessions.id, id));

		const renewed = await session.validateSessionToken(token);
		expect(renewed.renewed).toBe(true);
		expect(renewed.session!.expiresAt.getTime()).toBeGreaterThan(
			soon.getTime() + 20 * 24 * 3600 * 1000
		);
	});

	it('resets a password by link, once, and signs everyone out', async () => {
		const user = (await accounts.findUserByEmail(emailOf('ann')))!;
		const { token: cookie } = await session.createSession(user.id, null);

		await accounts.requestPasswordReset(emailOf('ann'));
		const token = sent.reset.at(-1)!;
		expect(await accounts.resetTokenIsLive(token)).toBe(true);

		expect(await accounts.resetPassword(token, 'a brand new passphrase')).toBe(true);
		expect(await accounts.resetPassword(token, 'another new passphrase')).toBe(false);
		expect(await accounts.resetTokenIsLive(token)).toBe(false);

		expect((await session.validateSessionToken(cookie)).user).toBeNull();
		expect(await accounts.authenticate(emailOf('ann'), PASSWORD)).toBeNull();
		expect(await accounts.authenticate(emailOf('ann'), 'a brand new passphrase')).not.toBeNull();
	});

	it('sends reset links only to verified addresses, and says nothing either way', async () => {
		await makeUser('unverified');
		const before = sent.reset.length;
		await accounts.requestPasswordReset(emailOf('unverified'));
		await accounts.requestPasswordReset(emailOf('ghost'));
		expect(sent.reset.length).toBe(before);
	});

	it('changes email with the password, unverifies it, and tells the old address', async () => {
		const id = await makeUser('eve');
		const notices = sent.notices;
		expect(await accounts.changeEmail(id, emailOf('eve2'), 'wrong password!')).toEqual({
			ok: false,
			reason: 'password'
		});
		expect(await accounts.changeEmail(id, emailOf('ann'), PASSWORD)).toEqual({
			ok: false,
			reason: 'email-taken'
		});
		expect(await accounts.changeEmail(id, emailOf('eve2'), PASSWORD)).toEqual({ ok: true });
		expect(sent.notices).toBe(notices + 1);

		const user = (await accounts.findUserByEmail(emailOf('eve2')))!;
		expect(user.emailVerifiedAt).toBeNull();
		expect(await accounts.findUserByEmail(emailOf('eve'))).toBeNull();
	});

	it('a verify link for an old address cannot verify the new one', async () => {
		const id = await makeUser('mia');
		const oldLink = sent.verify.at(-1)!;
		await accounts.changeEmail(id, emailOf('mia2'), PASSWORD);
		expect(await accounts.verifyEmail(oldLink)).toBe(false);
		expect((await accounts.findUserByEmail(emailOf('mia2')))?.emailVerifiedAt).toBeNull();
	});

	it('changes the password only with the current one, keeping this session', async () => {
		const id = await makeUser('pat');
		const here = await session.createSession(id, null);
		const there = await session.createSession(id, null);
		const hereId = (await session.validateSessionToken(here.token)).session!.id;

		expect(await accounts.changePassword(id, 'wrong password!', 'a new passphrase!', hereId)).toBe(
			false
		);
		expect(await accounts.changePassword(id, PASSWORD, 'a new passphrase!', hereId)).toBe(true);

		expect((await session.validateSessionToken(here.token)).user).not.toBeNull();
		expect((await session.validateSessionToken(there.token)).user).toBeNull();
	});

	it('deletes an account, and everything hanging off it, only with the password', async () => {
		const id = await makeUser('gone');
		const { token } = await session.createSession(id, null);
		await data.updateSettings(id, { weeklyTargetDays: 5 });

		expect(await accounts.deleteAccount(id, 'wrong password!')).toBe(false);
		expect(await accounts.findUserByEmail(emailOf('gone'))).not.toBeNull();

		expect(await accounts.deleteAccount(id, PASSWORD)).toBe(true);
		expect(await accounts.findUserByEmail(emailOf('gone'))).toBeNull();
		expect((await session.validateSessionToken(token)).user).toBeNull();
		for (const table of [schema.sessions, schema.emailTokens, schema.userSettings]) {
			const rows = await db.select().from(table).where(orm.eq(table.userId, id));
			expect(rows).toHaveLength(0);
		}
	});

	it('rate limits sign-in per account', async () => {
		const email = emailOf('limited');
		const results = [];
		for (let i = 0; i < 7; i++) {
			results.push(await limits.checkSignInRateLimit('203.0.113.9', email));
		}
		expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
		expect(results[5].allowed).toBe(false);
		if (!results[5].allowed) expect(results[5].retryAfterSeconds).toBeGreaterThan(0);
	});

	// The isolation test. Two users, and nothing of A's is reachable through B.
	describe('isolation between users', () => {
		let a: string;
		let b: string;

		beforeAll(async () => {
			a = await makeUser('iso-a');
			b = await makeUser('iso-b');
			await data.updateSettings(a, {
				weeklyTargetDays: 6,
				reducedEffects: true,
				remindersEnabled: true
			});
		});

		it('B reads their own settings, never those of A', async () => {
			expect(await data.getSettings(b)).toEqual(data.DEFAULT_SETTINGS);
			expect((await data.getSettings(a)).weeklyTargetDays).toBe(6);
		});

		it('writes by B do not touch the rows of A', async () => {
			await data.updateSettings(b, { weeklyTargetDays: 1 });
			expect(await data.getSettings(a)).toEqual({
				weeklyTargetDays: 6,
				reducedEffects: true,
				remindersEnabled: true,
				rainSound: false
			});
			expect((await data.getSettings(b)).weeklyTargetDays).toBe(1);
		});

		it('the export of B holds only B', async () => {
			const out = await data.exportUserData(b);
			expect(out.account?.id).toBe(b);
			expect(JSON.stringify(out)).not.toContain(emailOf('iso-a'));
			expect(JSON.stringify(out)).not.toContain('passwordHash');
		});

		it('the session list and revocations of B never reach the sessions of A', async () => {
			const sa = await session.createSession(a, null);
			const sb = await session.createSession(b, null);
			const sbId = (await session.validateSessionToken(sb.token)).session!.id;

			const listed = await session.listSessions(b, sbId);
			const aRows = await db
				.select()
				.from(schema.sessions)
				.where(orm.eq(schema.sessions.userId, a));
			const aIds = new Set(aRows.map((r) => r.id));
			expect(listed.length).toBeGreaterThan(0);
			expect(listed.every((s) => !aIds.has(s.id))).toBe(true);

			await session.invalidateOtherSessions(b, sbId);
			await session.invalidateAllUserSessions(b);
			expect((await session.validateSessionToken(sa.token)).user?.id).toBe(a);
		});

		it('B acting on the account of A is impossible, and B actions leave A alone', async () => {
			expect(await accounts.changePassword(b, PASSWORD + 'x', 'some other phrase', 'none')).toBe(
				false
			);
			expect(await accounts.deleteAccount(b, 'wrong password!')).toBe(false);
			expect(await accounts.changeEmail(b, emailOf('iso-a'), PASSWORD)).toEqual({
				ok: false,
				reason: 'email-taken'
			});
			expect((await accounts.findUserByEmail(emailOf('iso-a')))?.id).toBe(a);
			expect(await accounts.authenticate(emailOf('iso-a'), PASSWORD)).not.toBeNull();
		});

		it('deleting B leaves the data of A intact', async () => {
			expect(await accounts.deleteAccount(b, PASSWORD)).toBe(true);
			expect((await data.getSettings(a)).weeklyTargetDays).toBe(6);
			expect((await accounts.findUserByEmail(emailOf('iso-a')))?.id).toBe(a);
		});
	});
});
