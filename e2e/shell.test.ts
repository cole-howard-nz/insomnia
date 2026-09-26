import { expect, test } from '@playwright/test';

test('the map has the tab bar', async ({ page }) => {
	await page.goto('/map');
	await expect(page.getByRole('navigation', { name: 'main' })).toBeVisible();
	await page.getByRole('link', { name: 'practice' }).click();
	await expect(page).toHaveURL(/\/practice$/);
	await expect(page.getByRole('link', { name: 'practice' })).toHaveAttribute(
		'aria-current',
		'page'
	);
});

test('unknown route shows the error page in the app voice', async ({ page }) => {
	await page.goto('/nowhere');
	await expect(page.getByRole('heading', { name: 'nothing here.' })).toBeVisible();
});

test('reduced motion keeps the sky and content readable', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/dev/weather', { waitUntil: 'networkidle' });
	await expect(page.getByRole('heading', { name: 'weather' })).toBeVisible();
	await page.getByRole('button', { name: 'open sheet' }).click();
	await expect(page.getByRole('dialog', { name: 'barre chords' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
});
