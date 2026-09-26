import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { userSettings } from '$lib/server/db/schema';

// The pattern for every private table: `userId` is the required first argument and
// every query is scoped by it. Route handlers call these, never the table directly.

export interface Settings {
	weeklyTargetDays: number;
	reducedEffects: boolean;
	remindersEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	weeklyTargetDays: 3,
	reducedEffects: false,
	remindersEnabled: false
};

/** Rows are created lazily, so a user with no row gets the defaults. */
export async function getSettings(userId: string): Promise<Settings> {
	const [row] = await db
		.select({
			weeklyTargetDays: userSettings.weeklyTargetDays,
			reducedEffects: userSettings.reducedEffects,
			remindersEnabled: userSettings.remindersEnabled
		})
		.from(userSettings)
		.where(eq(userSettings.userId, userId));
	return row ?? DEFAULT_SETTINGS;
}

export async function updateSettings(userId: string, patch: Partial<Settings>): Promise<Settings> {
	await db
		.insert(userSettings)
		.values({ ...DEFAULT_SETTINGS, ...patch, userId })
		.onConflictDoUpdate({ target: userSettings.userId, set: patch });
	return getSettings(userId);
}
