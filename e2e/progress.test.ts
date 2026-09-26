import { createAccount, deleteAccount, expect, signInFast, test } from './fixtures';

test('tick criteria, log a session, and watch the map change', async ({ page, signedIn }) => {
	void signedIn;

	// Ticks are saved in the background, so wait until the server has them.
	const savedCriteria = (n: number) =>
		expect
			.poll(async () => (await (await page.request.get('/me/export')).json()).criteriaDone.length)
			.toBe(n);

	// A new account sees an untouched map and a fresh suggestion.
	await page.goto('/map');
	await expect(page.getByText('what next?')).toBeVisible();
	await expect(page.getByRole('link', { name: /^new/ }).first()).toBeVisible();

	// Open a stop, tick everything for Playable.
	await page.goto('/map/chord-changes');
	const sheet = page.getByRole('dialog', { name: 'chord changes' });
	await expect(sheet.getByText('unseen', { exact: true })).toBeVisible();
	const playable = sheet.locator('.level', {
		has: page.getByRole('heading', { name: 'playable' })
	});
	const boxes = playable.getByRole('checkbox');
	const count = await boxes.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) await boxes.nth(i).check();

	// The level moves at once, and it survives a reload.
	await expect(sheet.getByText('playable', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('playable. it holds when you go slow.')).toBeVisible();
	await savedCriteria(count);
	await page.reload();
	await expect(
		page.getByRole('link', { name: /^chord changes, region chords, level 2 of 4/ })
	).toBeAttached();
	await expect(page.getByRole('dialog').getByRole('checkbox', { checked: true })).toHaveCount(
		count
	);

	// Unticking one drops it back to learning.
	await page.getByRole('dialog').getByRole('checkbox').first().uncheck();
	await expect(page.getByRole('dialog').getByText('learning', { exact: true })).toBeVisible();
	await page.getByRole('dialog').getByRole('checkbox').first().check();

	// Notes save on leaving the field.
	const notes = page.getByRole('textbox', { name: /notes for chord changes/ });
	await notes.fill('ring finger lags');
	await notes.blur();
	await expect
		.poll(async () => (await (await page.request.get('/me/export')).json()).progress[0]?.notes)
		.toBe('ring finger lags');

	// Log a session against it.
	await page.keyboard.press('Escape');
	await page.getByRole('link', { name: 'Practice' }).click();
	await expect(page).toHaveURL(/\/practice$/);
	await page.getByRole('button', { name: 'chord changes' }).click();
	await page.getByRole('button', { name: 'start' }).click();
	await expect(page.getByRole('timer')).toBeVisible();
	await page.getByRole('button', { name: 'finish' }).click();
	await page.getByRole('button', { name: '5 minutes more' }).click();
	await page.getByRole('radio', { name: 'clean' }).check();
	await page.getByPlaceholder('bpm').fill('72');
	await page.getByRole('button', { name: 'save' }).click();

	// It shows in the log, with the weekly summary.
	await expect(page).toHaveURL(/\/log$/);
	await expect(page.getByText('1 of 3 days this week')).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'chord changes' })).toBeVisible();
	await expect(page.getByText('72 bpm')).toBeVisible();

	// Filter by stop.
	await page.getByLabel('filter by stop').selectOption({ label: 'chord changes' });
	await expect(page).toHaveURL(/\/log\?stop=chord-changes$/);
	await expect(page.getByText('72 bpm')).toBeVisible();

	// The map remembers: the stop is Playable, and the notes and tempo are kept.
	await page.goto('/map/chord-changes');
	await expect(page.getByRole('textbox', { name: /notes for chord changes/ })).toHaveValue(
		'ring finger lags'
	);
	await expect(page.getByRole('textbox', { name: /^your best/ })).toHaveValue('72');
});

test('one player never sees another’s progress', async ({ page, browser, signedIn }) => {
	void signedIn;
	await page.goto('/map/chord-changes');
	await page.getByRole('dialog').getByRole('checkbox').first().check();
	await expect
		.poll(async () => (await (await page.request.get('/me/export')).json()).criteriaDone.length)
		.toBe(1);

	const other = await createAccount('other');
	const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
	const page2 = await context.newPage();
	try {
		await signInFast(page2, other);
		await page2.goto('/map/chord-changes');
		await expect(page2.getByRole('dialog').getByRole('checkbox', { checked: true })).toHaveCount(0);
		await expect(page2.getByRole('dialog').getByText('unseen', { exact: true })).toBeVisible();

		const exported = await page2.request.get('/me/export');
		const text = await exported.text();
		expect(text).not.toContain('chord-changes');
	} finally {
		await context.close();
		await deleteAccount(other.email);
	}
});

test('the progress endpoints turn away anyone who is not signed in', async ({ request }) => {
	for (const [url, data] of [
		['/progress/criteria', { criterionId: 1, done: true }],
		['/progress/stop', { slug: 'chord-changes', start: true }],
		['/practice/log', { minutes: 5, feel: 'clean', stops: [] }]
	] as const) {
		const res = await request.post(url, { data, maxRedirects: 0 });
		expect(res.status(), url).toBe(303);
		expect(res.headers().location).toContain('/sign-in');
	}
	expect((await request.get('/log', { maxRedirects: 0 })).status()).toBe(303);
});

test('the endpoints refuse ids that do not exist or are malformed', async ({ page, signedIn }) => {
	void signedIn;
	const post = (url: string, data: unknown) => page.request.post(url, { data });
	expect((await post('/progress/criteria', { criterionId: 999999, done: true })).status()).toBe(
		404
	);
	expect((await post('/progress/criteria', { criterionId: 'x' })).status()).toBe(400);
	expect((await post('/progress/stop', { slug: 'no-such-stop', start: true })).status()).toBe(404);
	expect((await post('/practice/log', { minutes: 0, feel: 'clean', stops: [] })).status()).toBe(
		400
	);
	expect(
		(await post('/practice/log', { minutes: 5, feel: 'clean', stops: [{ slug: 'nope' }] })).status()
	).toBe(404);
});
