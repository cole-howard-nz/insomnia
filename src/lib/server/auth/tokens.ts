import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';

export const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const VERIFY_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24; // 24 hours
export const RESET_TOKEN_LIFETIME_MS = 1000 * 60 * 60; // 1 hour

/** 160 random bits, base32. Used for session cookies and emailed links. */
export function generateToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

/** Only this hash is ever stored, so a database leak cannot be replayed. */
export function hashToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export function isExpired(expiresAt: Date, now = Date.now()): boolean {
	return now >= expiresAt.getTime();
}

/** Sliding expiry: renew once less than half the lifetime remains. */
export function shouldRenew(expiresAt: Date, now = Date.now()): boolean {
	return now >= expiresAt.getTime() - SESSION_LIFETIME_MS / 2;
}
