import { PASSWORD_MAX, PASSWORD_MIN } from '$lib/auth-constants';
export { PASSWORD_MAX, PASSWORD_MIN };

// Small on purpose: the most reused passwords. Length does the rest.
const COMMON = new Set([
	'password1',
	'password12',
	'password123',
	'passw0rd12',
	'1234567890',
	'12345678910',
	'123456789012',
	'0123456789',
	'qwertyuiop',
	'qwerty12345',
	'qwerty123456',
	'1q2w3e4r5t',
	'1qaz2wsx3edc',
	'iloveyou12',
	'letmein123',
	'welcome123',
	'admin12345',
	'abc1234567',
	'abcdefghij',
	'guitar1234',
	'guitarhero',
	'iloveguitar',
	'insomnia123',
	'football123',
	'baseball123',
	'monkey1234',
	'dragon1234',
	'master1234',
	'superman123',
	'trustno1234',
	'changeme123',
	'password!!',
	'p@ssw0rd123',
	'p@ssword123',
	'aaaaaaaaaa',
	'1111111111',
	'0000000000'
]);

/** Returns a reason the password is unacceptable, or null when it is fine. */
export function passwordProblem(password: string): string | null {
	if (password.length < PASSWORD_MIN) return `at least ${PASSWORD_MIN} characters, please.`;
	if (password.length > PASSWORD_MAX) return `${PASSWORD_MAX} characters at most.`;
	if (COMMON.has(password.toLowerCase())) return 'that one is too common. try another.';
	if (new Set(password).size < 4) return 'too repetitive. mix it up a little.';
	return null;
}
