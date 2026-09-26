import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { del, get, put } from '@vercel/blob';
import { env } from '$env/dynamic/private';

// Private object storage for evidence files. Two drivers behind one interface:
//  - Vercel Blob, private access, when BLOB_READ_WRITE_TOKEN is set (production, preview)
//  - a folder on disk (.data/evidence, git-ignored) otherwise, for dev and tests
// Files are always read back through the authenticated endpoint, never by a public URL.
// Keys are `<userId>/<random>`, so a whole account's files share one prefix.

export interface StoredFile {
	stream: ReadableStream<Uint8Array>;
	/** Set when the driver knows it. */
	bytes?: number;
}

export interface Storage {
	put(key: string, body: Uint8Array, mime: string): Promise<void>;
	get(key: string): Promise<StoredFile | null>;
	delete(keys: string[]): Promise<void>;
}

const LOCAL_ROOT = path.resolve('.data', 'evidence');

/** Resolves a key under the root and refuses to leave it. */
function localPath(key: string) {
	const full = path.resolve(LOCAL_ROOT, key);
	if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error('bad storage key');
	return full;
}

const localStorageDriver: Storage = {
	async put(key, body) {
		const file = localPath(key);
		await mkdir(path.dirname(file), { recursive: true });
		await writeFile(file, body);
	},
	async get(key) {
		try {
			const file = localPath(key);
			const [info, buf] = await Promise.all([stat(file), readFile(file)]);
			return {
				bytes: info.size,
				stream: new ReadableStream({
					start(controller) {
						controller.enqueue(new Uint8Array(buf));
						controller.close();
					}
				})
			};
		} catch {
			return null;
		}
	},
	async delete(keys) {
		await Promise.all(keys.map((key) => rm(localPath(key), { force: true })));
	}
};

function blobDriver(token: string): Storage {
	return {
		async put(key, body, mime) {
			await put(key, Buffer.from(body), {
				access: 'private',
				addRandomSuffix: false,
				allowOverwrite: false,
				contentType: mime,
				token
			});
		},
		async get(key) {
			const result = await get(key, { access: 'private', token });
			if (!result || result.statusCode !== 200) return null;
			return { stream: result.stream, bytes: result.blob.size };
		},
		async delete(keys) {
			if (keys.length) await del(keys, { token });
		}
	};
}

let cached: Storage | undefined;
/** Chosen on first use, so importing this never needs the environment. */
export function getStorage(): Storage {
	cached ??= env.BLOB_READ_WRITE_TOKEN ? blobDriver(env.BLOB_READ_WRITE_TOKEN) : localStorageDriver;
	return cached;
}

/** For tests: forget the chosen driver. */
export function resetStorage() {
	cached = undefined;
}
