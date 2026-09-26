import { redirect } from '@sveltejs/kit';

// The landing page arrives in phase 4. Until then the app opens on the map.
export function load() {
	redirect(307, '/map');
}
