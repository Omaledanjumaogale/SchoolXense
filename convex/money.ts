/**
 * money.* — Hive Share settlement, escrow release, payouts.
 * Flutterwave moves the money; Convex decides who owns it.
 */
import { v, ConvexError } from 'convex/values';
import { internalMutation, internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { withAccess, audit } from './lib/access';
import { post, systemWallet, userWallet, balance } from './lib/ledger';
import { split, splitByRules, type TxnKind } from '../src/lib/engines/hiveShare';
import type { Id } from './_generated/dataModel';
import { workflows } from './components';
import { planById } from '../src/lib/payments/plans';
import { entitlement } from './lib/entitlements';

const KIND: Record<string, TxnKind> = { booking: 'session', cohort: 'session', pack: 'pack', contract: 'collab', subscription: 'subscription', exam_pass: 'subscription', invoice: 'licence' };
const ESCROWED = new Set(['booking', 'cohort', 'contract']);

/** Called by the payment-events Queue consumer AFTER it re-verified the transaction with Flutterwave. Idempotent on flwTxId. */
export const settlePayment = internalMutation({
	args: { txRef: v.string(), flwTxId: v.string(), amountKobo: v.int64(), currency: v.string(), method: v.optional(v.string()) },
	handler: async (ctx, a) => {
		const dup = await ctx.db.query('payments').withIndex('by_flwTxId', (q) => q.eq('flwTxId', a.flwTxId)).unique();
		if (dup) { if(dup.txRef!==a.txRef)throw new ConvexError('TRANSACTION_REFERENCE_MISMATCH');return { ok: true, duplicate: true }; }
		const p = await ctx.db.query('payments').withIndex('by_txRef', (q) => q.eq('txRef', a.txRef)).unique();
		if (!p) throw new ConvexError('UNKNOWN_TX_REF');
		if (p.status !== 'pending') return { ok: true, duplicate: true };
		if (a.amountKobo !== p.amount || a.currency !== p.currency) throw new ConvexError('AMOUNT_OR_CURRENCY_MISMATCH');
		if (!p.refId || !KIND[p.purpose]) throw new ConvexError('Invalid order purpose.');
		if(p.purpose==='booking'){const booking=await ctx.db.get(p.refId as Id<'bookings'>);if(booking?.status!=='pending_payment'||booking.price!==p.amount)throw new ConvexError('Booking requires manual reconciliation.');}
		await ctx.db.patch(p._id, { status: 'successful', flwTxId: a.flwTxId, method: a.method });
		const payer=await ctx.db.get(p.userId);
		await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'payment.verified',subject:payer?.ecosystemId??`schoolxense:${p.userId}`,payload:{version:1,orderId:p._id,txRef:p.txRef,providerTransactionId:a.flwTxId,amountKobo:p.amount.toString(),currency:p.currency,purpose:p.purpose,referralCode:payer?.centralReferralCode},createdAt:Date.now()});

		const recipients = await recipientsFor(ctx, p);
		const s = split({ kind: KIND[p.purpose] ?? 'session', grossKobo: Number(p.amount), hasReferrer: !!recipients.referrer, hasCollabPartner: !!recipients.collab });
		const txn = `settle:${a.flwTxId}`;
		const clearing = await systemWallet(ctx, 'clearing');
		if (ESCROWED.has(p.purpose)) {
			const escrow = await systemWallet(ctx, 'escrow');
			await post(ctx, txn, [{ walletId: clearing, amount: -p.amount, kind: 'clearing', memo: p.txRef }, { walletId: escrow, amount: p.amount, kind: 'escrow', memo: `Held: ${p.purpose}` }], p._id);
			await ctx.db.insert('escrows', { paymentId: p._id, refKind: p.purpose === 'contract' ? 'milestone' : p.purpose, refId: p.refId!, amount: p.amount, currency: p.currency, status: 'held', releaseAfter: Date.now() + 30 * 86_400_000, split: s, recipients });
		} else {
			await post(ctx, txn, [{ walletId: clearing, amount: -p.amount, kind: 'clearing', memo: p.txRef }, ...(await sliceRows(ctx, s, recipients, p.purpose))], p._id);
		}
		await workflows.start(ctx, internal.components.fulfilPayment, { paymentId: p._id });
		return { ok: true };
	}
});

async function recipientsFor(ctx: any, p: any): Promise<Record<string, Id<'users'> | undefined>> {
	if (p.purpose === 'booking') {
		const b = await ctx.db.get(p.refId as Id<'bookings'>);
		const tutor = await ctx.db.get(b.tutorId);
		const learner = await ctx.db.get(b.learnerId);
		return { earner: b.tutorId, referrer: tutor?.referredBy ?? learner?.referredBy, collab: b.handoffFrom };
	}
	if (p.purpose === 'pack') { const pk = await ctx.db.get(p.refId as Id<'packs'>); const a = await ctx.db.get(pk.authorId); return { earner: pk.authorId, referrer: a?.referredBy }; }
	if (p.purpose === 'cohort') { const c = await ctx.db.get(p.refId as Id<'cohorts'>); return { earner: c.hostId }; }
	const payer = await ctx.db.get(p.userId);
	return { referrer: payer?.referredBy };
}

async function sliceRows(ctx: any, s: Record<string, number>, r: Record<string, Id<'users'> | undefined>, memo: string) {
	const W = async (u?: Id<'users'>, sys = 'platform') => (u ? userWallet(ctx, u) : systemWallet(ctx, sys));
	return [
		{ walletId: await W(r.earner), amount: BigInt(s.earner), kind: 'earner', memo },
		{ walletId: await systemWallet(ctx, 'platform'), amount: BigInt(s.platform), kind: 'platform', memo },
		{ walletId: await W(r.referrer), amount: BigInt(s.referrer), kind: 'referrer', memo },
		{ walletId: await W(r.collab), amount: BigInt(s.collab), kind: 'collab', memo },
		{ walletId: await systemWallet(ctx, 'impact'), amount: BigInt(s.impact), kind: 'impact', memo },
		{ walletId: await systemWallet(ctx, 'royalty_pool'), amount: BigInt(s.royalty), kind: 'royalty', memo },
		{ walletId: await systemWallet(ctx, 'processing'), amount: BigInt(s.processing), kind: 'processing', memo }
	];
}

export const afterPayment = internalMutation({
	args: { paymentId: v.id('payments') },
	handler: async (ctx, { paymentId }) => {
		const p = (await ctx.db.get(paymentId))!;
		if(!p||p.status!=='successful'||p.fulfilledAt)return;
		if (p.purpose === 'booking') await ctx.db.patch(p.refId as Id<'bookings'>, { status: 'confirmed' });
		if (p.purpose === 'subscription' || p.purpose === 'exam_pass') {
			const [planId, forUser] = (p.refId ?? '').split(':');
			const plan=planById(planId);if(!plan?.purchasable||p.currency!=='NGN'||plan.priceKobo!==Number(p.amount))throw new ConvexError('Subscription payment requires reconciliation.');
			const beneficiary=(forUser || p.userId) as Id<'users'>;
			if(beneficiary!==p.userId){const links=await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',beneficiary)).collect();if(!links.some(x=>x.guardianId===p.userId))throw new ConvexError('Subscription payment ownership requires reconciliation.');}
			const existing=await ctx.db.query('subscriptions').withIndex('by_user',q=>q.eq('userId',beneficiary)).order('desc').first();
			const now=Date.now(),current=await entitlement(ctx,beneficiary,now),carry=current.active&&existing?.planId===planId?existing.until:0,until=Math.max(now,carry)+plan.durationDays*86_400_000;
			let subscriptionId;if(existing){subscriptionId=existing._id;await ctx.db.patch(existing._id,{planId,until,paidBy:p.userId,status:'active',renewedAt:now,cancelAtPeriodEnd:false,cancelledAt:undefined,sourcePaymentId:paymentId});}
			else subscriptionId=await ctx.db.insert('subscriptions', { userId: beneficiary, planId, until, paidBy: p.userId,status:'active',startedAt:now,cancelAtPeriodEnd:false,sourcePaymentId:paymentId });
			await ctx.scheduler.runAt(until,internal.subscriptions.expire,{id:subscriptionId,expectedUntil:until});
		}
		if(p.purpose==='pack'&&p.refId){await ctx.db.insert('purchases',{userId:p.userId,packId:p.refId as Id<'packs'>,paymentId});}
		if(p.purpose==='cohort'&&p.refId){const cohort=await ctx.db.get(p.refId as Id<'cohorts'>);if(!cohort)throw new ConvexError('Cohort requires reconciliation.');const seats=await ctx.db.query('cohortSeats').withIndex('by_cohort',q=>q.eq('cohortId',cohort._id)).collect();if(seats.length>=cohort.seats&&!seats.some(x=>x.userId===p.userId))throw new ConvexError('Cohort capacity requires reconciliation.');if(!seats.some(x=>x.userId===p.userId))await ctx.db.insert('cohortSeats',{cohortId:cohort._id,userId:p.userId,paymentId});}
		if (p.purpose === 'invoice') await ctx.db.patch(p.refId as Id<'invoices'>, { status: 'paid' });
		await ctx.db.patch(paymentId,{fulfilledAt:Date.now()});
		await ctx.db.insert('notifications',{userId:p.userId,title:'Payment verified',body:'Your '+p.purpose+' payment has been verified and access updated.',href:'/wallet',read:false});
	}
});

/** escrow.release — learner confirmation, or the cron 48h after delivery. Shares never paid on refunded/disputed money. */
export const releaseEscrow = internalMutation({
	args: { escrowId: v.id('escrows') },
	handler: async (ctx, { escrowId }) => {
		const e = await ctx.db.get(escrowId);
		if (!e || e.status !== 'held') return;
		const escrow = await systemWallet(ctx, 'escrow');
		let rows = await sliceRows(ctx, e.split, e.recipients, `${e.refKind} released`);
		if (e.refKind === 'cohort') {
			const c = (await ctx.db.get(e.refId as Id<'cohorts'>))!;
			const hosts = await ctx.db.query('splitRules').withIndex('by_team', (q) => q.eq('teamId', e.refId as unknown as Id<'teams'>)).collect();
			const rules = hosts.length ? hosts.map((h) => ({ memberId: h.userId, bp: h.bp })) : [{ memberId: c.hostId, bp: 10_000 }];
			const parts = splitByRules(e.split.earner, rules);
			rows = rows.filter((r) => r.kind !== 'earner');
			for (const pt of parts) rows.push({ walletId: await userWallet(ctx, pt.memberId as Id<'users'>), amount: BigInt(pt.kobo), kind: 'earner', memo: `Cohort · ${c.title}` });
		}
		await post(ctx, `release:${escrowId}`, [{ walletId: escrow, amount: -e.amount, kind: 'escrow', memo: 'release' }, ...rows], e.paymentId);
		await ctx.db.patch(escrowId, { status: 'released' });
	}
});

export const releaseDue = internalMutation({
	args: {},
	handler: async (ctx) => {
		const due = await ctx.db.query('escrows').withIndex('by_status_release', (q) => q.eq('status', 'held').lt('releaseAfter', Date.now())).take(200);
		for (const e of due) {
			if (e.refKind !== 'booking') continue;
			const b = await ctx.db.get(e.refId as Id<'bookings'>);
			if (b?.status === 'delivered') { await ctx.scheduler.runAfter(0, internal.money.releaseEscrow, { escrowId: e._id }); await ctx.db.patch(b._id, { status: 'released' }); }
		}
	}
});

export const myWallet = withAccess().query({
	args: {},
	handler: async (ctx) => {
		const w = await ctx.db.query('wallets').withIndex('by_owner', (q) => q.eq('ownerUserId', ctx.user._id)).unique();
		if (!w) return { available: 0n, entries: [] };
		const entries = await ctx.db.query('ledgerEntries').withIndex('by_wallet', (q) => q.eq('walletId', w._id)).order('desc').take(100);
		return { available: await balance(ctx, w._id), entries };
	}
});

export const requestPayout = withAccess({ adultOnly: true }).mutation({
	args: { amountKobo: v.int64() },
	handler: async (ctx, { amountKobo }) => {
		if (amountKobo < 200_000n) throw new ConvexError('MIN_2000');
		const acct = await ctx.db.query('payoutAccounts').withIndex('by_user', (q) => q.eq('userId', ctx.user._id)).unique();
		if (!acct?.nameMatched) throw new ConvexError('NO_MATCHED_ACCOUNT');
		const w = await userWallet(ctx, ctx.user._id);
		if ((await balance(ctx, w)) < amountKobo) throw new ConvexError('INSUFFICIENT_FUNDS');
		const reference = `SH-PO-${Date.now().toString(36).toUpperCase()}`;
		await post(ctx, `payout:${reference}`, [{ walletId: w, amount: -amountKobo, kind: 'payout', memo: reference }, { walletId: await systemWallet(ctx, 'payouts_out'), amount: amountKobo, kind: 'payout', memo: reference }]);
		await ctx.db.insert('payouts', { userId: ctx.user._id, amount: amountKobo, status: amountKobo > 50_000_000n ? 'awaiting_approval' : 'queued', reference, approvals: [] });
		await audit(ctx, ctx.user._id, 'payouts.request', reference);
	}
});

export const queuedPayouts = internalQuery({ args: {}, handler: (ctx) => ctx.db.query('payouts').withIndex('by_status', (q) => q.eq('status', 'queued')).take(500) });

/** Daily 18:00 WAT: batch queued payouts into one Flutterwave bulk transfer; transfer webhooks close each payout. */
export const runPayouts = internalAction({
	args: {},
	handler: async (ctx) => {
		// Bank recipient storage and transfer reconciliation require a separate activation gate.
		if (process.env.PAYOUTS_ENABLED !== 'true' || !process.env.FLW_SECRET_KEY) return;
		const queued = await ctx.runQuery(internal.money.queuedPayouts, {});
		if (!queued.length) return;
		const res = await fetch('https://api.flutterwave.com/v3/bulk-transfers', {
			method: 'POST',
			headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: `SchoolXense payouts ${new Date().toISOString().slice(0, 10)}`, bulk_data: queued.map((p) => ({ amount: Number(p.amount) / 100, currency: 'NGN', reference: p.reference, narration: 'SchoolXense earnings' })) })
		});
		await ctx.runMutation(internal.money.markProcessing, { ids: queued.map((p) => p._id), ok: res.ok });
	}
});
export const markProcessing = internalMutation({ args: { ids: v.array(v.id('payouts')), ok: v.boolean() }, handler: async (ctx, { ids, ok }) => { for (const id of ids) await ctx.db.patch(id, { status: ok ? 'processing' : 'queued' }); } });

/** transfer.completed webhook → paid, or return funds to the wallet on failure. */
export const closePayout = internalMutation({
	args: { reference: v.string(), success: v.boolean(), flwTransferId: v.string() },
	handler: async (ctx, a) => {
		const p = await ctx.db.query('payouts').withIndex('by_reference', (q) => q.eq('reference', a.reference)).unique();
		if (!p || p.status === 'paid' || p.status === 'failed') return;
		if (a.success) return ctx.db.patch(p._id, { status: 'paid', flwTransferId: a.flwTransferId });
		await post(ctx, `payout-fail:${a.reference}`, [{ walletId: await systemWallet(ctx, 'payouts_out'), amount: -p.amount, kind: 'payout', memo: 'returned' }, { walletId: await userWallet(ctx, p.userId), amount: p.amount, kind: 'payout', memo: `Returned ${a.reference}` }]);
		await ctx.db.patch(p._id, { status: 'failed' });
	}
});

/** Two-person rule for manual payouts above ₦500,000. */
export const approvePayout = withAccess({ role: 'staff' }).mutation({
	args: { payoutId: v.id('payouts') },
	handler: async (ctx, { payoutId }) => {
		const p = (await ctx.db.get(payoutId))!;
		if(!p||p.status!=='awaiting_approval'||p.userId===ctx.user._id||p.approvals.includes(ctx.user._id))throw new ConvexError('An independent approval on an awaiting payout is required.');
		const approvals = [...new Set([...p.approvals, ctx.user._id])];
		await ctx.db.patch(payoutId, { approvals, status: approvals.length >= 2 ? 'queued' : p.status });
		await audit(ctx, ctx.user._id, 'payouts.approve', p.reference, `${approvals.length}/2`);
	}
});
