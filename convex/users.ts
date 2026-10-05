import { v, ConvexError } from 'convex/values';
import { withAccess, audit } from './lib/access';
import { residence } from './lib/profileValidation';
import { entitlement } from './lib/entitlements';

export const me = withAccess().query({
	args: {},
	handler: async (ctx) => {
		const roles = await ctx.db.query('roles').withIndex('by_user', (q) => q.eq('userId', ctx.user._id)).collect();
		const current = await entitlement(ctx,ctx.user._id);
		return { ...ctx.user, roles: roles.map((r) => r.role), plan: current.active?current.subscription:null };
	}
});

export const upsertProfile = withAccess().mutation({
	args: { name: v.optional(v.string()), phone: v.optional(v.string()), state: v.optional(v.string()),lga:v.optional(v.string()),whatsapp:v.optional(v.string()), institution: v.optional(v.string()), level: v.optional(v.string()), examTarget: v.optional(v.string()), dailyMinutes: v.optional(v.number()), headline: v.optional(v.string()), bio: v.optional(v.string()) },
	handler: async (ctx, patch) => {
 for(const [key,value]of Object.entries(patch))if(typeof value==='string'&&(value.length>(key==='bio'?2000:200)||key==='name'&&value.trim().length<2))throw new ConvexError('Profile details are invalid.');
 if(patch.dailyMinutes!==undefined&&(!Number.isInteger(patch.dailyMinutes)||patch.dailyMinutes<5||patch.dailyMinutes>240))throw new ConvexError('Study time must be 5–240 minutes.');
 if(patch.state!==undefined||patch.lga!==undefined||patch.whatsapp!==undefined)Object.assign(patch,residence(patch.state??ctx.user.state??'',patch.lga??ctx.user.lga??'',patch.whatsapp??ctx.user.whatsapp??''));
 await ctx.db.patch(ctx.user._id, patch);await audit(ctx,ctx.user._id,'profile.update',ctx.user._id);
 }
});

/** roles.grant — self-serve for learner; earning roles start verification and are adult-only. */
export const requestRole = withAccess().mutation({
	args: { role: v.union(v.literal('learner'), v.literal('tutor'), v.literal('creator'), v.literal('ambassador')) },
	handler: async (ctx, { role }) => {
		if (role !== 'learner' && ctx.user.isMinor) throw new ConvexError('ADULTS_ONLY');
		const has = await ctx.db.query('roles').withIndex('by_user_role', (q) => q.eq('userId', ctx.user._id).eq('role', role)).unique();
		if (!has) await ctx.db.insert('roles', { userId: ctx.user._id, role, grantedAt: Date.now() });
		if (role !== 'learner') await ctx.db.insert('verifications', { userId: ctx.user._id, kind: 'nin', status: 'pending', provider: 'smile_id' });
		await audit(ctx, ctx.user._id, 'roles.grant', role, 'self-serve');
	}
});

/** guardians.requestConsent / decide */
export const decideConsent = withAccess({ role: 'guardian' }).mutation({
	args: { consentId: v.id('consents'), approve: v.boolean() },
	handler: async (ctx, { consentId, approve }) => {
		const c = await ctx.db.get(consentId);
		if (!c || c.guardianId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if(c.status!=='pending')throw new ConvexError('Consent is already decided.');
		await ctx.db.patch(consentId, { status: approve ? 'approved' : 'declined', decidedAt: Date.now() });
		if (c.refTable === 'bookings' && c.refId) await ctx.db.patch(c.refId as never, { status: approve ? 'pending_payment' : 'cancelled' } as never);
		await audit(ctx, ctx.user._id, 'guardians.consent', consentId, approve ? 'approved' : 'declined');
	}
});

/** privacy.exportMine — NDPA data subject request (delivered as JSON within 24h; small accounts inline). */
export const exportMine = withAccess().query({
	args: {},
	handler: async (ctx) => {
		const id = ctx.user._id;
		return {
			profile: ctx.user,
			attempts: await ctx.db.query('attempts').withIndex('by_user', (q) => q.eq('userId', id)).collect(),
			payments: await ctx.db.query('payments').withIndex('by_user', (q) => q.eq('userId', id)).collect(),
			certificates: await ctx.db.query('certificates').withIndex('by_user', (q) => q.eq('userId', id)).collect()
		};
	}
});
