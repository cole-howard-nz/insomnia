import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { createAccount, deleteAccount, expect, plantSession, test } from './fixtures';

// Automated checks catch roughly a third of accessibility problems: labels, roles, contrast
// of text over solid backgrounds, landmarks. Keyboard order and screen reader wording are
// checked by hand and by the specs below. The sky is a canvas, so its contrast is covered by
// src/lib/contrast.ts against the brightest cloud frame instead.
async function scan(page: Page, what: string) {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	const summary = results.violations.map(
		(v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`
	);
	expect(summary, `${what} has accessibility violations`).toEqual([]);
}

test('public pages have no detectable accessibility violations', async ({ page }) => {
	for (const path of ['/', '/sign-in', '/sign-up', '/reset', '/privacy', '/terms']) {
		await page.goto(path);
		await scan(page, path);
	}
});

test('the signed-in app has no detectable accessibility violations', async ({ page }) => {
	const account = await createAccount('a11y', { verified: true });
	try {
		await plantSession(page, account);
		for (const path of [
			'/map',
			'/map?view=list',
			'/map/chord-changes',
			'/practice',
			'/log',
			'/me'
		]) {
			await page.goto(path);
			await expect(page.getByRole('navigation', { name: 'main' })).toBeVisible();
			await scan(page, path);
		}
	} finally {
		await deleteAccount(account.email);
	}
});

test('onboarding has no detectable accessibility violations on any step', async ({ page }) => {
	const account = await createAccount('a11yw', { onboarded: false });
	try {
		await plantSession(page, account);
		await page.goto('/welcome');
		for (let step = 0; step < 3; step++) {
			await scan(page, `welcome step ${step + 1}`);
			await page.getByRole('button', { name: 'next', exact: true }).click();
		}
		await scan(page, 'welcome confirmation');
	} finally {
		await deleteAccount(account.email);
	}
});

test('the whole app can be used from the keyboard', async ({ page }) => {
	const account = await createAccount('keys', { verified: true });
	try {
		await plantSession(page, account);
		await page.goto('/map?view=list');

		// The first tab stop is something real, and focus is always visible on a control.
		await page.keyboard.press('Tab');
		const focused = page.locator(':focus');
		await expect(focused).toBeVisible();

		// A stop opens from the list with the keyboard, and Escape closes the sheet.
		await page
			.getByRole('link', { name: /^chord changes/ })
			.first()
			.focus();
		await page.keyboard.press('Enter');
		const sheet = page.getByRole('dialog', { name: 'chord changes' });
		await expect(sheet).toBeVisible();
		// Focus is inside the sheet, not left behind the backdrop.
		await expect(sheet.locator(':focus')).toHaveCount(1);
		// A criterion ticks with the space bar.
		const box = sheet.getByRole('checkbox').first();
		await box.focus();
		await page.keyboard.press('Space');
		await expect(box).toBeChecked();
		await page.keyboard.press('Escape');
		await expect(sheet).toBeHidden();
	} finally {
		await deleteAccount(account.email);
	}
});

test('the map announces each stop with its level and region', async ({ page }) => {
	const account = await createAccount('sr', { verified: true });
	try {
		await plantSession(page, account);
		await page.goto('/map');
		const link = page.getByRole('link', {
			name: 'posture and holding it, region foundations, level 0 of 4'
		});
		await expect(link).toBeAttached();
		await expect(page.getByRole('application', { name: /skill map/ })).toBeVisible();
	} finally {
		await deleteAccount(account.email);
	}
});
