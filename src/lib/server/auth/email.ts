import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Transactional email through Resend's HTTP API. Without a key in dev, the message is
// printed to the server console so every flow still works locally.

interface Message {
	to: string;
	subject: string;
	text: string;
}

export function appUrl(): string {
	const url = publicEnv.PUBLIC_APP_URL;
	if (url) return url.replace(/\/$/, '');
	if (dev) return 'http://localhost:5173';
	throw new Error('PUBLIC_APP_URL is not set');
}

export async function sendEmail(message: Message): Promise<void> {
	if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
		if (!dev) throw new Error('RESEND_API_KEY and EMAIL_FROM must be set');
		console.log(`\n[email to ${message.to}] ${message.subject}\n${message.text}\n`);
		return;
	}

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.EMAIL_FROM,
			to: message.to,
			subject: message.subject,
			text: message.text
		})
	});
	if (!response.ok) {
		// Status only. The body can echo the recipient and message.
		throw new Error(`email provider responded ${response.status}`);
	}
}

export function sendVerifyEmail(to: string, name: string, token: string) {
	return sendEmail({
		to,
		subject: 'verify your email · insomnia',
		text: `hi ${name},

confirm this address so insomnia can send you the occasional thing.
the link works for 24 hours, once.

${appUrl()}/verify/${token}

if this wasn't you, ignore it. nothing happens.`
	});
}

export function sendResetEmail(to: string, name: string, token: string) {
	return sendEmail({
		to,
		subject: 'reset your password · insomnia',
		text: `hi ${name},

somebody asked to reset the password for this account. if it was you:

${appUrl()}/reset/${token}

the link works for 1 hour, once. if it wasn't you, ignore it.
your password stays as it is.`
	});
}

export function sendEmailChangedNotice(to: string, name: string, newEmail: string) {
	return sendEmail({
		to,
		subject: 'your email was changed · insomnia',
		text: `hi ${name},

the email on your insomnia account was just changed to ${newEmail}.

if that was you, nothing to do. if it wasn't, reset your password right away.`
	});
}
