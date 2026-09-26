import { env } from '$env/dynamic/public';

export function load() {
	// Set PUBLIC_CONTACT_EMAIL before launch. Until then the pages simply leave the line out.
	return { contactEmail: env.PUBLIC_CONTACT_EMAIL || null };
}
