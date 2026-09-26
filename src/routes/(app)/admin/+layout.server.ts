import { requireAdmin } from '$lib/server/auth/guards';

// Owner only. The flag is set by hand in the database, there is no UI to grant it.
export function load(event) {
	requireAdmin(event);
}
