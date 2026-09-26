import { fail, redirect } from '@sveltejs/kit';
import { authenticate } from '$lib/server/auth/accounts';
import { safeNext } from '$lib/server/auth/guards';
import { checkSignInRateLimit } from '$lib/server/rate-limit';
import { clientIp, startSession } from '$lib/server/auth/session';
import { fieldErrors, formFields, signInSchema } from '$lib/server/auth/validation';

export function load({ locals, url }) {
	const next = url.searchParams.get('next');
	if (locals.user) redirect(303, safeNext(next));
	return { next: next ?? '', justReset: url.searchParams.has('reset') };
}

export const actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const raw = formFields(form, ['email', 'password', 'next']);
		const parsed = signInSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { email: raw.email, errors: fieldErrors(parsed.error) });
		}

		const limit = await checkSignInRateLimit(clientIp(event), parsed.data.email);
		if (!limit.allowed) {
			return fail(429, {
				email: raw.email,
				errors: { _: `too many tries. wait ${limit.retryAfterSeconds} seconds.` }
			});
		}

		const user = await authenticate(parsed.data.email, parsed.data.password);
		if (!user) {
			return fail(400, { email: raw.email, errors: { _: 'email or password incorrect.' } });
		}

		await startSession(event, user.id);
		redirect(303, safeNext(raw.next));
	}
};
