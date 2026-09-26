import { crc32 } from 'node:zlib';

// A minimal zip writer: stored entries only (recordings are already compressed), streamed
// one file at a time so an export never holds the whole account in memory. Sizes must be
// known up front, so each entry is read fully before it is written.

export interface ZipEntry {
	name: string;
	/** Read lazily, when the entry's turn comes. */
	data: () => Promise<Uint8Array>;
	modified?: Date;
}

const u16 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
const u32 = (n: number) =>
	new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
const join = (...parts: Uint8Array[]) => {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
};

function dosDateTime(d: Date) {
	const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
	const date =
		((Math.max(d.getFullYear(), 1980) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
	return { time, date };
}

/** A streaming zip of `entries`, as a web ReadableStream ready for a Response. */
export function zipStream(entries: ZipEntry[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	const central: Uint8Array[] = [];
	let offset = 0;
	let next = 0;

	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			if (next < entries.length) {
				const entry = entries[next++];
				const data = await entry.data();
				const name = encoder.encode(entry.name);
				const { time, date } = dosDateTime(entry.modified ?? new Date());
				const crc = crc32(data);
				// General purpose flag bit 11: the name is UTF-8.
				const shared = [u16(20), u16(0x0800), u16(0), u16(time), u16(date), u32(crc)];
				const header = join(
					u32(0x04034b50),
					...shared,
					u32(data.length),
					u32(data.length),
					u16(name.length),
					u16(0),
					name
				);
				central.push(
					join(
						u32(0x02014b50),
						u16(20),
						...shared,
						u32(data.length),
						u32(data.length),
						u16(name.length),
						u16(0),
						u16(0),
						u16(0),
						u16(0),
						u32(0),
						u32(offset),
						name
					)
				);
				offset += header.length + data.length;
				controller.enqueue(header);
				controller.enqueue(data);
				return;
			}
			const directory = join(...central);
			controller.enqueue(directory);
			controller.enqueue(
				join(
					u32(0x06054b50),
					u16(0),
					u16(0),
					u16(entries.length),
					u16(entries.length),
					u32(directory.length),
					u32(offset),
					u16(0)
				)
			);
			controller.close();
		}
	});
}
