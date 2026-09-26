import { describe, expect, it } from 'vitest';
import { deviceLabel } from './device';

describe('deviceLabel', () => {
	it('names common browsers and systems', () => {
		expect(
			deviceLabel(
				'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
			)
		).toBe('safari on iphone');
		expect(
			deviceLabel(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0'
			)
		).toBe('edge on windows');
		expect(
			deviceLabel(
				'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36'
			)
		).toBe('chrome on android');
	});

	it('falls back gracefully', () => {
		expect(deviceLabel(null)).toBe('unknown device');
		expect(deviceLabel('curl/8.0')).toBe('unknown device');
	});
});
