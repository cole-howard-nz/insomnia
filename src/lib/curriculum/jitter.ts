/** Stable pseudo-random number in -1..1 from a string. */
export function jitter(seed: string) {
	let h = 2166136261;
	for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
	return ((h >>> 0) % 2000) / 1000 - 1;
}
