import { invalidateAll } from '$app/navigation';
import { pushToast } from '$lib/toast.svelte';

// Writes go one at a time and in order, so a quick run of ticks cannot land out of order.
let queue: Promise<unknown> = Promise.resolve();

/**
 * Sends a JSON POST after any earlier one. On failure the app reloads its data (so the screen
 * matches the server again), says so, and resolves to null.
 */
export function send<T>(url: string, body: unknown): Promise<T | null> {
	const run = queue.then(async () => {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(String(res.status));
		return (await res.json()) as T;
	});
	queue = run.catch(() => undefined);
	return run.catch(async () => {
		pushToast('something broke. not you. try again.', 'error');
		await invalidateAll();
		return null;
	});
}
