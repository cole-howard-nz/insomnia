import { createAccount, deleteAccount, expect, plantSession, test } from './fixtures';

test('a new user can onboard, level a stop, log practice and attach a note with no dead ends', async ({
	page
}) => {
	const account = await createAccount('journey', { onboarded: false });
	try {
		await plantSession(page, account);
		await page.goto('/map');

		// Onboarding: answer one question, skip the rest, take the suggestions.
		await expect(page).toHaveURL(/\/welcome$/);
		// Buttons only work once the page has hydrated, so wait for the quiet.
		await page.waitForLoadState('networkidle');
		await page.getByRole('radio', { name: /never touched one/ }).check();
		await page.getByRole('button', { name: 'next', exact: true }).click();
		await page.getByRole('button', { name: 'skip this one' }).click();
		await page.getByRole('button', { name: 'skip this one' }).click();
		await page.getByRole('button', { name: 'start with these' }).click();
		await expect(page).toHaveURL(/\/map$/);

		// The map is not empty: there are Learning stops and a next step.
		await expect(page.getByText('what next?')).toBeVisible();
		await expect(
			page.getByRole('link', { name: /^posture and holding it, region foundations, level 1 of 4/ })
		).toBeAttached();

		// Level a stop up by ticking its Playable criteria.
		await page.goto('/map/posture-and-hold', { waitUntil: 'networkidle' });
		const sheet = page.getByRole('dialog', { name: 'posture and holding it' });
		const playable = sheet.locator('.level', {
			has: page.getByRole('heading', { name: 'playable' })
		});
		const boxes = playable.getByRole('checkbox');
		for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check();
		await expect(sheet.getByText('playable', { exact: true }).first()).toBeVisible();
		// The prompt to keep proof appears right when they level up.
		await expect(sheet.getByText('you just moved up. record how it sounds now?')).toBeVisible();

		// An unverified account is told why recordings are off, and can still leave a note.
		await expect(sheet.getByText(/recordings need a verified email/)).toBeVisible();
		await expect(sheet.getByRole('button', { name: 'record audio' })).toBeDisabled();
		await sheet.getByRole('button', { name: 'write a note' }).click();
		await sheet.getByLabel('a note for this moment').fill('finally sits right');
		await sheet.getByRole('button', { name: 'save note' }).click();
		await expect(sheet.getByText('finally sits right')).toBeVisible();
		// The timeline holds both level changes (started, then playable) and the note.
		await expect(sheet.locator('.timeline li')).toHaveCount(3);

		// Log practice, and it shows in the log.
		await page.goto('/practice');
		await page.getByRole('button', { name: 'posture and holding it' }).click();
		await page.getByRole('button', { name: 'start' }).click();
		await expect(page.getByRole('timer')).toBeVisible();
		await page.getByRole('button', { name: 'finish' }).click();
		await page.getByRole('button', { name: '5 minutes more' }).click();
		await page.getByRole('radio', { name: 'clean' }).check();
		await page.getByRole('button', { name: 'save' }).click();
		await expect(page).toHaveURL(/\/log$/);
		await expect(page.getByText('clean').first()).toBeVisible();
	} finally {
		await deleteAccount(account.email);
	}
});
