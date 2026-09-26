import { describe, expect, it } from 'vitest';
import { wrapLabel } from './geometry';
import { boxView, centerOn, clampView, zoomAt } from './viewport';

const size = { w: 400, h: 800 };

describe('boxView', () => {
	it('fits a box and centres it', () => {
		const v = boxView({ x: 0, y: 0, w: 1000, h: 2000 }, size, 0);
		expect(v.k).toBeCloseTo(0.4);
		expect(v.x).toBeCloseTo(0);
		expect(v.y).toBeCloseTo(0);
	});

	it('never zooms past the maximum for a tiny box', () => {
		expect(boxView({ x: 0, y: 0, w: 10, h: 10 }, size).k).toBe(2.5);
	});
});

describe('zoomAt', () => {
	it('keeps the point under the cursor fixed', () => {
		const before = { x: 30, y: -40, k: 0.5 };
		const after = zoomAt(before, 1.5, 200, 300, 0.1);
		const worldBefore = [(200 - before.x) / before.k, (300 - before.y) / before.k];
		const worldAfter = [(200 - after.x) / after.k, (300 - after.y) / after.k];
		expect(worldAfter[0]).toBeCloseTo(worldBefore[0]);
		expect(worldAfter[1]).toBeCloseTo(worldBefore[1]);
	});

	it('clamps to the min and max zoom', () => {
		const v = { x: 0, y: 0, k: 1 };
		expect(zoomAt(v, 100, 0, 0, 0.3).k).toBe(2.5);
		expect(zoomAt(v, 0.001, 0, 0, 0.3).k).toBe(0.3);
	});
});

describe('clampView', () => {
	const world = { x: 0, y: 0, w: 1000, h: 1000 };
	it('pulls a view that has left the world back into sight', () => {
		const v = clampView({ x: -5000, y: 5000, k: 1 }, world, size, 80);
		expect(v.x).toBe(80 - 1000);
		expect(v.y).toBe(800 - 80);
	});

	it('leaves a sensible view alone', () => {
		const v = { x: -100, y: -100, k: 1 };
		expect(clampView(v, world, size)).toEqual(v);
	});
});

describe('centerOn', () => {
	it('puts a world point at a screen point', () => {
		const v = centerOn(300, 400, 2, 200, 250);
		expect(300 * v.k + v.x).toBe(200);
		expect(400 * v.k + v.y).toBe(250);
	});
});

describe('wrapLabel', () => {
	it('leaves short names alone and balances long ones', () => {
		expect(wrapLabel('tuning')).toEqual(['tuning']);
		expect(wrapLabel('hammer-ons and pull-offs')).toEqual(['hammer-ons', 'and pull-offs']);
	});
});
