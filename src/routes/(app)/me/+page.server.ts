import { fail, redirect } from '@sveltejs/kit';
import {
	changeDisplayName,
	changeEmail,
	changePassword,
	deleteAccount,
	sendVerification
} from '$lib/server/auth/accounts';
import { ago } from '$lib/format';
import { requireUser } from '$lib/server/auth/guards';
import { updateSettings } from '$lib/server/data';
import {
	deleteSessionTokenCookie,
	invalidateAllUserSessions,
	invalidateSession,
	listSessions
} from '$lib/server/auth/session';
import {
	changeEmailSchema,
	changePasswordSchema,
	displayNameSchema,
	fieldErrors,
	formFields,
	passwordOnlySchema
} from '$lib/server/auth/validation';
import { checkResendRateLimit, checkSensitiveRateLimit } from '$lib/server/rate-limit';

export async function load(event) {
	const { user, session } = requireUser(event);
	const sessions = await listSessions(user.id, session.id);
	return {
		sessions: sessions.map((s) => ({
			id: s.id,
			deviceLabel: s.deviceLabel,
			current: s.current,
			lastSeen: ago(s.lastSeenAt)
		}))
	};
}

const tooMany = (action: string, seconds: number) =>
	fail(429, { action, errors: { _: `too many tries. wait ${seconds} seconds.` } });

export const actions = {
	name: async (event) => {
		const { user } = requireUser(event);
		const raw = formFields(await event.request.formData(), ['displayName']);
		const parsed = displayNameSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { action: 'name', errors: fieldErrors(parsed.error) });
		await changeDisplayName(user.id, parsed.data.displayName);
		return { action: 'name', done: true };
	},

	email: async (event) => {
		const { user } = requireUser(event);
		const raw = formFields(await event.request.formData(), ['email', 'password']);
		const parsed = changeEmailSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				action: 'email',
				values: { email: raw.email },
				errors: fieldErrors(parsed.error)
			});
		}
		const limit = await checkSensitiveRateLimit(user.id);
		if (!limit.allowed) return tooMany('email', limit.retryAfterSeconds);

		const result = await changeEmail(user.id, parsed.data.email, parsed.data.password);
		if (!result.ok) {
			const errors =
				result.reason === 'password'
					? { password: 'that password is wrong.' }
					: { email: 'that email already has an account.' };
			return fail(400, { action: 'email', values: { email: raw.email }, errors });
		}
		return { action: 'email', done: true };
	},

	password: async (event) => {
		const { user, session } = requireUser(event);
		const raw = formFields(await event.request.formData(), ['currentPassword', 'newPassword']);
		const parsed = changePasswordSchema.safeParse(raw);
		if (!parsed.success)
			return fail(400, { action: 'password', errors: fieldErrors(parsed.error) });
		const limit = await checkSensitiveRateLimit(user.id);
		if (!limit.allowed) return tooMany('password', limit.retryAfterSeconds);

		const ok = await changePassword(
			user.id,
			parsed.data.currentPassword,
			parsed.data.newPassword,
			session.id
		);
		if (!ok) {
			return fail(400, {
				action: 'password',
				errors: { currentPassword: 'that password is wrong.' }
			});
		}
		return { action: 'password', done: true };
	},

	resend: async (event) => {
		const { user } = requireUser(event);
		if (user.emailVerified) return { action: 'resend', done: true };
		const limit = await checkResendRateLimit(user.id);
		if (!limit.allowed) return tooMany('resend', limit.retryAfterSeconds);
		await sendVerification(user);
		return { action: 'resend', done: true };
	},

	rain: async (event) => {
		const { user } = requireUser(event);
		const on = (await event.request.formData()).get('on') === '1';
		await updateSettings(user.id, { rainSound: on });
		return { action: 'rain', done: true };
	},

	signOut: async (event) => {
		const { session } = requireUser(event);
		await invalidateSession(session.id);
		deleteSessionTokenCookie(event);
		redirect(303, '/sign-in');
	},

	signOutAll: async (event) => {
		const { user } = requireUser(event);
		await invalidateAllUserSessions(user.id);
		deleteSessionTokenCookie(event);
		redirect(303, '/sign-in');
	},

	delete: async (event) => {
		const { user } = requireUser(event);
		const raw = formFields(await event.request.formData(), ['password']);
		const parsed = passwordOnlySchema.safeParse(raw);
		if (!parsed.success) return fail(400, { action: 'delete', errors: fieldErrors(parsed.error) });
		const limit = await checkSensitiveRateLimit(user.id);
		if (!limit.allowed) return tooMany('delete', limit.retryAfterSeconds);

		if (!(await deleteAccount(user.id, parsed.data.password))) {
			return fail(400, { action: 'delete', errors: { password: 'that password is wrong.' } });
		}
		deleteSessionTokenCookie(event);
		redirect(303, '/?deleted=1');
	}
};
