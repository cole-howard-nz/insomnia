import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUser } from '$lib/server/auth/guards';
import { deleteEvidence, getEvidenceFile } from '$lib/server/data';
import { getStorage } from '$lib/server/storage';

const uuid = z.uuid();

/**
 * Streams a recording to its owner. Never a public URL: the session cookie and the row's
 * owner are checked on every request. Honours Range, because Safari will not play media without it.
 */
export async function GET(event) {
	const { user } = requireUser(event);
	const id = uuid.safeParse(event.params.id);
	if (!id.success) error(404, 'Not found');
	const meta = await getEvidenceFile(user.id, id.data);
	if (!meta) error(404, 'Not found');
	const stored = await getStorage().get(meta.storageKey);
	if (!stored) error(404, 'Not found');

	const headers: Record<string, string> = {
		'Content-Type': meta.mime,
		'Cache-Control': 'private, no-store',
		'X-Content-Type-Options': 'nosniff',
		'Content-Disposition': 'inline',
		'Accept-Ranges': 'bytes'
	};

	const range = /^bytes=(\d*)-(\d*)$/.exec(event.request.headers.get('range') ?? '');
	if (!range || (range[1] === '' && range[2] === '')) {
		return new Response(stored.stream, {
			headers: { ...headers, ...(stored.bytes ? { 'Content-Length': String(stored.bytes) } : {}) }
		});
	}

	// Files are small (a few MB at most), so a range is served from the whole body.
	const all = new Uint8Array(await new Response(stored.stream).arrayBuffer());
	const size = all.length;
	const start = Math.max(0, range[1] === '' ? size - Number(range[2]) : Number(range[1]));
	const end = Math.min(range[1] === '' || range[2] === '' ? size - 1 : Number(range[2]), size - 1);
	if (start > end) {
		return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
	}
	return new Response(all.slice(start, end + 1), {
		status: 206,
		headers: {
			...headers,
			'Content-Range': `bytes ${start}-${end}/${size}`,
			'Content-Length': String(end - start + 1)
		}
	});
}

export async function DELETE(event) {
	const { user } = requireUser(event);
	const id = uuid.safeParse(event.params.id);
	if (!id.success) error(404, 'Not found');
	if (!(await deleteEvidence(user.id, id.data))) error(404, 'Not found');
	return new Response(null, { status: 204 });
}
