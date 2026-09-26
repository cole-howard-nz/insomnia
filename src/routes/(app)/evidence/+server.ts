import { randomUUID } from 'node:crypto';
import { error, json } from '@sveltejs/kit';
import {
	MAX_CLIP_SECONDS,
	MAX_FILE_BYTES,
	MAX_NOTE_CHARS,
	MAX_USER_BYTES
} from '$lib/evidence/config';
import { requireUser } from '$lib/server/auth/guards';
import { loadCurriculum } from '$lib/server/curriculum';
import { addEvidence, evidenceUsage, listEvidence, listStopLevelEvents } from '$lib/server/data';
import { checkRecording } from '$lib/server/evidence-file';
import { checkUploadRateLimit } from '$lib/server/rate-limit';
import { getStorage } from '$lib/server/storage';

async function stopBySlug(slug: string | null) {
	const stop = slug ? (await loadCurriculum()).stops.find((s) => s.slug === slug) : undefined;
	if (!stop) error(404, 'no such stop');
	return stop;
}

/** The timeline of one stop: its level events and evidence, and how much storage is used. */
export async function GET(event) {
	const { user } = requireUser(event);
	const stop = await stopBySlug(event.url.searchParams.get('stop'));
	const [items, levels, used] = await Promise.all([
		listEvidence(user.id, stop.id),
		listStopLevelEvents(user.id, stop.id),
		evidenceUsage(user.id)
	]);
	return json(
		{ items, levels, usedBytes: used, limitBytes: MAX_USER_BYTES },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
}

const refuse = (status: number, message: string) => json({ message }, { status });

/**
 * Attaches a recording or a note to a stop (multipart: slug, note, seconds, file).
 * Recordings need a verified email. Limits are enforced here whatever the client did.
 */
export async function POST(event) {
	const { user } = requireUser(event);

	// Refuse an oversized body before reading any of it.
	const declared = Number(event.request.headers.get('content-length'));
	if (declared > MAX_FILE_BYTES + 64 * 1024) return refuse(413, 'that file is too big.');

	const form = await event.request.formData().catch(() => null);
	if (!form) return refuse(400, 'bad request');
	const stop = await stopBySlug(String(form.get('slug') ?? ''));
	const note = String(form.get('note') ?? '').trim();
	if (note.length > MAX_NOTE_CHARS) return refuse(400, 'that note is too long.');
	const file = form.get('file');

	if (!(file instanceof File)) {
		if (!note) return refuse(400, 'write something first.');
		const added = await addEvidence(user.id, { stopId: stop.id, kind: 'note', note });
		if (!added.ok) return refuse(413, 'storage is full.');
		return json({ item: added.item });
	}

	if (!user.emailVerified) return refuse(403, 'verify your email to attach recordings.');
	const limit = await checkUploadRateLimit(user.id);
	if (!limit.allowed) {
		return refuse(429, `too many uploads. wait ${limit.retryAfterSeconds} seconds.`);
	}

	if (file.size === 0) return refuse(400, 'that file is empty.');
	if (file.size > MAX_FILE_BYTES) return refuse(413, 'that file is too big.');
	const rawSeconds = form.get('seconds');
	const seconds = rawSeconds === null || rawSeconds === '' ? null : Number(rawSeconds);
	if (
		seconds !== null &&
		(!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_CLIP_SECONDS)
	) {
		return refuse(400, `clips are ${MAX_CLIP_SECONDS / 60} minutes at most.`);
	}

	const body = new Uint8Array(await file.arrayBuffer());
	const checked = checkRecording(file.type, body.subarray(0, 16));
	if (!checked.ok) return refuse(415, "that isn't an audio or video file we can keep.");

	const storageKey = `${user.id}/${randomUUID()}`;
	await getStorage().put(storageKey, body, checked.mime);
	const added = await addEvidence(user.id, {
		stopId: stop.id,
		kind: checked.kind,
		note,
		file: {
			storageKey,
			mime: checked.mime,
			bytes: body.length,
			durationSeconds: seconds === null ? null : Math.round(seconds)
		}
	});
	if (!added.ok) {
		await getStorage().delete([storageKey]);
		return refuse(413, 'storage is full. delete something first.');
	}
	return json({ item: added.item });
}
