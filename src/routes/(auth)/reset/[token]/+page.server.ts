import { fail, redirect } from '@sveltejs/kit';
import { resetPassword, resetTokenIsLive } from '$lib/server/auth/accounts';
import { clientIp } from '$lib/server/auth/session';
import { checkTokenRateLimit } from '$lib/server/rate-limit';
import { fieldErrors, formFields, resetConfirmSchema } from '$lib/server/auth/validation';

export async function load({ params }) {
	return { live: await resetTokenIsLive(params.token) };
}

export const actions = {
	default: async (event) => {
		const raw = formFields(await event.request.formData(), ['password']);
		const parsed = resetConfirmSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });

		const limit = await checkTokenRateLimit(clientIp(event));
		if (!limit.allowed) {
			return fail(429, {
				errors: { _: `too many tries. wait ${limit.retryAfterSeconds} seconds.` }
			});
		}

		const ok = await resetPassword(event.params.token, parsed.data.password);
		if (!ok) return fail(400, { errors: { _: 'that link is used up or expired.' } });
		redirect(303, '/sign-in?reset=1');
	}
};
