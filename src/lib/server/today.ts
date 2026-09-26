import type { Cookies } from '@sveltejs/kit';
import { todayIn } from '$lib/progress/streak';

/** The client sets this cookie to its IANA timezone. Until it has, days are UTC days. */
export const TZ_COOKIE = 'tz';

/** Today's local date (YYYY-MM-DD) for the person making the request. */
export function userToday(cookies: Cookies, now = Date.now()): string {
	return todayIn(cookies.get(TZ_COOKIE) ?? 'UTC', now);
}
