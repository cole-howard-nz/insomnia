import { z } from 'zod';
import { PASSWORD_MAX, passwordProblem } from './password-policy';

export const email = z
	.string()
	.trim()
	.toLowerCase()
	.min(3, 'enter your email.')
	.max(254, 'that email is too long.')
	.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "that doesn't look like an email.");

export const displayName = z
	.string()
	.trim()
	.min(1, 'pick a name. any name.')
	.max(40, '40 characters at most.');

export const newPassword = z
	.string()
	.max(PASSWORD_MAX, `${PASSWORD_MAX} characters at most.`)
	.superRefine((value, ctx) => {
		const problem = passwordProblem(value);
		if (problem) ctx.addIssue({ code: 'custom', message: problem });
	});

/** Current-password fields only need to be present. Never reveal policy on sign-in. */
export const anyPassword = z.string().min(1, 'enter your password.').max(1024);

export const signUpSchema = z.object({ email, password: newPassword, displayName });
export const signInSchema = z.object({ email, password: anyPassword });
export const resetRequestSchema = z.object({ email });
export const resetConfirmSchema = z.object({ password: newPassword });
export const displayNameSchema = z.object({ displayName });
export const changeEmailSchema = z.object({ email, password: anyPassword });
export const changePasswordSchema = z.object({
	currentPassword: anyPassword,
	newPassword
});
export const passwordOnlySchema = z.object({ password: anyPassword });

/** Flattens zod issues to one message per field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? '_');
		out[key] ??= issue.message;
	}
	return out;
}

/** Reads named string fields from a submitted form. */
export function formFields(form: FormData, names: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const name of names) {
		const value = form.get(name);
		out[name] = typeof value === 'string' ? value : '';
	}
	return out;
}
