import { expect, test } from './fixtures';

test('rain sound is off until asked for, then remembered', async ({ page, signedIn }) => {
	void signedIn;
	await page.goto('/me');
	await expect(page.getByText('the rain is off.')).toBeVisible();
	const exported = async () => (await (await page.request.get('/me/export')).json()).settings;
	expect(await exported()).toMatchObject({ rainSound: false });

	await page.getByRole('button', { name: 'turn the rain on' }).click();
	await expect(page.getByText('the rain is on.')).toBeVisible();
	await expect.poll(async () => (await exported()).rainSound).toBe(true);

	// Still on after a reload. It starts on the first tap, because browsers require one.
	await page.reload();
	await expect(page.getByText('the rain is on.')).toBeVisible();

	await page.getByRole('button', { name: 'turn the rain off' }).click();
	await expect(page.getByText('the rain is off.')).toBeVisible();
	await expect.poll(async () => (await exported()).rainSound).toBe(false);
});

test('a long session logs hours, and the milestone comes back once', async ({ page, signedIn }) => {
	void signedIn;
	const log = async (minutes: number) =>
		(
			await page.request.post('/practice/log', { data: { minutes, feel: 'clean', stops: [] } })
		).json();
	expect((await log(300)).milestones).toEqual([]);
	// 300 + 320 = 620 minutes passes ten hours.
	expect((await log(320)).milestones).toEqual([{ kind: 'hours', hours: 10 }]);
	// Already past it, so it does not fire again.
	expect((await log(30)).milestones).toEqual([]);
});

test('the error page speaks in the app voice for the status it got', async ({ page, request }) => {
	await page.goto('/nowhere-at-all');
	await expect(page.getByRole('heading', { name: 'nothing here.' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'back home' })).toBeVisible();
	expect((await request.get('/evidence/not-a-uuid', { maxRedirects: 0 })).status()).toBe(303);
});
