import { describe, expect, it } from 'vitest';
import {
	LAST_TIER,
	MIN_FRAMES,
	SLOW_FRAME_MS,
	WARMUP_FRAMES,
	averageFrameMs,
	nextTier,
	tierSettings
} from './perf';

const frames = (ms: number, n = 120) => new Array(n).fill(ms);

describe('averageFrameMs', () => {
	it('averages the frames after warmup', () => {
		expect(averageFrameMs(frames(16))).toBe(16);
		// Slow warmup frames do not count against the sky.
		expect(averageFrameMs([...frames(200, WARMUP_FRAMES).map(() => 220), ...frames(16)])).toBe(16);
	});

	it('ignores stalls such as a hidden tab', () => {
		expect(averageFrameMs([...frames(16, 60), 5000, 9000, ...frames(16, 60)])).toBe(16);
	});

	it('says nothing without enough frames', () => {
		expect(averageFrameMs(frames(50, WARMUP_FRAMES + MIN_FRAMES - 1))).toBeNull();
		expect(averageFrameMs([])).toBeNull();
	});
});

describe('nextTier', () => {
	it('holds when frames are fast enough, at the threshold and below it', () => {
		expect(nextTier(0, 16)).toBe(0);
		expect(nextTier(1, SLOW_FRAME_MS)).toBe(1);
	});

	it('steps down one tier at a time when slow, and stops at the last', () => {
		expect(nextTier(0, 45)).toBe(1);
		expect(nextTier(1, 45)).toBe(2);
		expect(nextTier(LAST_TIER, 90)).toBe(LAST_TIER);
	});

	it('never moves without a verdict', () => {
		expect(nextTier(2, null)).toBe(2);
	});
});

describe('tierSettings', () => {
	it('does less at every step and ends in a still sky', () => {
		expect(tierSettings(0)).toEqual({ halfRes: false, rainShare: 1, animate: true });
		expect(tierSettings(1)).toEqual({ halfRes: true, rainShare: 1, animate: true });
		expect(tierSettings(2)).toEqual({ halfRes: true, rainShare: 0.5, animate: true });
		expect(tierSettings(LAST_TIER)).toMatchObject({ animate: false });
	});
});
