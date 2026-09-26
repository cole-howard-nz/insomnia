import { exportUserZip } from '$lib/server/data';
import { requireUser } from '$lib/server/auth/guards';

/** Everything, recordings included, as a zip. The plain JSON export stays one level up. */
export async function GET(event) {
	const { user } = requireUser(event);
	return new Response(await exportUserZip(user.id), {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="insomnia-export.zip"',
			'Cache-Control': 'no-store'
		}
	});
}
