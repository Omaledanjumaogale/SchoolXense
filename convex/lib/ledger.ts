/** Double-entry ledger helpers — every money mutation writes all rows in ONE transaction; rows sum to zero. */
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';

export async function systemWallet(ctx: MutationCtx, system: string) {
	const w = await ctx.db.query('wallets').withIndex('by_system', (q) => q.eq('system', system)).unique();
	return w?._id ?? (await ctx.db.insert('wallets', { system, currency: 'NGN' }));
}
export async function userWallet(ctx: MutationCtx, userId: Id<'users'>) {
	const w = await ctx.db.query('wallets').withIndex('by_owner', (q) => q.eq('ownerUserId', userId)).unique();
	return w?._id ?? (await ctx.db.insert('wallets', { ownerUserId: userId, currency: 'NGN' }));
}

export async function post(ctx: MutationCtx, txnId: string, rows: { walletId: Id<'wallets'>; amount: bigint; kind: string; memo: string }[], sourcePaymentId?: Id<'payments'>) {
	const sum = rows.reduce((s, r) => s + r.amount, 0n);
	if (sum !== 0n) throw new ConvexError(`LEDGER_IMBALANCE ${sum}`);
	const now = Date.now();
	for (const r of rows) if (r.amount !== 0n) {
		const entryId=await ctx.db.insert('ledgerEntries', { txnId, walletId: r.walletId, amount: r.amount, currency: 'NGN', kind: r.kind, memo: r.memo, sourcePaymentId, createdAt: now });
		if(r.amount>0n&&['referral','referrer','ambassador','override'].includes(r.kind)){
			const wallet=await ctx.db.get(r.walletId);const owner=wallet?.ownerUserId&&await ctx.db.get(wallet.ownerUserId);
			if(owner)await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'commission.credited',subject:owner.ecosystemId??`schoolxense:${owner._id}`,payload:{version:1,entryId,amountKobo:r.amount.toString(),currency:'NGN',orderId:sourcePaymentId,referralCode:owner.centralReferralCode},createdAt:now});
		}
	}
}

export async function balance(ctx: { db: QueryCtx['db'] }, walletId: Id<'wallets'>) {
	let s = 0n;
	for await (const e of ctx.db.query('ledgerEntries').withIndex('by_wallet', (q) => q.eq('walletId', walletId))) s += e.amount;
	return s;
}
