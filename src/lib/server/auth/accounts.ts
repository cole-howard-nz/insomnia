import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailTokens, users, type User } from '$lib/server/db/schema';
import { deleteUserFiles } from '$lib/server/data/files';
import { sendEmailChangedNotice, sendResetEmail, sendVerifyEmail } from './email';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './password';
import { invalidateAllUserSessions, invalidateOtherSessions } from './session';
import {
	RESET_TOKEN_LIFETIME_MS,
	VERIFY_TOKEN_LIFETIME_MS,
	generateToken,
	hashToken
} from './tokens';

type TokenKind = 'verify' | 'reset';

function isUniqueViolation(error: unknown): boolean {
	const e = error as { code?: string; cause?: { code?: string } };
	return e?.code === '23505' || e?.cause?.code === '23505';
}

/** Email problems must never break the flow they belong to, and never log content. */
async function bestEffort(send: () => Promise<void>): Promise<void> {
	try {
		await send();
	} catch (error) {
		console.error('email send failed:', error instanceof Error ? error.message : 'unknown');
	}
}

async function issueToken(user: Pick<User, 'id' | 'email'>, kind: TokenKind): Promise<string> {
	const token = generateToken();
	// Only the newest link of each kind works.
	await db
		.delete(emailTokens)
		.where(
			and(eq(emailTokens.userId, user.id), eq(emailTokens.kind, kind), isNull(emailTokens.usedAt))
		);
	await db.insert(emailTokens).values({
		id: hashToken(token),
		userId: user.id,
		kind,
		email: user.email,
		expiresAt: new Date(
			Date.now() + (kind === 'verify' ? VERIFY_TOKEN_LIFETIME_MS : RESET_TOKEN_LIFETIME_MS)
		)
	});
	return token;
}

/**
 * Single use, atomic: the UPDATE only matches an unused, unexpired token, so two
 * concurrent requests cannot both succeed.
 */
async function consumeToken(token: string, kind: TokenKind) {
	const [row] = await db
		.update(emailTokens)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(emailTokens.id, hashToken(token)),
				eq(emailTokens.kind, kind),
				isNull(emailTokens.usedAt),
				gt(emailTokens.expiresAt, new Date())
			)
		)
		.returning();
	return row ?? null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
	const [user] = await db.select().from(users).where(eq(users.email, email));
	return user ?? null;
}

// Sign up

export type SignUpResult = { ok: true; userId: string } | { ok: false; reason: 'email-taken' };

export async function signUp(input: {
	email: string;
	password: string;
	displayName: string;
}): Promise<SignUpResult> {
	const passwordHash = await hashPassword(input.password);
	try {
		const [user] = await db
			.insert(users)
			.values({ email: input.email, passwordHash, displayName: input.displayName })
			.returning();
		await sendVerification(user);
		return { ok: true, userId: user.id };
	} catch (error) {
		if (isUniqueViolation(error)) return { ok: false, reason: 'email-taken' };
		throw error;
	}
}

// Sign in

/** Same cost and same answer whether the email exists or not. */
export async function authenticate(email: string, password: string): Promise<User | null> {
	const user = await findUserByEmail(email);
	if (!user) {
		await verifyAgainstDummy(password);
		return null;
	}
	return (await verifyPassword(user.passwordHash, password)) ? user : null;
}

// Email verification

export async function sendVerification(user: Pick<User, 'id' | 'email' | 'displayName'>) {
	const token = await issueToken(user, 'verify');
	await bestEffort(() => sendVerifyEmail(user.email, user.displayName, token));
}

/** A verify link only counts while the address it was sent to is still the account's. */
export async function verifyEmail(token: string): Promise<boolean> {
	const row = await consumeToken(token, 'verify');
	if (!row) return false;
	const updated = await db
		.update(users)
		.set({ emailVerifiedAt: new Date() })
		.where(and(eq(users.id, row.userId), eq(users.email, row.email)))
		.returning({ id: users.id });
	return updated.length > 0;
}

// Password reset

/** Silent about whether the account exists. Only verified addresses get a link. */
export async function requestPasswordReset(email: string): Promise<void> {
	const user = await findUserByEmail(email);
	if (!user || !user.emailVerifiedAt) return;
	const token = await issueToken(user, 'reset');
	await bestEffort(() => sendResetEmail(user.email, user.displayName, token));
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
	const row = await consumeToken(token, 'reset');
	if (!row) return false;
	const passwordHash = await hashPassword(newPassword);
	await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));
	// Whoever had the old password, or a session, is out.
	await invalidateAllUserSessions(row.userId);
	return true;
}

/** Whether a reset link is still usable, without spending it. */
export async function resetTokenIsLive(token: string): Promise<boolean> {
	const [row] = await db
		.select({ id: emailTokens.id })
		.from(emailTokens)
		.where(
			and(
				eq(emailTokens.id, hashToken(token)),
				eq(emailTokens.kind, 'reset'),
				isNull(emailTokens.usedAt),
				gt(emailTokens.expiresAt, new Date())
			)
		);
	return Boolean(row);
}

// Account management. Every function checks the password itself where it matters.

async function checkPassword(userId: string, password: string): Promise<User | null> {
	const [user] = await db.select().from(users).where(eq(users.id, userId));
	if (!user) return null;
	return (await verifyPassword(user.passwordHash, password)) ? user : null;
}

export async function changeDisplayName(userId: string, displayName: string): Promise<void> {
	await db.update(users).set({ displayName }).where(eq(users.id, userId));
}

export type ChangeEmailResult = { ok: true } | { ok: false; reason: 'password' | 'email-taken' };

export async function changeEmail(
	userId: string,
	newEmail: string,
	password: string
): Promise<ChangeEmailResult> {
	const user = await checkPassword(userId, password);
	if (!user) return { ok: false, reason: 'password' };
	if (user.email === newEmail) return { ok: true };

	try {
		await db
			.update(users)
			.set({ email: newEmail, emailVerifiedAt: null })
			.where(eq(users.id, userId));
	} catch (error) {
		if (isUniqueViolation(error)) return { ok: false, reason: 'email-taken' };
		throw error;
	}

	// The old address is told, in case this was not the owner. Its reset links die too.
	await db.delete(emailTokens).where(eq(emailTokens.userId, userId));
	await bestEffort(() => sendEmailChangedNotice(user.email, user.displayName, newEmail));
	await sendVerification({ id: user.id, email: newEmail, displayName: user.displayName });
	return { ok: true };
}

export async function changePassword(
	userId: string,
	currentPassword: string,
	newPassword: string,
	keepSessionId: string
): Promise<boolean> {
	if (!(await checkPassword(userId, currentPassword))) return false;
	await db
		.update(users)
		.set({ passwordHash: await hashPassword(newPassword) })
		.where(eq(users.id, userId));
	await invalidateOtherSessions(userId, keepSessionId);
	return true;
}

export async function deleteAccount(userId: string, password: string): Promise<boolean> {
	if (!(await checkPassword(userId, password))) return false;
	await deleteUserFiles(userId);
	// Sessions, tokens, settings and every later private table cascade from this row.
	await db.delete(users).where(eq(users.id, userId));
	return true;
}
