import { fail, redirect } from '@sveltejs/kit';
import { requestPasswordReset } from '$lib/server/auth/accounts';
import { clientIp } from '$lib/server/auth/session';
import { checkResetRateLimit } from '$lib/server/rate-limit';
import { fieldErrors, formFields, resetRequestSchema } from '$lib/server/auth/validation';

export function load({ locals }) {
	if (locals.user) redirect(303, '/me');
}

export const actions = {
	default: async (event) => {
		const raw = formFields(await event.request.formData(), ['email']);
		const parsed = resetRequestSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { email: raw.email, errors: fieldErrors(parsed.error) });

		const limit = await checkResetRateLimit(clientIp(event), parsed.data.email);
		if (!limit.allowed) {
			return fail(429, {
				email: raw.email,
				errors: { _: `too many tries. wait ${limit.retryAfterSeconds} seconds.` }
			});
		}

		await requestPasswordReset(parsed.data.email);
		// Same answer whether or not the account exists.
		return { sent: true };
	}
};
