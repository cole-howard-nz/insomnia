import { describe, expect, it } from 'vitest';
import { hoursCrossed } from './hours';

describe('hoursCrossed', () => {
	it('fires when a session takes the total to a milestone exactly, or past it', () => {
		expect(hoursCrossed(590, 600)).toEqual([10]);
		expect(hoursCrossed(590, 640)).toEqual([10]);
	});

	it('does not fire again once past it, or before reaching it', () => {
		expect(hoursCrossed(600, 660)).toEqual([]);
		expect(hoursCrossed(0, 599)).toEqual([]);
	});

	it('reports every milestone one long gap crosses, in order', () => {
		expect(hoursCrossed(0, 1900)).toEqual([10, 30]);
	});

	it('fires nothing for a session of no minutes', () => {
		expect(hoursCrossed(600, 600)).toEqual([]);
	});
});
