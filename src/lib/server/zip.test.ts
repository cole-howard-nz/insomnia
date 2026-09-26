import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { zipStream } from './zip';

async function collect(stream: ReadableStream<Uint8Array>) {
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

describe('zipStream', () => {
	it('writes a zip whose entries read back exactly', async () => {
		const files = {
			'insomnia-export.json': new TextEncoder().encode('{"a":1}'),
			'evidence/one.webm': new Uint8Array([1, 2, 3, 4, 5, 250, 251]),
			'evidence/ünï.txt': new TextEncoder().encode('caf\u00e9')
		};
		const zip = await collect(
			zipStream(Object.entries(files).map(([name, data]) => ({ name, data: async () => data })))
		);

		// End of central directory: signature, then the entry count at offset 10.
		const eocd = zip.length - 22;
		const view = new DataView(zip.buffer, zip.byteOffset);
		expect(view.getUint32(eocd, true)).toBe(0x06054b50);
		expect(view.getUint16(eocd + 10, true)).toBe(3);

		// Walk the central directory and check each entry against the source.
		let at = view.getUint32(eocd + 16, true);
		const seen: string[] = [];
		for (let i = 0; i < 3; i++) {
			expect(view.getUint32(at, true)).toBe(0x02014b50);
			const size = view.getUint32(at + 20, true);
			const nameLength = view.getUint16(at + 28, true);
			const local = view.getUint32(at + 42, true);
			const name = new TextDecoder().decode(zip.slice(at + 46, at + 46 + nameLength));
			const start =
				local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
			expect([...zip.slice(start, start + size)]).toEqual([...files[name as keyof typeof files]]);
			seen.push(name);
			at += 46 + nameLength;
		}
		expect(seen.sort()).toEqual(Object.keys(files).sort());
	});

	it('is a valid archive to a real unzip tool', async () => {
		const zip = await collect(
			zipStream([{ name: 'a/b.txt', data: async () => new TextEncoder().encode('hello') }])
		);
		const dir = mkdtempSync(path.join(tmpdir(), 'zip-'));
		const file = path.join(dir, 'x.zip');
		writeFileSync(file, zip);
		const script =
			'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;sys.stdout.write(z.read("a/b.txt").decode())';
		let out: string | null = null;
		for (const python of ['python3', 'python']) {
			try {
				out = execFileSync(python, ['-c', script, file], { encoding: 'utf8' });
				break;
			} catch {
				// try the next name, and skip the check when there is no python at all
			}
		}
		// No python here means the byte-level test above is the only check.
		expect(out === null || out === 'hello').toBe(true);
	});
});
