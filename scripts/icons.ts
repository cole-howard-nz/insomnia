// Renders the app icons (PNG) from the favicon's design: a guitar pick holding a sleeping moon,
// in amber on the deep background (keep the mark in sync with static/favicon.svg and Logo.svelte). Run `npm run icons` after changing the design, and commit the results.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const BG = '#0c0d10';
const AMBER = '#e2932c';

/** `pad` is the share of the icon kept clear around the mark. Maskable icons need more. */
const svg = (size: number, pad: number, rounded: boolean) => {
	const drawn = size * (1 - pad * 2);
	const scale = drawn / 32;
	const offset = (size - drawn) / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	<rect width="${size}" height="${size}" ${rounded ? `rx="${size * 0.1875}"` : ''} fill="${BG}"/>
	<g transform="translate(${offset} ${offset}) scale(${scale})">
		<defs><mask id="moon"><rect width="32" height="32" fill="#000"/><circle cx="15.5" cy="14.5" r="7" fill="#fff"/><circle cx="19.5" cy="12.5" r="6" fill="#000"/></mask></defs>
		<path d="M16 28.5C8.5 23.5 5.5 17 5.5 11.5C5.5 6.5 9.5 3.5 16 3.5C22.5 3.5 26.5 6.5 26.5 11.5C26.5 17 23.5 23.5 16 28.5Z" fill="none" stroke="${AMBER}" stroke-width="1.8" stroke-linejoin="round"/>
		<rect width="32" height="32" fill="${AMBER}" mask="url(#moon)"/>
		<circle cx="20.6" cy="12" r="1.3" fill="#ffd9a0"/>
	</g>
</svg>`;
};

const icons = [
	{ file: 'icon-192.png', size: 192, pad: 0.12, rounded: true },
	{ file: 'icon-512.png', size: 512, pad: 0.12, rounded: true },
	// Maskable: the platform crops it to a circle or squircle, so the mark stays in the middle 60%.
	{ file: 'icon-maskable-512.png', size: 512, pad: 0.2, rounded: false },
	{ file: 'apple-touch-icon.png', size: 180, pad: 0.14, rounded: false }
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
