/** "just now", "5 minutes ago", "3 days ago". Computed on the server so hydration matches. */
export function ago(date: Date, now = Date.now()): string {
	const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
	if (seconds < 60) return 'just now';
	const units: Array<[string, number]> = [
		['minute', 60],
		['hour', 3600],
		['day', 86400]
	];
	let label = 'just now';
	for (const [name, size] of units) {
		if (seconds >= size) {
			const n = Math.floor(seconds / size);
			label = `${n} ${name}${n === 1 ? '' : 's'} ago`;
		}
	}
	return label;
}
