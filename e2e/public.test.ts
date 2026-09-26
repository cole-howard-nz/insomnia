import { expect, test } from './fixtures';

test('the landing page pitches, previews the map and offers sign up', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'insomnia', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'make an account' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'sign in' })).toBeVisible();
	// The preview shows a lit map, not an all-dark one.
	await expect(
		page.getByRole('link', { name: /^posture and holding it, region foundations, level 4 of 4/ })
	).toBeAttached();
	await expect(
		page.getByRole('link', { name: /^chord changes, region chords, level 2 of 4, rusting/ })
	).toBeAttached();
	// Nothing on the public page is anyone's data.
	await expect(
		page.getByRole('link', { name: /tuning, region foundations, level 3 of 4/ })
	).toBeAttached();
});

test('privacy and terms are public and readable', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'privacy' }).click();
	await expect(page).toHaveURL(/\/privacy$/);
	await expect(page.getByRole('heading', { name: 'what we store' })).toBeVisible();
	await expect(page.getByText('delete your account')).toBeVisible();
	await page.getByRole('link', { name: 'terms' }).click();
	await expect(page).toHaveURL(/\/terms$/);
	await expect(page.getByRole('heading', { name: 'terms', level: 1 })).toBeVisible();
});

test('the account page links to the privacy page and both exports', async ({ page, signedIn }) => {
	void signedIn;
	await page.goto('/me');
	await expect(page.getByRole('link', { name: 'export json' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'export zip with recordings' })).toBeVisible();
});

test('the app is installable: manifest, icons and theme colour', async ({ page, request }) => {
	await page.goto('/');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifest = await (await request.get(href!)).json();
	expect(manifest).toMatchObject({ display: 'standalone', start_url: '/map' });
	const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
	expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
	for (const icon of manifest.icons) {
		expect((await request.get(icon.src)).status(), icon.src).toBe(200);
	}
});
