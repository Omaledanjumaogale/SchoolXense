import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { resolve } from './lib/access';
import { PLANS } from '../src/lib/payments/plans';
import type { Id } from './_generated/dataModel';

export const order = mutation({ args: { kind: v.union(v.literal('subscription'), v.literal('booking'), v.literal('pack'), v.literal('cohort')), refId: v.string() }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx);
	let amount: bigint, refId = args.refId, purpose: 'subscription' | 'booking' | 'pack' | 'cohort' | 'exam_pass' = args.kind;
	if (args.kind === 'subscription') {
		if (user.isMinor) throw new ConvexError('A linked guardian must arrange paid access for under-18 learners.');
		const plan = PLANS.find(x => x.id === refId);
		if (!plan || !['plus_month', 'plus_year', 'exam_pass'].includes(plan.id)) throw new ConvexError('Invalid plan.');
		amount = BigInt(plan.priceKobo); purpose = plan.id === 'exam_pass' ? 'exam_pass' : 'subscription'; refId = `${plan.id}:${user._id}`;
	} else if (args.kind === 'booking') {
		const booking = await ctx.db.get(refId as Id<'bookings'>);
		if (!booking || booking.status !== 'pending_payment') throw new ConvexError('Booking is unavailable or awaiting guardian consent.');
		const learner=await ctx.db.get(booking.learnerId);
		if(learner?.isMinor){const links=await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',booking.learnerId)).collect();const consents=await ctx.db.query('consents').withIndex('by_child',q=>q.eq('childId',booking.learnerId)).collect();if(!links.some(x=>x.guardianId===user._id)||!consents.some(x=>x.guardianId===user._id&&x.refId===booking._id&&x.status==='approved'))throw new ConvexError('The linked guardian must approve and pay for this booking.');}
		else if(booking.learnerId!==user._id)throw new ConvexError('FORBIDDEN');
		amount = booking.price;
	} else if (args.kind === 'pack') {
		if (user.isMinor) throw new ConvexError('Guardian approval is required for this purchase.');
		const pack = await ctx.db.get(refId as Id<'packs'>);
		if (!pack || pack.status !== 'live') throw new ConvexError('Pack unavailable.');
		amount = pack.price;
	} else {
		if (user.isMinor) throw new ConvexError('Guardian approval is required for cohort purchases.');
		const cohort = await ctx.db.get(refId as Id<'cohorts'>);
		if (!cohort || cohort.startsAt < Date.now()) throw new ConvexError('Cohort unavailable.');
		const seats = await ctx.db.query('cohortSeats').withIndex('by_cohort', q => q.eq('cohortId', cohort._id)).take(cohort.seats + 1);
		if (seats.length >= cohort.seats || seats.some(x => x.userId === user._id)) throw new ConvexError('Cohort is full or already joined.');
		amount = cohort.price;
	}
	if (amount <= 0n || amount > 10000000000n) throw new ConvexError('Invalid order amount.');
	const pending = await ctx.db.query('payments').withIndex('by_user', q => q.eq('userId', user._id)).filter(q => q.and(q.eq(q.field('purpose'), purpose), q.eq(q.field('refId'), refId), q.eq(q.field('status'), 'pending'))).first();
	if (pending) return pending._id;
	return ctx.db.insert('payments', { userId: user._id, txRef: `SX-${crypto.randomUUID()}`, amount, currency: 'NGN', purpose, refId, status: 'pending', createdAt: Date.now() });
}});
export const get = query({ args: { paymentId: v.id('payments') }, handler: async (ctx, { paymentId }) => {
	const { user } = await resolve(ctx);
	const payment = await ctx.db.get(paymentId);
	if (!payment || payment.userId !== user._id) throw new ConvexError('FORBIDDEN');
	return { payment, customer: { email: user.email, name: user.name } };
}});
