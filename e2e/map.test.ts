import { expect, test } from '@playwright/test';

test('the landing page previews the map', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'insomnia' })).toBeVisible();
	await expect(page.getByRole('application', { name: /skill map/ })).toBeVisible();
	await page.getByRole('link', { name: 'open the map' }).click();
	await expect(page).toHaveURL(/\/map$/);
});

test('the map opens zoomed out, tapping a region zooms in, tapping a stop opens it', async ({
	page
}) => {
	await page.goto('/map');
	const regions = page.getByRole('button', { name: /stops. zoom to region/ });
	await expect(regions).toHaveCount(7);

	await page.getByRole('button', { name: /^chords, \d+ stops/ }).click();
	const stop = page.getByRole('link', {
		name: /^barre chords \(f shape\), region chords, level 0 of 4/
	});
	await expect(stop).toBeVisible();
	await expect(regions).toHaveCount(0);

	await stop.click({ force: true });
	await expect(page).toHaveURL(/\/map\/barre-f-shape$/);
	await expect(page.getByRole('dialog', { name: 'barre chords (f shape)' })).toBeVisible();
});

test('dragging pans the map and does not open a stop', async ({ page }) => {
	await page.goto('/map');
	await page.getByRole('button', { name: /^chords, \d+ stops/ }).click();
	const group = page.locator('svg > g').first();
	await expect(group).toHaveAttribute('transform', /scale\(1\.\d+\)|scale\(0\.\d+\)/);
	await page.waitForTimeout(500);
	const before = await group.getAttribute('transform');
	const box = (await page.getByRole('application').boundingBox())!;
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x - 60, y - 40, { steps: 6 });
	await page.mouse.up();
	expect(await group.getAttribute('transform')).not.toBe(before);
	await expect(page).toHaveURL(/\/map$/);
});

test('the zoom buttons and reset work', async ({ page }) => {
	await page.goto('/map');
	const group = page.locator('svg > g').first();
	await page.waitForTimeout(300);
	const fit = await group.getAttribute('transform');
	await page.getByRole('button', { name: 'zoom in', exact: true }).click();
	await page.waitForTimeout(500);
	expect(await group.getAttribute('transform')).not.toBe(fit);
	await page.getByRole('button', { name: 'reset view' }).click();
	await page.waitForTimeout(500);
	expect(await group.getAttribute('transform')).toBe(fit);
});

test('a stop deep link shows the whole detail and links jump between stops', async ({ page }) => {
	await page.goto('/map/barre-f-shape');
	const sheet = page.getByRole('dialog', { name: 'barre chords (f shape)' });
	await expect(sheet).toBeVisible();
	for (const level of ['playable', 'solid', 'mastered']) {
		await expect(sheet.getByRole('heading', { name: level })).toBeVisible();
	}
	await expect(sheet.getByText('60 bpm', { exact: true })).toBeVisible();
	await expect(sheet.getByRole('link', { name: /youtube:/ }).first()).toHaveAttribute(
		'target',
		'_blank'
	);

	await sheet.getByRole('link', { name: 'chord changes' }).first().click();
	await expect(page).toHaveURL(/\/map\/chord-changes$/);
	await expect(page.getByRole('dialog', { name: 'chord changes' })).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(page).toHaveURL(/\/map$/);
});

test('an unknown stop is a 404 in the app voice', async ({ page }) => {
	await page.goto('/map/no-such-stop');
	await expect(page.getByRole('heading', { name: 'nothing here.' })).toBeVisible();
});

test('the list view reaches every stop with keyboard and screen reader labels', async ({
	page
}) => {
	await page.goto('/map?view=list');
	const links = page.getByRole('main').getByRole('link', { name: /level \d of 4$/ });
	await expect(links).toHaveCount(62);
	await expect(links.first()).toHaveAttribute(
		'aria-label',
		/^posture and holding it, region foundations, level 0 of 4$/
	);

	// Every stop opens.
	const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
	expect(new Set(hrefs).size).toBe(62);
	for (const href of hrefs) {
		expect((await page.request.get(href)).status(), href).toBe(200);
	}

	// Filters.
	await page.getByLabel('search', { exact: true }).fill('barre');
	await expect(links).toHaveCount(4);
	await page.getByLabel('search', { exact: true }).fill('');
	await page.getByLabel('region', { exact: true }).selectOption('songs');
	await expect(links).toHaveCount(10);
	await page.getByLabel('state', { exact: true }).selectOption('mastered');
	await expect(page.getByText("nothing here yet. that's okay.")).toBeVisible();

	// Keyboard: focus a stop link and press enter.
	await page.getByLabel('state', { exact: true }).selectOption('all');
	await links.first().focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page).toHaveURL(/\/map\/.+\?view=list$/);
	await page.keyboard.press('Escape');
	await expect(page).toHaveURL(/\/map\?view=list$/);
});
