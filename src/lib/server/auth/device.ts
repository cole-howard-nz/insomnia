/** A short human label for the session list, from the user agent. Best effort. */
export function deviceLabel(userAgent: string | null | undefined): string {
	if (!userAgent) return 'unknown device';
	const ua = userAgent;

	const os = /iPhone/.test(ua)
		? 'iphone'
		: /iPad/.test(ua)
			? 'ipad'
			: /Android/.test(ua)
				? 'android'
				: /Windows/.test(ua)
					? 'windows'
					: /Mac OS X|Macintosh/.test(ua)
						? 'mac'
						: /CrOS/.test(ua)
							? 'chromebook'
							: /Linux/.test(ua)
								? 'linux'
								: null;

	const browser = /Edg\//.test(ua)
		? 'edge'
		: /OPR\/|Opera/.test(ua)
			? 'opera'
			: /Firefox\/|FxiOS/.test(ua)
				? 'firefox'
				: /Chrome\/|CriOS/.test(ua)
					? 'chrome'
					: /Safari\//.test(ua)
						? 'safari'
						: null;

	if (browser && os) return `${browser} on ${os}`;
	return browser ?? os ?? 'unknown device';
}
