import { action, internalMutation } from './_generated/server';
import { api, internal } from './_generated/api';
import { v, ConvexError } from 'convex/values';
import { withAccess, resolve, audit } from './lib/access';
import { rateLimiter } from './rateLimits';
import {korapay} from '../src/lib/payments/gateways';
import {encryptAccount} from './lib/bankEncryption';

export const eligible = withAccess({ adultOnly: true }).query({ args: {}, handler: ctx => ({ name: ctx.user.name,userId:ctx.user._id,email:ctx.user.email }) });
export const mine = withAccess({ adultOnly: true }).query({ args: {}, handler: async ctx => {
	const account = await ctx.db.query('payoutAccounts').withIndex('by_user', q => q.eq('userId', ctx.user._id)).unique();
	return account ? { bankName: account.bankName, accountName: account.accountName, accountLast4: account.accountLast4, verified: account.nameMatched && !!account.flwRecipientRef } : null;
} });
async function provider(path: string, body?: unknown) {
	if (!process.env.FLW_SECRET_KEY?.startsWith('FLWSECK')) throw new ConvexError('Valid Flutterwave v3 credentials are required.');
	const response = await fetch('https://api.flutterwave.com/v3' + path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
	const result = await response.json();
	if (!response.ok || result.status !== 'success') throw new ConvexError('Bank verification provider is unavailable.');
	return result.data;
}
export const banks = action({ args: {}, handler: async ctx => {
	await ctx.runQuery(api.payoutAccounts.eligible, {});
	const rows = process.env.PAYOUT_PROVIDER==='korapay'?await korapay<{code:string;name:string}[]>(process.env,'/misc/banks?countryCode=NG',undefined,true):await provider('/banks/NG') as { code: string; name: string }[];
	return rows.map(({ code, name }) => ({ code, name }));
} });
export function sameAccountName(profile: string, bank: string) {
	const normalize = (name: string) => name.toLocaleLowerCase('en').normalize('NFKD').replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean).sort().join(' ');
	return normalize(profile).length >= 3 && normalize(profile) === normalize(bank);
}
export const save = internalMutation({ args: { bankCode: v.string(), bankName: v.string(), accountLast4: v.string(), accountName: v.string(), recipient: v.string(),gateway:v.optional(v.literal('korapay')),ciphertext:v.optional(v.string()),iv:v.optional(v.string()) }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx, { adultOnly: true });
	if (!sameAccountName(user.name, args.accountName) || !(args.gateway==='korapay'?args.recipient==='korapay:'+user._id&&!!args.ciphertext&&!!args.iv:/^\d+$/.test(args.recipient)) || !/^\d{4}$/.test(args.accountLast4)) throw new ConvexError('BANK_ACCOUNT_NAME_MISMATCH');
	const pending = await ctx.db.query('payouts').withIndex('by_user', q => q.eq('userId', user._id)).filter(q => q.and(q.neq(q.field('status'), 'paid'), q.neq(q.field('status'), 'failed'))).first();
	if (pending) throw new ConvexError('Resolve pending payouts before changing the bank account.');
	const previous = await ctx.db.query('payoutAccounts').withIndex('by_user', q => q.eq('userId', user._id)).unique();
	const values = { userId: user._id, bankCode: args.bankCode, bankName: args.bankName, accountLast4: args.accountLast4, accountName: args.accountName, nameMatched: true, flwRecipientRef: args.recipient,gateway:args.gateway,ciphertext:args.ciphertext,iv:args.iv };
	if (previous) await ctx.db.patch(previous._id, values); else await ctx.db.insert('payoutAccounts', values);
	await audit(ctx, user._id, 'bank.verified', user._id, 'Provider name match and beneficiary recorded.');
} });
export const onboard = action({ args: { bankCode: v.string(), accountNumber: v.string() }, handler: async (ctx, args): Promise<void> => {
	const profile = await ctx.runQuery(api.payoutAccounts.eligible, {});
	if (!/^\d{3,6}$/.test(args.bankCode) || !/^\d{10}$/.test(args.accountNumber)) throw new ConvexError('Check the bank and ten-digit account number.');
	const identity = await ctx.auth.getUserIdentity();
	await rateLimiter.limit(ctx, 'bankOnboarding', { key: identity?.subject, throws: true });
	if(process.env.PAYOUT_PROVIDER==='korapay'){
	 const banks=await korapay<{code:string;name:string}[]>(process.env,'/misc/banks?countryCode=NG',undefined,true);const bank=banks.find(x=>x.code===args.bankCode);if(!bank)throw new ConvexError('Unsupported bank.');
	 const resolved=await korapay<{account_name:string;account_number:string}>(process.env,'/misc/banks/resolve',{bank:args.bankCode,account:args.accountNumber,currency:'NGN'},true);
	 if(resolved.account_number!==args.accountNumber||!sameAccountName(profile.name,resolved.account_name))throw new ConvexError('BANK_ACCOUNT_NAME_MISMATCH');
	 const encrypted=await encryptAccount(args.accountNumber,profile.userId);
	 await ctx.runMutation(internal.payoutAccounts.save,{bankCode:args.bankCode,bankName:bank.name,accountLast4:args.accountNumber.slice(-4),accountName:resolved.account_name,recipient:'korapay:'+profile.userId,gateway:'korapay',...encrypted});return;
	}
	const banks = await provider('/banks/NG') as { code: string; name: string }[];
	const bank = banks.find(bank => bank.code === args.bankCode);
	if (!bank) throw new ConvexError('Unsupported bank.');
	const resolved = await provider('/accounts/resolve', { account_bank: args.bankCode, account_number: args.accountNumber });
	if (!sameAccountName(profile.name, resolved.account_name)) throw new ConvexError('Bank account name must match your verified profile.');
	const recipient = await provider('/beneficiaries', { account_bank: args.bankCode, account_number: args.accountNumber, beneficiary_name: resolved.account_name, currency: 'NGN' });
	await ctx.runMutation(internal.payoutAccounts.save, { bankCode: args.bankCode, bankName: bank.name, accountLast4: args.accountNumber.slice(-4), accountName: resolved.account_name, recipient: String(recipient.id) });
} });
