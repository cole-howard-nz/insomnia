import { hash, verify } from '@node-rs/argon2';

// Argon2id is the @node-rs/argon2 default. Node runtime only, never Edge.
export function hashPassword(password: string): Promise<string> {
	return hash(password);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	return verify(passwordHash, password);
}

// Verified against when the email is unknown, so a missing account costs the same
// time as a wrong password.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<void> {
	dummyHash ??= hashPassword('not-a-real-password');
	await verify(await dummyHash, password).catch(() => false);
}
