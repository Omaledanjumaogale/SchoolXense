/** integrity.* safeguarding.* verifications.* flags.* — Operations console back end (staff only). */
import { v } from 'convex/values';
import { withAccess, audit } from './lib/access';

export const queues = withAccess({ role: 'staff' }).query({
	args: {},
	handler: async (ctx) => ({
		reports: await ctx.db.query('reports').withIndex('by_status_due', (q) => q.eq('status', 'open')).take(50),
		integrity: await ctx.db.query('integrityFlags').withIndex('by_status', (q) => q.eq('status', 'open')).take(50),
		verifications: await ctx.db.query('verifications').withIndex('by_status', (q) => q.eq('status', 'pending')).take(50),
		disputes: await ctx.db.query('disputes').withIndex('by_status', (q) => q.eq('status', 'open')).take(50),
		payouts: await ctx.db.query('payouts').withIndex('by_status', (q) => q.eq('status', 'awaiting_approval')).take(50)
	})
});

export const resolveIntegrity = withAccess({ role: 'staff' }).mutation({
	args: { flagId: v.id('integrityFlags'), uphold: v.boolean() },
	handler: async (ctx, { flagId, uphold }) => {
		const f = (await ctx.db.get(flagId))!;
		await ctx.db.patch(flagId, { status: uphold ? 'upheld' : 'dismissed' });
		if (uphold) {
			await ctx.db.patch(f.userId, { status: 'paused' });
			for await (const o of ctx.db.query('offers').withIndex('by_tutor', (q) => q.eq('tutorId', f.userId))) await ctx.db.patch(o._id, { active: false });
		}
		await audit(ctx, ctx.user._id, 'integrity.resolve', flagId, uphold ? 'upheld' : 'dismissed');
	}
});

export const setFlag = withAccess({ role: 'staff' }).mutation({
	args: { key: v.string(), enabled: v.boolean(), rollout: v.number() },
	handler: async (ctx, a) => {
		const f = await ctx.db.query('featureFlags').withIndex('by_key', (q) => q.eq('key', a.key)).unique();
		if (f) await ctx.db.patch(f._id, { enabled: a.enabled, rollout: a.rollout });
		await audit(ctx, ctx.user._id, 'flags.update', a.key, `${a.enabled} ${a.rollout}%`);
		// a scheduled action mirrors flags to Workers KV for edge reads
	}
});
