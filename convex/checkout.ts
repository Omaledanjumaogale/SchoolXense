import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { resolve, hasRole } from './lib/access';
import { profileIsComplete } from './lib/entitlements';
import { planById } from '../src/lib/payments/plans';
import type { Id } from './_generated/dataModel';
import { policy, eligible, freeSlots, SESSION_COUNT } from './lib/tutorBundle';

export const order = mutation({ args: { kind: v.union(v.literal('subscription'), v.literal('booking'), v.literal('pack'), v.literal('cohort')), refId: v.string(), beneficiaryId:v.optional(v.id('users')) }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx);
	let amount: bigint, bundleSessionKobo:bigint|undefined, refId = args.refId, purpose: 'subscription' | 'booking' | 'pack' | 'cohort' | 'exam_pass' = args.kind;
	if (args.kind === 'subscription') {
		if (user.isMinor) throw new ConvexError('A linked guardian must arrange paid access for under-18 learners.');
		const beneficiary=args.beneficiaryId??user._id;
		if(beneficiary!==user._id){
			const child=await ctx.db.get(beneficiary),links=await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',beneficiary)).collect();
			if(!(await hasRole(ctx,user._id,'guardian'))||!child?.isMinor||child.status!=='active'||!profileIsComplete(child)||!links.some(x=>x.guardianId===user._id))throw new ConvexError('FORBIDDEN');
		}
		const plan = planById(refId);
		if (!plan || !plan.purchasable || plan.priceKobo<=0) throw new ConvexError('Invalid plan.');
		if(plan.id==='plus_tutor'){
		 const config=await policy(ctx),learner=await ctx.db.get(beneficiary);
		 if(!config?.enabled)throw new ConvexError('Tutor bundle sales await administrator activation.');
		 let places=0;const counted=new Set<string>();
		 for(const row of await ctx.db.query('tutorBundleRoster').take(300))if(!counted.has(row.tutorId)&&row.tutorId!==beneficiary&&await eligible(ctx,row,learner?.isMinor)){counted.add(row.tutorId);const active=(await ctx.db.query('tutorBundles').withIndex('by_tutor',q=>q.eq('tutorId',row.tutorId)).collect()).filter(b=>b.status!=='completed'&&b.expiresAt>Date.now());places+=Math.max(0,Math.min(row.capacity-active.length,Math.floor((await freeSlots(ctx,row)).length/SESSION_COUNT)));}
		 const pending=(await ctx.db.query('payments').filter(q=>q.eq(q.field('status'),'pending')).collect()).filter(p=>p.refId?.startsWith('plus_tutor:'));
		 const same=pending.find(p=>p.userId===user._id&&p.refId===`plus_tutor:${beneficiary}`&&p.bundleSessionKobo===config.sessionKobo);if(same)return same._id;
		 const awaiting=(await ctx.db.query('tutorBundles').collect()).filter(b=>!b.tutorId&&b.expiresAt>Date.now()).length;
		 if(places<=pending.length+awaiting)throw new ConvexError('Tutor capacity is being allocated. Please try again after the current order is resolved.');
		 bundleSessionKobo=config.sessionKobo;
		}
		amount = BigInt(plan.priceKobo); purpose = plan.id === 'exam_pass' ? 'exam_pass' : 'subscription'; refId = `${plan.id}:${beneficiary}`;
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
	return ctx.db.insert('payments', { userId: user._id, txRef: `SX-${crypto.randomUUID()}`, amount, currency: 'NGN', purpose, refId, status: 'pending',bundleSessionKobo, createdAt: Date.now() });
}});
export const get = query({ args: { paymentId: v.id('payments') }, handler: async (ctx, { paymentId }) => {
	const { user } = await resolve(ctx);
	const payment = await ctx.db.get(paymentId);
	if (!payment || payment.userId !== user._id) throw new ConvexError('FORBIDDEN');
	return { payment, customer: { email: user.email, name: user.name } };
}});
