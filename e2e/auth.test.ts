import { createAccount, deleteAccount, expect, signIn, test } from './fixtures';

test('signing up lands on onboarding, and me shows the account', async ({ page }) => {
	const email = `signup-${Date.now().toString(36)}@example.test`;
	try {
		await page.goto('/sign-up');
		await page.getByLabel('what should we call you').fill('night owl');
		await page.getByLabel('email').fill(email);
		await page.getByLabel('password', { exact: true }).fill('rain on the window');
		await page.getByRole('button', { name: 'make an account' }).click();
		await expect(page).toHaveURL(/\/welcome$/);
		await page.getByRole('button', { name: 'skip it all, just show me the map' }).click();
		await expect(page).toHaveURL(/\/map$/);

		await page.getByRole('link', { name: 'me', exact: true }).click();
		await expect(page.getByText(email)).toBeVisible();
		await expect(page.getByText('not verified')).toBeVisible();
	} finally {
		await deleteAccount(email);
	}
});

test('sign-up validates inline and keeps what you typed', async ({ page }) => {
	await page.goto('/sign-up');
	await page.getByLabel('what should we call you').fill('night owl');
	await page.getByLabel('email').fill('not-an-email');
	await page.getByLabel('password', { exact: true }).fill('short');
	await page.getByRole('button', { name: 'make an account' }).click();
	await expect(page.getByText("that doesn't look like an email.")).toBeVisible();
	await expect(page.getByText('at least 10 characters, please.')).toBeVisible();
	await expect(page.getByLabel('what should we call you')).toHaveValue('night owl');
});

test('the app needs a session and remembers where you were going', async ({ page, account }) => {
	await page.goto('/map/barre-f-shape');
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fmap%2Fbarre-f-shape$/);
	await page.getByLabel('email').fill(account.email);
	await page.getByLabel('password', { exact: true }).fill(account.password);
	await page.getByRole('button', { name: 'sign in' }).click();
	await expect(page).toHaveURL(/\/map\/barre-f-shape$/);
});

test('a bad password and an unknown email get the same answer', async ({ page, account }) => {
	const answer = 'email or password incorrect.';

	await page.goto('/sign-in');
	await page.getByLabel('email').fill(account.email);
	await page.getByLabel('password', { exact: true }).fill('the wrong one entirely');
	await page.getByRole('button', { name: 'sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText(answer);

	await page.getByLabel('email').fill('nobody-here@example.test');
	await page.getByLabel('password', { exact: true }).fill('the wrong one entirely');
	await page.getByRole('button', { name: 'sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText(answer);
});

test('the session cookie is httpOnly, lax, and lasts about 30 days', async ({ page, signedIn }) => {
	void signedIn;
	const cookie = (await page.context().cookies()).find((c) => c.name === 'session');
	expect(cookie).toBeDefined();
	expect(cookie!.httpOnly).toBe(true);
	expect(cookie!.sameSite).toBe('Lax');
	// `secure` is on outside dev, checked against the deployed preview.
	const days = (cookie!.expires - Date.now() / 1000) / 86400;
	expect(days).toBeGreaterThan(29);
	expect(days).toBeLessThan(31);
});

test('sign out ends the session', async ({ page, signedIn }) => {
	void signedIn;
	await page.goto('/me');
	await page.getByRole('button', { name: 'sign out', exact: true }).click();
	await expect(page).toHaveURL(/\/sign-in$/);
	await page.goto('/me');
	await expect(page).toHaveURL(/\/sign-in\?next=%2Fme$/);
});

test('sign out everywhere ends the other device too', async ({ page, browser, account }) => {
	await signIn(page, account);
	const other = await browser.newContext();
	const otherPage = await other.newPage();
	await signIn(otherPage, account);

	await page.goto('/me');
	await expect(page.getByText('this device')).toBeVisible();
	await page.getByRole('button', { name: 'sign out everywhere' }).click();
	await expect(page).toHaveURL(/\/sign-in$/);

	await otherPage.goto('/me');
	await expect(otherPage).toHaveURL(/\/sign-in/);
	await other.close();
});

test('password reset says the same thing for any email', async ({ page }) => {
	await page.goto('/reset');
	await page.getByLabel('email').fill('nobody-here@example.test');
	await page.getByRole('button', { name: 'send the link' }).click();
	await expect(page.getByRole('status')).toContainText('if that email has an account');
});

test('a dead reset link says so', async ({ page }) => {
	await page.goto('/reset/notarealtoken');
	await expect(page.getByText('that link is used up or expired.')).toBeVisible();
});

test('deleting the account needs the password and ends everything', async ({ page, account }) => {
	await signIn(page, account);
	await page.goto('/me');
	// The click can land before the page hydrates, so retry until the form opens.
	await expect(async () => {
		await page.getByRole('button', { name: 'delete my account' }).click();
		await expect(page.getByLabel('password, to be sure')).toBeVisible({ timeout: 1000 });
	}).toPass();

	await page.getByLabel('password, to be sure').fill('the wrong one entirely');
	await page.getByRole('button', { name: 'delete it all' }).click();
	await expect(page.getByText('that password is wrong.')).toBeVisible();

	await page.getByLabel('password, to be sure').fill(account.password);
	await page.getByRole('button', { name: 'delete it all' }).click();
	await expect(page).toHaveURL(/\/\?deleted=1$/);

	await page.goto('/sign-in');
	await page.getByLabel('email').fill(account.email);
	await page.getByLabel('password', { exact: true }).fill(account.password);
	await page.getByRole('button', { name: 'sign in' }).click();
	await expect(page.getByRole('alert')).toHaveText('email or password incorrect.');
});

test('one user cannot see another: export and pages are per session', async ({
	page,
	browser,
	account
}) => {
	const other = await createAccount('other');
	const otherContext = await browser.newContext();
	const otherPage = await otherContext.newPage();
	try {
		await signIn(page, account);
		await signIn(otherPage, other);

		const mine = await page.request.get('/me/export');
		const theirs = await otherPage.request.get('/me/export');
		expect(mine.headers()['content-disposition']).toContain('attachment');
		const mineText = await mine.text();
		const theirText = await theirs.text();
		expect(mineText).toContain(account.email);
		expect(mineText).not.toContain(other.email);
		expect(theirText).toContain(other.email);
		expect(theirText).not.toContain(account.email);
		expect(mineText + theirText).not.toMatch(/password_?hash|argon2/i);

		await otherPage.goto('/me');
		await expect(otherPage.getByText(other.email)).toBeVisible();
		await expect(otherPage.getByText(account.email)).toHaveCount(0);
	} finally {
		await otherContext.close();
		await deleteAccount(other.email);
	}
});

test('signed-out requests cannot read the export', async ({ request }) => {
	const response = await request.get('/me/export');
	expect(response.url()).toContain('/sign-in?next=%2Fme%2Fexport');
	expect(await response.text()).not.toContain('exportedAt');
});

test('the admin area is a plain 404 for everyone but the curriculum admin', async ({
	page,
	signedIn
}) => {
	void signedIn;
	const response = await page.goto('/admin');
	expect(response?.status()).toBe(404);
});
