import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { getSettings } from './settings';

/**
 * Everything the app holds about one user, as plain JSON. Later phases add their
 * tables (progress, criteria, practice sessions, evidence metadata) as new keys.
 * Never includes the password hash or session and token hashes.
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

	return {
		exportedAt: new Date().toISOString(),
		account: account ?? null,
		settings: await getSettings(userId)
	};
}
