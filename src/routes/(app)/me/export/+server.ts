import { json } from '@sveltejs/kit';
import { exportUserData } from '$lib/server/data';
import { requireUser } from '$lib/server/auth/guards';

export async function GET(event) {
	const { user } = requireUser(event);
	return json(await exportUserData(user.id), {
		headers: {
			'Content-Disposition': 'attachment; filename="insomnia-export.json"',
			'Cache-Control': 'no-store'
		}
	});
}
