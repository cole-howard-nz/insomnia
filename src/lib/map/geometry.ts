import { jitter } from '../curriculum/jitter';

// Hand-cut strokes: slightly wobbly, but deterministic so the map never shimmers.

const f = (n: number) => Math.round(n * 10) / 10;

/** A slightly bowed line between two points. */
export function wobblyLine(x1: number, y1: number, x2: number, y2: number, seed: string) {
	const mx = (x1 + x2) / 2;
	const my = (y1 + y2) / 2;
	const len = Math.hypot(x2 - x1, y2 - y1) || 1;
	const bow = jitter(seed) * Math.min(10, len * 0.06);
	const cx = mx + (-(y2 - y1) / len) * bow;
	const cy = my + ((x2 - x1) / len) * bow;
	return `M${f(x1)} ${f(y1)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`;
}

/** A rectangle with each corner nudged and each edge broken once, like cut paper. */
export function wobblyRect(x: number, y: number, w: number, h: number, seed: string) {
	const j = (name: string, amount: number) => jitter(`${seed}${name}`) * amount;
	const pts: [number, number][] = [
		[x + j('a', 6), y + j('b', 6)],
		[x + w * 0.5 + j('c', 10), y + j('d', 5)],
		[x + w + j('e', 6), y + j('f', 6)],
		[x + w + j('g', 5), y + h * 0.5 + j('h', 10)],
		[x + w + j('i', 6), y + h + j('j', 6)],
		[x + w * 0.5 + j('k', 10), y + h + j('l', 5)],
		[x + j('m', 6), y + h + j('n', 6)],
		[x + j('o', 5), y + h * 0.5 + j('p', 10)]
	];
	return `M${pts.map(([px, py]) => `${f(px)} ${f(py)}`).join('L')}Z`;
}

/** Splits a name into at most two lines of about `width` characters. */
export function wrapLabel(name: string, width = 14): string[] {
	if (name.length <= width) return [name];
	const words = name.split(' ');
	let best: string[] = [name];
	let bestScore = Infinity;
	for (let i = 1; i < words.length; i++) {
		const a = words.slice(0, i).join(' ');
		const b = words.slice(i).join(' ');
		const score = Math.max(a.length, b.length);
		if (score < bestScore) {
			bestScore = score;
			best = [a, b];
		}
	}
	return best;
}
