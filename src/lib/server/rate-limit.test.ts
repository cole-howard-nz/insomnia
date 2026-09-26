import { describe, expect, it } from 'vitest';
import { checkAll, memoryLimiter } from './rate-limit-core';

describe('memory rate limiter', () => {
	it('allows up to the limit, then blocks', async () => {
		const limiter = memoryLimiter(3, 60_000);
		for (let i = 0; i < 3; i++) expect((await limiter.limit('a')).success).toBe(true);
		expect((await limiter.limit('a')).success).toBe(false);
	});

	it('counts each identifier separately', async () => {
		const limiter = memoryLimiter(1, 60_000);
		expect((await limiter.limit('a')).success).toBe(true);
		expect((await limiter.limit('b')).success).toBe(true);
		expect((await limiter.limit('a')).success).toBe(false);
	});

	it('frees up once the window passes', async () => {
		let now = 0;
		const limiter = memoryLimiter(1, 1000, () => now);
		expect((await limiter.limit('a')).success).toBe(true);
		now = 500;
		expect((await limiter.limit('a')).success).toBe(false);
		now = 1001;
		expect((await limiter.limit('a')).success).toBe(true);
	});

	it('checkAll reports a retry time when any limiter blocks', async () => {
		const tight = memoryLimiter(1, 60_000);
		await tight.limit('x');
		const result = await checkAll([{ limiter: tight, identifier: 'x' }]);
		expect(result.allowed).toBe(false);
		if (!result.allowed) expect(result.retryAfterSeconds).toBeGreaterThan(0);
	});
});
