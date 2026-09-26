import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';
import { checkAll, memoryLimiter, type Limiter, type RateLimitResult } from './rate-limit-core';

export type { RateLimitResult };

const redis =
	env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
		? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
		: null;

const MINUTE = 60_000;

function makeLimiter(
	prefix: string,
	limit: number,
	windowMinutes: number,
	window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Limiter {
	if (!redis) return memoryLimiter(limit, windowMinutes * MINUTE);
	return new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(limit, window),
		prefix: `ratelimit:${prefix}`
	});
}

const signInIp = makeLimiter('sign-in:ip', 20, 1, '1 m');
const signInAccount = makeLimiter('sign-in:account', 5, 5, '5 m');
const signUpIp = makeLimiter('sign-up:ip', 5, 10, '10 m');
const resetIp = makeLimiter('reset:ip', 5, 10, '10 m');
const resetAccount = makeLimiter('reset:account', 3, 60, '1 h');
const tokenIp = makeLimiter('token:ip', 20, 10, '10 m');
const resendUser = makeLimiter('resend:user', 3, 60, '1 h');
const sensitiveUser = makeLimiter('sensitive:user', 5, 5, '5 m');
const uploadUser = makeLimiter('upload:user', 20, 10, '10 m');

const ipKey = (ip: string | null) => ip ?? 'unknown';

export const checkSignInRateLimit = (ip: string | null, email: string) =>
	checkAll([
		{ limiter: signInIp, identifier: ipKey(ip) },
		{ limiter: signInAccount, identifier: email.toLowerCase() }
	]);

export const checkSignUpRateLimit = (ip: string | null) =>
	checkAll([{ limiter: signUpIp, identifier: ipKey(ip) }]);

export const checkResetRateLimit = (ip: string | null, email: string) =>
	checkAll([
		{ limiter: resetIp, identifier: ipKey(ip) },
		{ limiter: resetAccount, identifier: email.toLowerCase() }
	]);

/** Verify and reset-confirm links. */
export const checkTokenRateLimit = (ip: string | null) =>
	checkAll([{ limiter: tokenIp, identifier: ipKey(ip) }]);

export const checkResendRateLimit = (userId: string) =>
	checkAll([{ limiter: resendUser, identifier: userId }]);

/** Password-confirmed actions (change password or email, delete). Stops password guessing from a stolen session. */
export const checkSensitiveRateLimit = (userId: string) =>
	checkAll([{ limiter: sensitiveUser, identifier: userId }]);

/** Evidence uploads. Generous for real use, and a ceiling on a script hammering storage. */
export const checkUploadRateLimit = (userId: string) =>
	checkAll([{ limiter: uploadUser, identifier: userId }]);
