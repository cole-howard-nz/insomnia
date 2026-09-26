import { createHash, randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { Pool } from '@neondatabase/serverless';
import { test as base, expect, type Page } from '@playwright/test';

try {
	process.loadEnvFile('.env.local');
} catch {
	// no local env file, rely on the real environment
}

export const PASSWORD = 'rain on the window';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let counter = 0;

export interface Account {
	email: string;
	name: string;
	password: string;
}

/** Inserts a user directly, so specs do not spend the sign-up rate limit. */
export async function createAccount(label = 'e2e'): Promise<Account> {
	const account = {
		email: `${label}-${run}-${counter++}@example.test`,
		name: `${label} tester`,
		password: PASSWORD
	};
	await pool.query('insert into users (email, password_hash, display_name) values ($1, $2, $3)', [
		account.email,
		await hash(account.password),
		account.name
	]);
	return account;
}

export async function deleteAccount(email: string) {
	await pool.query('delete from users where email = $1', [email]);
}

export async function signIn(page: Page, account: Account) {
	await page.goto('/sign-in');
	await page.getByLabel('email').fill(account.email);
	await page.getByLabel('password', { exact: true }).fill(account.password);
	await page.getByRole('button', { name: 'sign in' }).click();
	await expect(page).toHaveURL(/\/map$/);
}

/**
 * Signs in by planting a session, so specs that are not about signing in do not spend the
 * sign-in rate limit (20 a minute per IP). The sign-in form has its own specs.
 */
export async function signInFast(page: Page, account: Account) {
	const token = randomBytes(20).toString('hex');
	await pool.query(
		`insert into sessions (id, user_id, device_label, expires_at)
		 select $1, id, 'e2e', now() + interval '1 day' from users where email = $2`,
		[createHash('sha256').update(token).digest('hex'), account.email]
	);
	await page
		.context()
		.addCookies([{ name: 'session', value: token, url: 'http://localhost:4173' }]);
	await page.goto('/map');
	await expect(page).toHaveURL(/\/map$/);
}

export const test = base.extend<{ account: Account; signedIn: Account }>({
	// eslint-disable-next-line no-empty-pattern
	account: async ({}, use) => {
		const account = await createAccount();
		await use(account);
		await deleteAccount(account.email);
	},
	signedIn: async ({ page, account }, use) => {
		await signInFast(page, account);
		await use(account);
	}
});

export { expect };
