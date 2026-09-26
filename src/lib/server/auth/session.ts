import { and, desc, eq, ne, notInArray } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { deviceLabel } from './device';
import { SESSION_LIFETIME_MS, generateToken, hashToken, isExpired, shouldRenew } from './tokens';

export const SESSION_COOKIE_NAME = 'session';

const MAX_CONCURRENT_SESSIONS = 10;
/** last_seen_at is written at most this often, so reads do not cause a write each. */
const LAST_SEEN_GRANULARITY_MS = 5 * 60 * 1000;

/** What the rest of the app sees. Never carries the password hash. */
export interface SessionUser {
	id: string;
	email: string;
	displayName: string;
	emailVerified: boolean;
	isCurriculumAdmin: boolean;
	onboardingDone: boolean;
}

export interface SessionInfo {
	/** sha256 of the cookie token. Safe to expose, useless as a credential. */
	id: string;
	expiresAt: Date;
}

export type SessionValidationResult =
	| { session: SessionInfo; user: SessionUser; renewed: boolean }
	| { session: null; user: null; renewed: false };

export async function createSession(
	userId: string,
	userAgent: string | null
): Promise<{ token: string; expiresAt: Date }> {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

	await db.insert(sessions).values({
		id: hashToken(token),
		userId,
		deviceLabel: deviceLabel(userAgent),
		expiresAt
	});

	// Cap concurrent sessions, dropping the oldest.
	const keep = await db
		.select({ id: sessions.id })
		.from(sessions)
		.where(eq(sessions.userId, userId))
		.orderBy(desc(sessions.createdAt))
		.limit(MAX_CONCURRENT_SESSIONS);
	await db.delete(sessions).where(
		and(
			eq(sessions.userId, userId),
			notInArray(
				sessions.id,
				keep.map((s) => s.id)
			)
		)
	);

	return { token, expiresAt };
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = hashToken(token);
	const [row] = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (!row) return { session: null, user: null, renewed: false };

	if (isExpired(row.session.expiresAt)) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return { session: null, user: null, renewed: false };
	}

	let expiresAt = row.session.expiresAt;
	const renewed = shouldRenew(expiresAt);
	if (renewed) expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);

	if (renewed || Date.now() - row.session.lastSeenAt.getTime() > LAST_SEEN_GRANULARITY_MS) {
		await db
			.update(sessions)
			.set({ lastSeenAt: new Date(), expiresAt })
			.where(eq(sessions.id, sessionId));
	}

	return {
		session: { id: sessionId, expiresAt },
		user: {
			id: row.user.id,
			email: row.user.email,
			displayName: row.user.displayName,
			emailVerified: row.user.emailVerifiedAt !== null,
			isCurriculumAdmin: row.user.isCurriculumAdmin,
			onboardingDone: row.user.onboardingDone
		},
		renewed
	};
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Signs out every device except the one making the request. */
export async function invalidateOtherSessions(
	userId: string,
	keepSessionId: string
): Promise<void> {
	await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId)));
}

export interface SessionListItem {
	id: string;
	deviceLabel: string;
	createdAt: Date;
	lastSeenAt: Date;
	current: boolean;
}

export async function listSessions(
	userId: string,
	currentSessionId: string
): Promise<SessionListItem[]> {
	const rows = await db
		.select()
		.from(sessions)
		.where(eq(sessions.userId, userId))
		.orderBy(desc(sessions.lastSeenAt));
	return rows
		.filter((row) => !isExpired(row.expiresAt))
		.map((row) => ({
			id: row.id,
			deviceLabel: row.deviceLabel,
			createdAt: row.createdAt,
			lastSeenAt: row.lastSeenAt,
			current: row.id === currentSessionId
		}));
}

const cookieBase = () => ({
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
	path: '/'
});

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set(SESSION_COOKIE_NAME, token, { ...cookieBase(), expires: expiresAt });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set(SESSION_COOKIE_NAME, '', { ...cookieBase(), maxAge: 0 });
}

/** Creates a session and sets the cookie in one step. */
export async function startSession(event: RequestEvent, userId: string): Promise<void> {
	const { token, expiresAt } = await createSession(userId, event.request.headers.get('user-agent'));
	setSessionTokenCookie(event, token, expiresAt);
}

export function clientIp(event: RequestEvent): string | null {
	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}
