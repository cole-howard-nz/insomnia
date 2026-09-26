// In-memory sliding window. The fallback when Upstash is not configured (local dev,
// tests). Per instance, so on serverless it is best effort. Upstash is the real wall.

export interface LimitResult {
	success: boolean;
	/** Epoch ms when the window frees up. */
	reset: number;
}

export interface Limiter {
	limit(identifier: string): Promise<LimitResult>;
}

export function memoryLimiter(limit: number, windowMs: number, now = () => Date.now()): Limiter {
	const hits = new Map<string, number[]>();
	return {
		async limit(identifier) {
			const t = now();
			const recent = (hits.get(identifier) ?? []).filter((at) => at > t - windowMs);
			if (recent.length >= limit) {
				hits.set(identifier, recent);
				return { success: false, reset: recent[0] + windowMs };
			}
			recent.push(t);
			hits.set(identifier, recent);
			return { success: true, reset: recent[0] + windowMs };
		}
	};
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function checkAll(
	checks: Array<{ limiter: Limiter; identifier: string }>
): Promise<RateLimitResult> {
	for (const { limiter, identifier } of checks) {
		const result = await limiter.limit(identifier);
		if (!result.success) {
			return {
				allowed: false,
				retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
			};
		}
	}
	return { allowed: true };
}
