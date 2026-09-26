export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
	const h = hex.replace('#', '');
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

/** Straight-alpha composite of `top` over `bottom`. */
export function blend(top: Rgb, alpha: number, bottom: Rgb): Rgb {
	return top.map((c, i) => c * alpha + bottom[i] * (1 - alpha)) as Rgb;
}

function channel(c: number) {
	const s = c / 255;
	return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance([r, g, b]: Rgb) {
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours. */
export function contrast(a: Rgb, b: Rgb) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
