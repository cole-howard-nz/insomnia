import { describe, expect, it } from 'vitest';
import { safeNext } from './guards';

describe('safeNext', () => {
	it('follows same-site paths', () => {
		expect(safeNext('/map/barre-f-shape')).toBe('/map/barre-f-shape');
		expect(safeNext('/me?x=1')).toBe('/me?x=1');
	});

	it('refuses anything that could leave the site', () => {
		for (const bad of [
			'https://evil.test',
			'//evil.test',
			'/\\evil.test',
			'/\t/evil.test',
			'/\n/evil.test',
			'evil',
			'',
			null,
			undefined
		]) {
			expect(safeNext(bad)).toBe('/map');
		}
	});
});
