import { createAccount, deleteAccount, expect, signInFast, test } from './fixtures';

// The smallest thing the upload check accepts as webm: the EBML signature and padding.
const webm = (size = 64) => {
	const bytes = Buffer.alloc(size);
	Buffer.from([0x1a, 0x45, 0xdf, 0xa3]).copy(bytes);
	return bytes;
};

const upload = (
	request: import('@playwright/test').APIRequestContext,
	fields: Record<string, string | { name: string; mimeType: string; buffer: Buffer }>
) => request.post('/evidence', { multipart: fields });

test('recordings are private, checked, limited and deletable', async ({ page, browser }) => {
	const owner = await createAccount('owner', { verified: true });
	const stranger = await createAccount('stranger', { verified: true });
	const unverified = await createAccount('unverified');
	try {
		await signInFast(page, owner);
		const clip = { name: 'clip.webm', mimeType: 'audio/webm', buffer: webm() };

		// Upload one, and it is listed with its stop.
		const ok = await upload(page.request, {
			slug: 'chord-changes',
			note: 'day one',
			seconds: '12',
			file: clip
		});
		expect(ok.status()).toBe(200);
		const { item } = await ok.json();
		expect(item).toMatchObject({ kind: 'audio', note: 'day one', mime: 'audio/webm', levelAt: 0 });
		expect(JSON.stringify(item)).not.toMatch(/storage|key/i);

		// The owner can stream it back, with Range.
		const file = await page.request.get(`/evidence/${item.id}`);
		expect(file.status()).toBe(200);
		expect(file.headers()['content-type']).toBe('audio/webm');
		expect(file.headers()['cache-control']).toContain('no-store');
		expect(file.headers()['x-content-type-options']).toBe('nosniff');
		const ranged = await page.request.get(`/evidence/${item.id}`, {
			headers: { range: 'bytes=0-9' }
		});
		expect(ranged.status()).toBe(206);
		expect((await ranged.body()).length).toBe(10);

		// Someone else gets a plain 404 for the file, the delete, and the list, never the bytes.
		const other = await (await browser.newContext()).newPage();
		await signInFast(other, stranger);
		expect((await other.request.get(`/evidence/${item.id}`)).status()).toBe(404);
		expect((await other.request.delete(`/evidence/${item.id}`)).status()).toBe(404);
		const theirs = await (await other.request.get('/evidence?stop=chord-changes')).json();
		expect(theirs.items).toEqual([]);
		// Still there after the stranger's attempts.
		expect((await page.request.get(`/evidence/${item.id}`)).status()).toBe(200);

		// A signed-out request is sent to sign in.
		const anon = await (await browser.newContext()).newPage();
		const denied = await anon.request.get(`/evidence/${item.id}`);
		expect(denied.url()).toContain('/sign-in');

		// Refusals: not a recording, a disguised file, too long, too big, unknown stop.
		const html = Buffer.from('<script>alert(1)</script>');
		const refused = async (fields: Parameters<typeof upload>[1]) =>
			(await upload(page.request, { slug: 'chord-changes', ...fields })).status();
		expect(await refused({ file: { name: 'a.html', mimeType: 'text/html', buffer: html } })).toBe(
			415
		);
		expect(await refused({ file: { name: 'a.webm', mimeType: 'audio/webm', buffer: html } })).toBe(
			415
		);
		expect(await refused({ seconds: '121', file: clip })).toBe(400);
		expect(
			await refused({
				file: { name: 'big.webm', mimeType: 'audio/webm', buffer: webm(4 * 1024 * 1024 + 1) }
			})
		).toBe(413);
		expect((await upload(page.request, { slug: 'no-such-stop', file: clip })).status()).toBe(404);

		// Recordings need a verified email. Notes do not.
		const quiet = await (await browser.newContext()).newPage();
		await signInFast(quiet, unverified);
		expect((await upload(quiet.request, { slug: 'chord-changes', file: clip })).status()).toBe(403);
		expect(
			(await upload(quiet.request, { slug: 'chord-changes', note: 'still counts' })).status()
		).toBe(200);

		// The zip export carries the recording, the json lists it.
		const exported = await (await page.request.get('/me/export')).json();
		expect(exported.evidence).toHaveLength(1);
		expect(exported.evidence[0]).toMatchObject({ stop: 'chord-changes', kind: 'audio' });
		const zip = await page.request.get('/me/export/zip');
		expect(zip.headers()['content-type']).toBe('application/zip');
		expect((await zip.body()).includes(Buffer.from('insomnia-export.json'))).toBe(true);
		expect((await zip.body()).includes(Buffer.from('.webm'))).toBe(true);

		// Delete it, and it is gone.
		expect((await page.request.delete(`/evidence/${item.id}`)).status()).toBe(204);
		expect((await page.request.get(`/evidence/${item.id}`)).status()).toBe(404);
	} finally {
		await deleteAccount(owner.email);
		await deleteAccount(stranger.email);
		await deleteAccount(unverified.email);
	}
});

test('attach a note and a picked recording on a stop, then see them on the timeline', async ({
	page
}) => {
	const account = await createAccount('proof', { verified: true });
	try {
		await signInFast(page, account);
		await page.goto('/map/chord-changes');
		const sheet = page.getByRole('dialog', { name: 'chord changes' });
		await expect(
			sheet
				.getByText('nothing here yet. that’s okay.')
				.or(sheet.getByText("nothing here yet. that's okay."))
		).toBeVisible();

		await sheet.getByRole('button', { name: 'write a note' }).click();
		await sheet.getByLabel('a note for this moment').fill('buzzing on the third string');
		await sheet.getByRole('button', { name: 'save note' }).click();
		await expect(sheet.getByText('buzzing on the third string')).toBeVisible();

		await sheet.locator('input[type="file"]').setInputFiles({
			name: 'take.webm',
			mimeType: 'audio/webm',
			buffer: webm(2048)
		});
		await sheet.getByLabel('caption').fill('slow and clean');
		await sheet.getByRole('button', { name: 'keep it' }).click();
		await expect(sheet.getByText('slow and clean')).toBeVisible();
		await expect(sheet.locator('.timeline audio')).toHaveCount(1);

		// Delete asks first.
		await sheet.getByRole('button', { name: /^delete this audio/ }).click();
		await expect(sheet.getByText('delete this for good?')).toBeVisible();
		await sheet.getByRole('button', { name: 'delete', exact: true }).click();
		await expect(sheet.locator('.timeline audio')).toHaveCount(0);
	} finally {
		await deleteAccount(account.email);
	}
});
