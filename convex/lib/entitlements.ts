import { ConvexError } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { PLANS, planById, type Capability } from '../../src/lib/payments/plans';

export function profileIsComplete(user: Doc<'users'>) {
	return user.profileComplete === true || (!!user.state && !!user.lga && !!user.whatsapp && !!user.ninLast4);
}

export async function latestSubscription(ctx: QueryCtx, userId: Id<'users'>) {
	return ctx.db.query('subscriptions').withIndex('by_user', q => q.eq('userId', userId)).order('desc').first();
}

export async function entitlement(ctx: QueryCtx, userId: Id<'users'>, now = Date.now()) {
	const subscription = await latestSubscription(ctx, userId);
	const plan = subscription ? planById(subscription.planId) : undefined;
	const payment = subscription?.sourcePaymentId ? await ctx.db.get(subscription.sourcePaymentId) : null;
	const settled = !!subscription && !!payment && payment.status === 'successful' && !!payment.fulfilledAt && payment.userId === subscription.paidBy && payment.currency === 'NGN' && Number(payment.amount) === plan?.priceKobo && (payment.purpose === 'subscription' || payment.purpose === 'exam_pass') && payment.refId === `${subscription.planId}:${userId}`;
	const active = settled && !!subscription && !!plan && plan.id !== 'free' && subscription.until > now && (subscription.startedAt ?? subscription._creationTime) <= now && subscription.status !== 'cancelled' && subscription.status !== 'expired';
	return { subscription, plan: active ? plan : PLANS[0], active, capabilities: active && plan ? [...plan.capabilities] : [] as Capability[] };
}

export async function requireCapability(ctx: QueryCtx, userId: Id<'users'>, capability: Capability) {
	const staff = await ctx.db.query('roles').withIndex('by_user_role', q => q.eq('userId', userId).eq('role', 'staff')).unique();
	if (staff) return;
	const current = await entitlement(ctx, userId);
	if (!current.active || !current.capabilities.includes(capability)) throw new ConvexError('SUBSCRIPTION_REQUIRED');
}
