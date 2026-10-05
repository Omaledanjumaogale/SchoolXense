import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);
async function sendEmail(to: string, subject: string, url: string) {
	if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) throw new Error('Email delivery is not configured');
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this email.` })
	});
	if (!res.ok) throw new Error('Email delivery failed');
}
export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth({
	appName: 'SchoolXense', baseURL: process.env.SITE_URL ?? 'https://schoolxense.ewinproject.org',
	secret: process.env.BETTER_AUTH_SECRET, database: authComponent.adapter(ctx),
	trustedOrigins: (process.env.AUTH_TRUSTED_ORIGINS ?? 'https://schoolxense.ewinproject.org,https://*.schoolxense.pages.dev,http://127.0.0.1:5173,http://localhost:5173').split(',').map(x => x.trim()),
	emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 12,
		sendResetPassword: async ({ user, url }) => sendEmail(user.email, 'Reset your SchoolXense password', url), revokeSessionsOnPasswordReset: true },
	emailVerification: { sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: false,
		sendVerificationEmail: async ({ user, url }) => sendEmail(user.email, 'Verify your SchoolXense email', url) },
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } : {}),
		...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } } : {})
	},
	session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
	rateLimit: { enabled: true, window: 60, max: 30, storage: 'database' },
	plugins: [convex({ authConfig })]
});
