import { describe, expect, it } from 'vitest';
import { clock, pickMimeType } from './recorder';

describe('pickMimeType', () => {
	it('takes the first type the browser supports', () => {
		expect(pickMimeType('audio', (m) => m === 'audio/mp4')).toBe('audio/mp4');
		expect(pickMimeType('audio', () => true)).toBe('audio/webm;codecs=opus');
		expect(pickMimeType('video', (m) => m.startsWith('video/mp4'))).toBe('video/mp4');
	});

	it('is null when nothing is supported', () => {
		expect(pickMimeType('audio', () => false)).toBeNull();
	});
});

describe('clock', () => {
	it('formats seconds as m:ss', () => {
		expect(clock(0)).toBe('0:00');
		expect(clock(65)).toBe('1:05');
		expect(clock(120)).toBe('2:00');
		expect(clock(-3)).toBe('0:00');
	});
});
