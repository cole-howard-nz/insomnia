import { fail, redirect } from '@sveltejs/kit';
import { signUp } from '$lib/server/auth/accounts';
import { clientIp, startSession } from '$lib/server/auth/session';
import { checkSignUpRateLimit } from '$lib/server/rate-limit';
import { fieldErrors, formFields, signUpSchema } from '$lib/server/auth/validation';

export function load({ locals }) {
	if (locals.user) redirect(303, '/map');
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const raw = formFields(form, ['email', 'password', 'displayName']);
		const values = { email: raw.email, displayName: raw.displayName };

		const parsed = signUpSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { values, errors: fieldErrors(parsed.error) });

		const limit = await checkSignUpRateLimit(clientIp(event));
		if (!limit.allowed) {
			return fail(429, {
				values,
				errors: { _: `too many tries. wait ${limit.retryAfterSeconds} seconds.` }
			});
		}

		const result = await signUp(parsed.data);
		if (!result.ok) {
			return fail(400, {
				values,
				errors: { email: 'that email already has an account. try signing in.' }
			});
		}

		await startSession(event, result.userId);
		redirect(303, '/map');
	}
};
