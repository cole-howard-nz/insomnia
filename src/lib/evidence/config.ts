// Evidence limits, shared by the recorder (so it can stop early) and the server (which
// enforces them). Change them here and both follow.

/** Total stored evidence per user. */
export const MAX_USER_BYTES = 200 * 1024 * 1024;
/** A recording is at most this long. The server can only trust the client for this one. */
export const MAX_CLIP_SECONDS = 120;
/**
 * The hard per-file bound the server enforces. Uploads pass through a serverless function,
 * which caps request bodies at 4.5 MB, so this sits just under it. The recorder picks
 * bitrates so that two minutes fit. Direct-to-storage uploads would lift this.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_NOTE_CHARS = 2000;

/** Bitrates that keep MAX_CLIP_SECONDS inside MAX_FILE_BYTES with room for container overhead. */
export const AUDIO_BITS_PER_SECOND = 48_000;
export const VIDEO_BITS_PER_SECOND = 150_000;

export type EvidenceKind = 'audio' | 'video' | 'note';

/** Allowed recording types, by base mime (codec parameters are stripped first). */
export const MIME_TO_KIND: Record<string, 'audio' | 'video'> = {
	'audio/webm': 'audio',
	'audio/ogg': 'audio',
	'audio/mp4': 'audio',
	'audio/x-m4a': 'audio',
	'audio/m4a': 'audio',
	'audio/mpeg': 'audio',
	'audio/wav': 'audio',
	'audio/x-wav': 'audio',
	'video/webm': 'video',
	'video/mp4': 'video',
	'video/quicktime': 'video'
};

/** `audio/webm;codecs=opus` becomes `audio/webm`. */
export const baseMime = (mime: string) => mime.split(';')[0].trim().toLowerCase();

export const megabytes = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;
