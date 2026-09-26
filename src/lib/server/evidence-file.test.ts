import { describe, expect, it } from 'vitest';
import { checkRecording, sniff } from './evidence-file';

const bytes = (...n: number[]) => new Uint8Array([...n, ...new Array(16).fill(0)]);
const webm = bytes(0x1a, 0x45, 0xdf, 0xa3);
const html = new TextEncoder().encode('<html><script>alert(1)</script></html>');

describe('checkRecording', () => {
	it('accepts a real container that matches its declared type, and strips codec parameters', () => {
		expect(checkRecording('audio/webm;codecs=opus', webm)).toEqual({
			ok: true,
			mime: 'audio/webm',
			kind: 'audio'
		});
		expect(checkRecording('video/webm', webm)).toMatchObject({ ok: true, kind: 'video' });
		expect(checkRecording('audio/ogg', bytes(0x4f, 0x67, 0x67, 0x53))).toMatchObject({ ok: true });
		const mp4 = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
		expect(checkRecording('video/mp4', mp4)).toMatchObject({ ok: true, kind: 'video' });
		expect(checkRecording('audio/mpeg', bytes(0x49, 0x44, 0x33))).toMatchObject({ ok: true });
	});

	it('refuses types off the allowlist, including html', () => {
		expect(checkRecording('text/html', html)).toEqual({ ok: false, reason: 'type' });
		expect(checkRecording('image/svg+xml', html)).toEqual({ ok: false, reason: 'type' });
		expect(checkRecording('', webm)).toEqual({ ok: false, reason: 'type' });
	});

	it('refuses a file whose bytes do not match what it claims to be', () => {
		expect(checkRecording('audio/webm', html)).toEqual({ ok: false, reason: 'content' });
		expect(checkRecording('audio/mpeg', webm)).toEqual({ ok: false, reason: 'content' });
		expect(checkRecording('video/mp4', webm)).toEqual({ ok: false, reason: 'content' });
	});

	it('sniffs nothing from an empty or unknown file', () => {
		expect(sniff(new Uint8Array())).toBeNull();
		expect(sniff(html)).toBeNull();
	});
});
