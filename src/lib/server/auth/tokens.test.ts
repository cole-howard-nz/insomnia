import { describe, expect, it } from 'vitest';
import {
	RESET_TOKEN_LIFETIME_MS,
	SESSION_LIFETIME_MS,
	VERIFY_TOKEN_LIFETIME_MS,
	generateToken,
	hashToken,
	isExpired,
	shouldRenew
} from './tokens';

describe('tokens', () => {
	it('generates unguessable, distinct tokens', () => {
		const tokens = new Set(Array.from({ length: 200 }, generateToken));
		expect(tokens.size).toBe(200);
		expect([...tokens][0]).toMatch(/^[a-z2-7]{32}$/);
	});

	it('hashes deterministically and never returns the token itself', () => {
		const token = generateToken();
		expect(hashToken(token)).toBe(hashToken(token));
		expect(hashToken(token)).not.toBe(token);
		expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
		expect(hashToken('a')).not.toBe(hashToken('b'));
	});

	it('knows when a token has expired', () => {
		const now = 1_000_000;
		expect(isExpired(new Date(now + 1), now)).toBe(false);
		expect(isExpired(new Date(now), now)).toBe(true);
		expect(isExpired(new Date(now - 1), now)).toBe(true);
	});

	it('renews a session only once less than half its life remains', () => {
		const now = 5_000_000_000;
		expect(shouldRenew(new Date(now + SESSION_LIFETIME_MS), now)).toBe(false);
		expect(shouldRenew(new Date(now + SESSION_LIFETIME_MS / 2 + 1000), now)).toBe(false);
		expect(shouldRenew(new Date(now + SESSION_LIFETIME_MS / 2 - 1000), now)).toBe(true);
	});

	it('keeps emailed links short-lived and sessions long-lived', () => {
		expect(RESET_TOKEN_LIFETIME_MS).toBeLessThan(VERIFY_TOKEN_LIFETIME_MS);
		expect(VERIFY_TOKEN_LIFETIME_MS).toBeLessThanOrEqual(24 * 3600 * 1000);
		expect(SESSION_LIFETIME_MS).toBe(30 * 24 * 3600 * 1000);
	});
});
