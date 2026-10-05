/** offers.* match.* bookings.* escrow.* disputes.* handoffs.* — Hive Tutors & Cohorts. */
import { v, ConvexError } from 'convex/values';
import { internal } from './_generated/api';
import { withAccess, audit, hasRole } from './lib/access';
import { requireCapability, profileIsComplete } from './lib/entitlements';
import { screen } from '../src/lib/engines/integrity';
import { rank } from '../src/lib/engines/matching';

export const match = withAccess().query({
	args: { subject: v.optional(v.string()), topic: v.optional(v.string()), kind: v.optional(v.string()), language: v.optional(v.string()), budgetKobo: v.optional(v.number()) },
	handler: async (ctx, need) => {
		const offers = await ctx.db.query('offers').withIndex('by_active_kind', (q) => (need.kind ? q.eq('active', true).eq('kind', need.kind as never) : q.eq('active', true))).take(300);
		const pool = ctx.user.isMinor ? offers.filter((o) => o.minorsApproved) : offers; // minors only see approved-for-minors tutors
		return rank(pool.map((o) => ({ ...o, id: o._id, level: o.levels, priceKobo: Number(o.price), verifiedAt: o._creationTime })), need).slice(0, 30);
	}
});

export const create = withAccess({ role: 'learner' }).mutation({
	args: { offerId: v.id('offers'), topic: v.string(), slot: v.string(), minutes: v.number(), note: v.optional(v.string()) },
	handler: async (ctx, a) => {
		const o = await ctx.db.get(a.offerId);
		if (!o || !o.active) throw new ConvexError('OFFER_UNAVAILABLE');
		const tutor=await ctx.db.get(o.tutorId),staff=await hasRole(ctx,o.tutorId,'staff');
		if(!tutor||tutor.status!=='active'||(!staff&&(!profileIsComplete(tutor)||!(await hasRole(ctx,o.tutorId,'tutor')))))throw new ConvexError('OFFER_UNAVAILABLE');
		await requireCapability(ctx,o.tutorId,'market.earn');
		if (!Number.isInteger(a.minutes) || a.minutes < 15 || a.minutes > 180 || !Number.isFinite(Date.parse(a.slot)) || Date.parse(a.slot) < Date.now() || a.topic.trim().length < 2 || a.topic.length > 120 || (a.note?.length ?? 0)>2000 || o.tutorId===ctx.user._id) throw new ConvexError('Invalid booking details.');
		const verdict = screen(`${a.topic} ${a.note ?? ''}`);
		if (!verdict.allowed) {
			await ctx.db.insert('integrityFlags', { userId: ctx.user._id, text: a.note ?? a.topic, reasons: verdict.reasons, source: 'booking', status: 'open' });
			throw new ConvexError({ code: 'INTEGRITY', reasons: verdict.reasons });
		}
		if (ctx.user.isMinor && !o.minorsApproved) throw new ConvexError('MINOR_SAFETY');
		const price = (o.price * BigInt(a.minutes)) / 45n;
		let status = 'pending_payment';
		const learner = ctx.user;
		const link = learner.isMinor ? await ctx.db.query('guardianLinks').withIndex('by_child', (q) => q.eq('childId', learner._id)).first() : null;
		if (learner.isMinor && !link) throw new ConvexError('NO_GUARDIAN');
		if (link) status = 'awaiting_consent';
		const participants = [learner._id, o.tutorId, ...(link ? [link.guardianId] : [])];
		const threadId = await ctx.db.insert('threads', { title: a.topic, kind: 'booking', participants, guardianIncluded: !!link });
		const bookingId = await ctx.db.insert('bookings', { offerId: o._id, learnerId: learner._id, tutorId: o.tutorId, topic: a.topic, slot: a.slot, minutes: a.minutes, price, status, note: a.note, threadId });
		if (status === 'awaiting_consent') await ctx.db.insert('consents', { guardianId: link!.guardianId, childId: learner._id, scope: `Book ${o.title} · ${a.topic}`, refTable: 'bookings', refId: bookingId, status: 'pending' });
		return bookingId;
	}
});

export const deliver = withAccess({ role: 'tutor', adultOnly: true }).mutation({
	args: { bookingId: v.id('bookings') },
	handler: async (ctx, { bookingId }) => {
		const b = (await ctx.db.get(bookingId))!;
		if (b.tutorId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if (b.status !== 'confirmed') throw new ConvexError('Only a paid, confirmed booking can be delivered.');
		await ctx.db.patch(bookingId, { status: 'delivered', deliveredAt: Date.now() });
		const e = await ctx.db.query('escrows').withIndex('by_ref', (q) => q.eq('refId', bookingId)).unique();
		if (e) await ctx.db.patch(e._id, { releaseAfter: Date.now() + 48 * 3_600_000 }); // 48h dispute window; silence = confirmation
	}
});

export const confirm = withAccess().mutation({
	args: { bookingId: v.id('bookings'), rating: v.number(), text: v.string() },
	handler: async (ctx, a) => {
		const b = (await ctx.db.get(a.bookingId))!;
		if (b.learnerId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if (b.status !== 'delivered') throw new ConvexError('NOT_DELIVERED');
		if (!Number.isInteger(a.rating)||a.rating<1||a.rating>5||a.text.length>2000) throw new ConvexError('Invalid review.');
		await ctx.db.insert('reviews', { bookingId: b._id, offerId: b.offerId, rating: a.rating, text: a.text });
		const e = await ctx.db.query('escrows').withIndex('by_ref', (q) => q.eq('refId', b._id)).unique();
		if (e) await ctx.scheduler.runAfter(0, internal.money.releaseEscrow, { escrowId: e._id });
		await ctx.db.patch(b._id, { status: 'released' });
	}
});

export const openDispute = withAccess().mutation({
	args: { bookingId: v.id('bookings'), reason: v.string() },
	handler: async (ctx, a) => {
		const b = (await ctx.db.get(a.bookingId))!;
		if (b.learnerId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if (!['confirmed','delivered'].includes(b.status)||a.reason.trim().length<10||a.reason.length>2000)throw new ConvexError('Invalid dispute.');
		const e = await ctx.db.query('escrows').withIndex('by_ref', (q) => q.eq('refId', b._id)).unique();
		if (e) await ctx.db.patch(e._id, { status: 'disputed' });
		await ctx.db.patch(b._id, { status: 'disputed' });
		await ctx.db.insert('disputes', { bookingId: b._id, openedBy: ctx.user._id, reason: a.reason, status: 'open' });
		await audit(ctx, ctx.user._id, 'disputes.open', b._id, a.reason);
	}
});

/** handoffs.create — pass a booking to another verified tutor; the hand-off earns the 2% collaboration slice. */
export const handoff = withAccess({ role: 'tutor', adultOnly: true }).mutation({
	args: { bookingId: v.id('bookings'), toOfferId: v.id('offers') },
	handler: async (ctx, a) => {
		const b = (await ctx.db.get(a.bookingId))!;
		const to = (await ctx.db.get(a.toOfferId))!;
		if (b.tutorId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if(!to?.active||b.status!=='confirmed'||to.tutorId===ctx.user._id)throw new ConvexError('Invalid handoff.');
		const learner = (await ctx.db.get(b.learnerId))!;
		if (learner.isMinor && !to.minorsApproved) throw new ConvexError('MINOR_SAFETY');
		await ctx.db.patch(b._id, { tutorId: to.tutorId, offerId: to._id, handoffFrom: ctx.user._id });
		if(b.threadId){const thread=await ctx.db.get(b.threadId);if(thread)await ctx.db.patch(thread._id,{participants:[...new Set(thread.participants.filter(x=>x!==ctx.user._id).concat(to.tutorId))]});}
		await ctx.db.insert('handoffs', { bookingId: b._id, fromId: ctx.user._id, toId: to.tutorId });
		const e = await ctx.db.query('escrows').withIndex('by_ref', (q) => q.eq('refId', b._id)).unique();
		if (e) await ctx.db.patch(e._id, { recipients: { ...e.recipients, earner: to.tutorId, collab: ctx.user._id } });
		await audit(ctx, ctx.user._id, 'handoffs.create', b._id, to.tutorId);
	}
});

export const joinCohort = withAccess().mutation({
	args: { cohortId: v.id('cohorts') },
	handler: async () => { throw new ConvexError('Use the authoritative checkout.order cohort endpoint.');
	}
});
