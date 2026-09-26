import { createAccount, deleteAccount, expect, plantSession, test } from './fixtures';

/** A signed-in account that has not been through onboarding yet. */
async function fresh(page: import('@playwright/test').Page) {
	const account = await createAccount('fresh', { onboarded: false });
	await plantSession(page, account);
	await page.goto('/map');
	await expect(page).toHaveURL(/\/welcome$/);
	return account;
}

test('a new account is sent to onboarding from anywhere in the app', async ({ page }) => {
	const account = await fresh(page);
	try {
		for (const path of ['/map', '/practice', '/log', '/me', '/map/chord-changes']) {
			await page.goto(path);
			await expect(page).toHaveURL(/\/welcome$/);
		}
		// No tab bar to wander off with.
		await expect(page.getByRole('navigation', { name: 'main' })).toHaveCount(0);
	} finally {
		await deleteAccount(account.email);
	}
});

test('three questions, a confirmation, and a map that is never empty', async ({ page }) => {
	const account = await fresh(page);
	try {
		await page.getByRole('radio', { name: /know some chords/ }).check();
		await page.getByRole('button', { name: 'next', exact: true }).click();
		await page.getByRole('checkbox', { name: 'leads and solos' }).check();
		await page.getByRole('button', { name: 'next', exact: true }).click();
		await page.getByRole('radio', { name: '5' }).check();
		await page.getByRole('button', { name: 'next', exact: true }).click();

		// The confirmation lists what it would set, and Playable is only for what they said they can do.
		await expect(page.getByRole('heading', { name: /where we.d start you/ })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: /posture and holding it/ })).toBeChecked();
		await expect(page.getByRole('checkbox', { name: /pentatonic box 1/ })).toBeChecked();
		// One they disagree with.
		await page.getByRole('checkbox', { name: /^tuning/ }).uncheck();
		await page.getByRole('button', { name: 'start with these' }).click();
		await expect(page).toHaveURL(/\/map$/);

		const exported = await (await page.request.get('/me/export')).json();
		const bySlug = Object.fromEntries(
			exported.progress.map((p: { stop: string; level: number }) => [p.stop, p.level])
		);
		expect(bySlug['posture-and-hold']).toBe(2);
		expect(bySlug['open-chords-em-am']).toBe(1);
		expect(bySlug['pentatonic-box-1']).toBe(1);
		expect(bySlug['tuning']).toBeUndefined();
		// Nothing above Playable, whatever the answers.
		expect(Math.max(...Object.values<number>(bySlug))).toBeLessThanOrEqual(2);
		expect(exported.settings).toMatchObject({ weeklyTargetDays: 5 });
		expect(exported.account.onboardingDone).toBe(true);

		// The map shows it, and the way back to onboarding is closed.
		await expect(
			page.getByRole('link', { name: /^posture and holding it, region foundations, level 2 of 4/ })
		).toBeAttached();
		await page.goto('/welcome');
		await expect(page).toHaveURL(/\/map$/);
	} finally {
		await deleteAccount(account.email);
	}
});

test('skipping everything still starts them on a few Learning stops', async ({ page }) => {
	const account = await fresh(page);
	try {
		await page.getByRole('button', { name: 'skip it all, just show me the map' }).click();
		await expect(page).toHaveURL(/\/map$/);
		const exported = await (await page.request.get('/me/export')).json();
		expect(exported.progress.length).toBeGreaterThanOrEqual(3);
		expect(exported.progress.every((p: { level: number }) => p.level === 1)).toBe(true);
	} finally {
		await deleteAccount(account.email);
	}
});

test('the onboarding endpoint cannot be talked into Mastered or another stop', async ({ page }) => {
	const account = await fresh(page);
	try {
		const send = (seeds: unknown[]) =>
			page.request.post('/welcome?/finish', {
				headers: { origin: 'http://localhost:4173' },
				form: {
					payload: JSON.stringify({ experience: 'new', chasing: '', weeklyTargetDays: 3, seeds })
				}
			});
		// Level 4 is refused outright and nothing is saved. (Actions answer 200 with a typed body.)
		const bad = await send([{ slug: 'chord-changes', level: 4 }]);
		expect(await bad.json()).toMatchObject({ type: 'failure', status: 400 });
		await page.goto('/welcome');
		await expect(page).toHaveURL(/\/welcome$/);
		// Unknown slugs are dropped, the good one stays.
		const good = await send([
			{ slug: 'no-such-stop', level: 1 },
			{ slug: 'tuning', level: 1 }
		]);
		expect(await good.json()).toMatchObject({ type: 'redirect', location: '/map' });
		const exported = await (await page.request.get('/me/export')).json();
		expect(exported.progress.map((p: { stop: string }) => p.stop)).toEqual(['tuning']);
	} finally {
		await deleteAccount(account.email);
	}
});
