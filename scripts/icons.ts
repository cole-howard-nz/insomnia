// Renders the app icons (PNG) from the favicon's design: an amber ring and dot on the deep
// background. Run `npm run icons` after changing the design, and commit the results.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const BG = '#0c0d10';
const AMBER = '#e2932c';

/** `pad` is the share of the icon kept clear around the mark. Maskable icons need more. */
const svg = (size: number, pad: number, rounded: boolean) => {
	const c = size / 2;
	const r = (size * (1 - pad * 2)) / 2 / 2; // ring radius: a quarter of the drawn area
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	<rect width="${size}" height="${size}" ${rounded ? `rx="${size * 0.125}"` : ''} fill="${BG}"/>
	<circle cx="${c}" cy="${c}" r="${r * 2}" fill="none" stroke="${AMBER}" stroke-width="${size / 16}"/>
	<circle cx="${c}" cy="${c}" r="${r * 0.62}" fill="${AMBER}"/>
</svg>`;
};

const icons = [
	{ file: 'icon-192.png', size: 192, pad: 0.22, rounded: true },
	{ file: 'icon-512.png', size: 512, pad: 0.22, rounded: true },
	// Maskable: the platform crops it to a circle or squircle, so the mark stays in the middle 60%.
	{ file: 'icon-maskable-512.png', size: 512, pad: 0.3, rounded: false },
	{ file: 'apple-touch-icon.png', size: 180, pad: 0.24, rounded: false }
];

await mkdir('static', { recursive: true });
const browser = await chromium.launch();
try {
	for (const { file, size, pad, rounded } of icons) {
		const page = await browser.newPage({ viewport: { width: size, height: size } });
		await page.setContent(
			`<body style="margin:0;background:transparent">${svg(size, pad, rounded)}</body>`
		);
		await writeFile(`static/${file}`, await page.screenshot({ omitBackground: true }));
		await page.close();
		console.log('wrote', file);
	}
} finally {
	await browser.close();
}
