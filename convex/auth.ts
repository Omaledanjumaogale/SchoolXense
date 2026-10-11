import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth/minimal';
import { components,internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';
import { authRateLimitStorage } from './authRateLimit';
import {transactionText} from '../src/lib/i18n/transactions';

export const authComponent = createClient<DataModel>(components.betterAuth);
async function sendEmail(ctx:GenericCtx<DataModel>,to: string, kind:'verify'|'reset', url: string,locale='en') {
	if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) throw new Error('Email delivery is not configured');
	const text=transactionText(locale),subject=text[kind];
	const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json','Idempotency-Key':await hash(kind+':'+url) },
		body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, text: `${subject}\n\n${url}\n\n${text.ignore}` }),signal:AbortSignal.timeout(15000)
	});
	if (!res.ok) throw new Error('Email delivery failed');
	const result=await res.json();if(!result.id)throw new Error('Email provider did not confirm acceptance.');
	if('runMutation' in ctx)await ctx.runMutation(internal.emailDelivery.record,{providerId:result.id,kind,recipientHash:await hash(to.toLowerCase())});
}
export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth({
	appName: 'SchoolXense', baseURL: process.env.SITE_URL ?? 'https://schoolxense.ewinproject.org',
	secret: process.env.BETTER_AUTH_SECRET, database: authComponent.adapter(ctx),
	trustedOrigins: (process.env.AUTH_TRUSTED_ORIGINS ?? 'https://schoolxense.ewinproject.org,https://*.schoolxense.pages.dev,http://127.0.0.1:5173,http://localhost:5173').split(',').map(x => x.trim()),
	emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 12,
		sendResetPassword: async ({ user, url },request) => sendEmail(ctx,user.email,'reset',url,request?.headers.get('accept-language')?.split(',')[0]??'en'), revokeSessionsOnPasswordReset: true },
	emailVerification: { sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: false,
		sendVerificationEmail: async ({ user, url },request) => sendEmail(ctx,user.email,'verify',url,request?.headers.get('accept-language')?.split(',')[0]??'en') },
	socialProviders: {
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } } : {}),
		...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } } : {})
	},
	session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
	rateLimit: { enabled: true, window: 60, max: 30, customStorage: authRateLimitStorage(ctx) },
	plugins: [convex({ authConfig })]
});
