import { mutation, query, internalMutation } from './_generated/server';
import { ConvexError } from 'convex/values';
import { resolve, audit, hasRole } from './lib/access';
import { entitlement } from './lib/entitlements';
import { planById } from '../src/lib/payments/plans';
import { internal } from './_generated/api';
import { v } from 'convex/values';

/** Updating the row at expiry invalidates live subscriptions as well as action access. */
export const expire = internalMutation({args:{id:v.id('subscriptions'),expectedUntil:v.number()},handler:async(ctx,a)=>{
	const row=await ctx.db.get(a.id);if(!row||row.until!==a.expectedUntil||row.until>Date.now()||row.status==='cancelled'||row.status==='expired')return;
	await ctx.db.patch(row._id,{status:'expired'});await audit(ctx,undefined,'subscription.expired',row._id);
}});

/** Preserve existing paid accounts only when authoritative payment evidence exists. */
export const reconcileLegacy = internalMutation({args:{},handler:async ctx=>{
	let linked=0,unverified=0;
	for(const subscription of await ctx.db.query('subscriptions').take(500)){
		if(subscription.sourcePaymentId)continue;
		const plan=planById(subscription.planId);
		const payments=await ctx.db.query('payments').withIndex('by_user',q=>q.eq('userId',subscription.paidBy)).collect();
		const payment=payments.filter(p=>p.txRef.startsWith('SX-')&&p.status==='successful'&&!!p.fulfilledAt&&p.currency==='NGN'&&Number(p.amount)===plan?.priceKobo&&(p.purpose==='subscription'||p.purpose==='exam_pass')&&p.refId===`${subscription.planId}:${subscription.userId}`).sort((a,b)=>b.createdAt-a.createdAt)[0];
		if(!payment){unverified++;continue;}
		await ctx.db.patch(subscription._id,{sourcePaymentId:payment._id,status:subscription.until>Date.now()?'active':'expired',startedAt:payment.fulfilledAt});if(subscription.until>Date.now())await ctx.scheduler.runAt(subscription.until,internal.subscriptions.expire,{id:subscription._id,expectedUntil:subscription.until});linked++;
	}
	return {linked,unverified};
}});

export const current = query({args:{},handler:async ctx=>{
	const {user}=await resolve(ctx);
	const current=await entitlement(ctx,user._id);
	const staff=await hasRole(ctx,user._id,'staff');
	return {planId:staff?'staff':current.plan.id,active:staff||current.active,until:staff?null:current.subscription?.until??null,cancelAtPeriodEnd:current.subscription?.cancelAtPeriodEnd??false,status:staff?'active':current.active?'active':(current.subscription?.status==='cancelled'?'cancelled':'expired'),capabilities:staff?['all']:[...current.capabilities]};
}});

export const cancel = mutation({args:{},handler:async ctx=>{
	const {user}=await resolve(ctx);const current=await entitlement(ctx,user._id);
	if(!current.active||!current.subscription)throw new ConvexError('NO_ACTIVE_SUBSCRIPTION');
	await ctx.db.patch(current.subscription._id,{cancelAtPeriodEnd:true,cancelledAt:Date.now()});
	await audit(ctx,user._id,'subscription.cancel',current.subscription._id,`access until ${current.subscription.until}`);
	return {until:current.subscription.until};
}});

export const resume = mutation({args:{},handler:async ctx=>{
	const {user}=await resolve(ctx);const current=await entitlement(ctx,user._id);
	if(!current.active||!current.subscription)throw new ConvexError('NO_ACTIVE_SUBSCRIPTION');
	await ctx.db.patch(current.subscription._id,{cancelAtPeriodEnd:false,cancelledAt:undefined,status:'active'});
	await audit(ctx,user._id,'subscription.resume',current.subscription._id);
	return {until:current.subscription.until};
}});
