import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import {
	SESSION_COOKIE_NAME,
	deleteSessionTokenCookie,
	setSessionTokenCookie,
	validateSessionToken
} from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	event.locals.user = null;
	event.locals.session = null;

	if (token) {
		const { session, user, renewed } = await validateSessionToken(token);
		if (session) {
			// Sliding expiry: push the cookie's date out whenever the row was renewed.
			if (renewed) setSessionTokenCookie(event, token, session.expiresAt);
			event.locals.session = session;
			event.locals.user = user;
		} else {
			deleteSessionTokenCookie(event);
		}
	}

	// Everything under the (app) route group needs a session: pages, loads, actions and
	// endpoints alike. Checked here so no load or action can forget it.
	if (!event.locals.user && event.route.id?.startsWith('/(app)')) {
		const next = event.url.pathname + event.url.search;
		redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
	}

	return resolve(event);
};
