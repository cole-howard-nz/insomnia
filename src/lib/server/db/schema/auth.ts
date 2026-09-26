import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';

// Accounts. Every private table elsewhere references users.id and cascades on delete.

export const users = pgTable('users', {
	id: uuid().primaryKey().defaultRandom(),
	/** Stored lowercased and trimmed. */
	email: text().notNull().unique(),
	emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
	passwordHash: text('password_hash').notNull(),
	displayName: text('display_name').notNull(),
	/** Set by hand in the database only. There is no UI to grant it. */
	isCurriculumAdmin: boolean('is_curriculum_admin').notNull().default(false),
	onboardingDone: boolean('onboarding_done').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable(
	'sessions',
	{
		/** sha256 of the cookie token. The raw token is never stored. */
		id: text().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		deviceLabel: text('device_label').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

export const emailTokenKind = pgEnum('email_token_kind', ['verify', 'reset']);

export const emailTokens = pgTable(
	'email_tokens',
	{
		/** sha256 of the emailed token. */
		id: text().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		kind: emailTokenKind().notNull(),
		/** The address the token was sent to. A verify token only counts if it still matches. */
		email: text().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		usedAt: timestamp('used_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('email_tokens_user_idx').on(t.userId)]
);

export const userSettings = pgTable('user_settings', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	weeklyTargetDays: integer('weekly_target_days').notNull().default(3),
	reducedEffects: boolean('reduced_effects').notNull().default(false),
	remindersEnabled: boolean('reminders_enabled').notNull().default(false)
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
