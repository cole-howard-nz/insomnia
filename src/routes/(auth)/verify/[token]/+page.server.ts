import { fail } from '@sveltejs/kit';
import { verifyEmail } from '$lib/server/auth/accounts';
import { clientIp } from '$lib/server/auth/session';
import { checkTokenRateLimit } from '$lib/server/rate-limit';

// Spending the token needs a POST, so mail scanners that prefetch links cannot burn it.
export const actions = {
	default: async (event) => {
		const limit = await checkTokenRateLimit(clientIp(event));
		if (!limit.allowed) return fail(429, { failed: true });
		return (await verifyEmail(event.params.token))
			? { verified: true }
			: fail(400, { failed: true });
	}
};
