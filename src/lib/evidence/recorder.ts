import type { EvidenceKind } from './config';

// Choosing what the browser can record. Safari records mp4, Chromium and Firefox webm or ogg,
// so the list is tried in order and the first supported one wins.

const CANDIDATES: Record<'audio' | 'video', string[]> = {
	audio: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'],
	video: ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
};

/** The first candidate `isSupported` accepts, or null when the browser can record neither. */
export function pickMimeType(
	kind: Exclude<EvidenceKind, 'note'>,
	isSupported: (mime: string) => boolean
): string | null {
	return CANDIDATES[kind].find((mime) => isSupported(mime)) ?? null;
}

/** "1:05" for 65 seconds. */
export function clock(seconds: number): string {
	const whole = Math.max(0, Math.floor(seconds));
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
