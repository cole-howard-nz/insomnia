import type { SessionInfo, SessionUser } from '$lib/server/auth/session';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: SessionUser | null;
			session: SessionInfo | null;
		}
		interface PageData {
			user?: SessionUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
