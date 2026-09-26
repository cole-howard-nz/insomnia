import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { SessionInfo, SessionUser } from './session';

const hasControlChar = (value: string) =>
	[...value].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f);

/** Only same-site relative paths are followed after sign-in. */
export function safeNext(next: string | null | undefined): string {
	// Browsers drop tabs and newlines inside URLs, so '/<tab>/host' would become '//host'.
	if (
		!next ||
		hasControlChar(next) ||
		!next.startsWith('/') ||
		next.startsWith('//') ||
		next.startsWith('/\\')
	) {
		return '/map';
	}
	return next;
}

/** For pages and actions that need a signed-in user. Redirects to sign-in otherwise. */
export function requireUser(event: Pick<RequestEvent, 'locals' | 'url'>): {
	user: SessionUser;
	session: SessionInfo;
} {
	const { user, session } = event.locals;
	if (!user || !session) {
		const next = event.url.pathname + event.url.search;
		redirect(303, `/sign-in?next=${encodeURIComponent(next)}`);
	}
	return { user, session };
}

/** Curriculum admin only. Everyone else gets a plain 404, so the route is not advertised. */
export function requireAdmin(event: Pick<RequestEvent, 'locals' | 'url'>) {
	const { user, session } = requireUser(event);
	if (!user.isCurriculumAdmin) error(404, 'Not found');
	return { user, session };
}
