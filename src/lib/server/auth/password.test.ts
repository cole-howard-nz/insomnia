import { describe, expect, it } from 'vitest';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './password';
import { passwordProblem } from './password-policy';
import { signUpSchema } from './validation';

describe('password hashing', () => {
	it('hashes with argon2id and verifies', async () => {
		const hash = await hashPassword('a long enough phrase');
		expect(hash.startsWith('$argon2id$')).toBe(true);
		expect(await verifyPassword(hash, 'a long enough phrase')).toBe(true);
		expect(await verifyPassword(hash, 'a long enough phrasf')).toBe(false);
	});

	it('salts, so equal passwords hash differently', async () => {
		expect(await hashPassword('same same same')).not.toBe(await hashPassword('same same same'));
	});

	it('the dummy verification runs without throwing', async () => {
		await expect(verifyAgainstDummy('anything')).resolves.toBeUndefined();
	});
});

describe('password policy', () => {
	it('rejects short, common and repetitive passwords', () => {
		expect(passwordProblem('short')).toMatch(/at least 10/);
		expect(passwordProblem('Password123')).toMatch(/common/);
		expect(passwordProblem('abababababab')).toMatch(/repetitive/);
	});

	it('accepts a plain passphrase', () => {
		expect(passwordProblem('rain on the window')).toBeNull();
	});
});

describe('sign-up validation', () => {
	it('normalises the email and trims the name', () => {
		const parsed = signUpSchema.parse({
			email: '  Cole@Example.COM ',
			password: 'rain on the window',
			displayName: '  cole '
		});
		expect(parsed.email).toBe('cole@example.com');
		expect(parsed.displayName).toBe('cole');
	});

	it('reports an error per field', () => {
		const result = signUpSchema.safeParse({ email: 'nope', password: 'x', displayName: '' });
		expect(result.success).toBe(false);
		expect(result.error?.issues.map((i) => i.path[0])).toEqual(
			expect.arrayContaining(['email', 'password', 'displayName'])
		);
	});
});
