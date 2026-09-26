import { MIME_TO_KIND, baseMime } from '$lib/evidence/config';

// Checks on an uploaded recording that do not need the network. The declared type has to be
// on the allowlist AND the first bytes have to look like that container, so a page or a
// script renamed to .webm is refused. The stored type always comes from this list, never
// from the request, so nothing is ever served as html.

const startsWith = (b: Uint8Array, at: number, sig: number[]) =>
	sig.every((byte, i) => b[at + i] === byte);

/** The container a file's opening bytes say it is, or null. */
export function sniff(b: Uint8Array): 'webm' | 'ogg' | 'mp4' | 'mp3' | 'wav' | null {
	if (startsWith(b, 0, [0x1a, 0x45, 0xdf, 0xa3])) return 'webm';
	if (startsWith(b, 0, [0x4f, 0x67, 0x67, 0x53])) return 'ogg';
	if (startsWith(b, 4, [0x66, 0x74, 0x79, 0x70])) return 'mp4';
	if (startsWith(b, 0, [0x49, 0x44, 0x33]) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0))
		return 'mp3';
	if (startsWith(b, 0, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, 8, [0x57, 0x41, 0x56, 0x45]))
		return 'wav';
	return null;
}

const CONTAINER_FOR: Record<string, ReturnType<typeof sniff>> = {
	'audio/webm': 'webm',
	'video/webm': 'webm',
	'audio/ogg': 'ogg',
	'audio/mp4': 'mp4',
	'audio/x-m4a': 'mp4',
	'audio/m4a': 'mp4',
	'video/mp4': 'mp4',
	'video/quicktime': 'mp4',
	'audio/mpeg': 'mp3',
	'audio/wav': 'wav',
	'audio/x-wav': 'wav'
};

export type FileCheck =
	{ ok: true; mime: string; kind: 'audio' | 'video' } | { ok: false; reason: 'type' | 'content' };

/** Validates the declared type against the allowlist and the file's own bytes. */
export function checkRecording(declaredMime: string, head: Uint8Array): FileCheck {
	const mime = baseMime(declaredMime);
	const kind = MIME_TO_KIND[mime];
	if (!kind) return { ok: false, reason: 'type' };
	if (sniff(head) !== CONTAINER_FOR[mime]) return { ok: false, reason: 'content' };
	return { ok: true, mime, kind };
}
