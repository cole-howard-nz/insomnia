import { describe, expect, it } from 'vitest';
import { stepToward, weatherParams } from './weather-params';
import { blend, contrast, hexToRgb, type Rgb } from './contrast';
import { CLOUD_ALPHA_CAP, CLOUD_COLOR, CLOUD_SCALE_MAX } from './cloud-constants';

describe('weatherParams', () => {
	it('is heavy rain and dense cloud for a new user', () => {
		const p = weatherParams(0);
		expect(p.dropScale).toBe(1);
		expect(p.cloudDensity).toBe(1);
	});

	it('stops the rain near the top and thins the cloud', () => {
		const p = weatherParams(1);
		expect(p.dropScale).toBe(0);
		expect(p.cloudDensity).toBeLessThan(0.5);
		expect(p.cloudBrightness).toBe(1);
	});

	it('clamps out-of-range input', () => {
		expect(weatherParams(-3)).toEqual(weatherParams(0));
		expect(weatherParams(9)).toEqual(weatherParams(1));
	});

	it('thins monotonically', () => {
		let prev = weatherParams(0).dropScale;
		for (let w = 0.1; w <= 1; w += 0.1) {
			const next = weatherParams(w).dropScale;
			expect(next).toBeLessThanOrEqual(prev);
			prev = next;
		}
	});
});

describe('stepToward', () => {
	it('moves toward the target without overshooting', () => {
		const next = stepToward(0, 1, 0.1);
		expect(next).toBeGreaterThan(0);
		expect(next).toBeLessThan(1);
	});

	it('settles exactly on the target', () => {
		let v = 0;
		for (let i = 0; i < 600; i++) v = stepToward(v, 1, 1 / 60);
		expect(v).toBe(1);
	});
});

describe('contrast over the brightest sky', () => {
	const bg = hexToRgb('#0c0d10');
	const text = hexToRgb('#d8d6cf');
	const dim = hexToRgb('#9296a0');
	const cloud = CLOUD_COLOR.map((c) => c * CLOUD_SCALE_MAX * 255) as Rgb;
	// Brightest possible background: max-brightness cloud at the alpha cap.
	const brightest = blend(cloud, CLOUD_ALPHA_CAP, bg);

	it('body text meets AA (4.5:1)', () => {
		expect(contrast(text, brightest)).toBeGreaterThanOrEqual(4.5);
	});

	it('secondary text meets AA (4.5:1)', () => {
		expect(contrast(dim, brightest)).toBeGreaterThanOrEqual(4.5);
	});

	it('secondary text meets AA on cards', () => {
		expect(contrast(dim, hexToRgb('#171a20'))).toBeGreaterThanOrEqual(4.5);
	});
});
