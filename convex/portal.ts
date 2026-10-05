import { query, mutation, internalMutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { authComponent } from './auth';
import { resolve, hasRole, audit, isTenantMember } from './lib/access';
import { rateLimiter } from './rateLimits';
import { screen } from '../src/lib/engines/integrity';
import { balance } from './lib/ledger';
import { attemptAggregate } from './components';

export const profile = query({ args: {}, handler: async ctx => {
	const identity = await authComponent.safeGetAuthUser(ctx);
	if (!identity?.emailVerified) return null;
	const user = await ctx.db.query('users').withIndex('by_authId', q => q.eq('authId', identity._id)).unique();
	if (!user) return null;
	if (user.status !== 'active') throw new ConvexError('Your account is restricted. Contact support.');
	const roles = await ctx.db.query('roles').withIndex('by_user', q => q.eq('userId', user._id)).collect();
	const memberships = await ctx.db.query('tenantMembers').withIndex('by_user', q => q.eq('userId', user._id)).take(100);
	return { ...user, roles: roles.map(x => x.role), memberships, emailVerified: identity.emailVerified };
}});

export const bootstrap = mutation({ args: { isMinor: v.optional(v.boolean()), examTarget: v.optional(v.string()) }, handler: async (ctx, args) => {
	const identity = await authComponent.safeGetAuthUser(ctx);
	if (!identity?.emailVerified) throw new ConvexError('Verify your email before continuing.');
	const existing = await ctx.db.query('users').withIndex('by_authId', q => q.eq('authId', identity._id)).unique();
	if (existing) return existing._id;
	const userId = await ctx.db.insert('users', { authId: identity._id, ecosystemId: `schoolxense:${identity._id}`, name: identity.name, email: identity.email,
		isMinor: args.isMinor ?? true, dailyMinutes: 15, examTarget: args.examTarget ?? 'jamb', referralCode: `SX${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`, creditsDays: 0, streak: 0, status: 'active' });
	await ctx.db.insert('roles', { userId, role: 'learner', grantedAt: Date.now() });
	const residence=await ctx.db.query('privateIdentities').withIndex('by_authId',q=>q.eq('authId',identity._id)).unique();
	if(residence)await ctx.db.patch(userId,{state:residence.state,lga:residence.lga,whatsapp:residence.whatsapp,ninLast4:residence.last4});
	await audit(ctx, userId, 'profile.create', userId);
	await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'identity.created',subject:`schoolxense:${identity._id}`,payload:{version:1},createdAt:Date.now()});
	return userId;
}});

export const activateOwner = mutation({ args: {}, handler: async ctx => {
	const identity = await authComponent.safeGetAuthUser(ctx);
	if (!identity?.emailVerified || !process.env.SUPER_ADMIN_EMAIL || identity.email.toLowerCase() !== process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase()) throw new ConvexError('Only the verified nominated owner may activate administration.');
	const { user } = await resolve(ctx);
	if (user.isMinor) throw new ConvexError('Complete adult account setup before activating administration.');
	if (!(await hasRole(ctx, user._id, 'staff'))) {
		await ctx.db.insert('roles', { userId: user._id, role: 'staff', grantedAt: Date.now() });
		await audit(ctx, user._id, 'admin.activate', user._id, 'verified nominated owner');
	}
	return { activated: true };
}});

export const catalogue = query({ args: { kind: v.union(v.literal('offers'), v.literal('packs'), v.literal('cohorts'), v.literal('testimonials')) }, handler: async (ctx, { kind }) => {
	if (kind === 'testimonials') return ctx.db.query('testimonials').withIndex('by_approved', q => q.eq('approved', true)).take(12);
	if (kind === 'offers') return ctx.db.query('offers').withIndex('by_active_kind', q => q.eq('active', true)).take(50);
	if (kind === 'packs') return (await ctx.db.query('packs').withIndex('by_status', q => q.eq('status', 'live')).take(50)).map(({ fileId, ...pack }) => pack);
	return ctx.db.query('cohorts').withIndex('by_start', q => q.gte('startsAt', Date.now())).take(50);
}});

export const offers = query({ args: {}, handler: ctx=>ctx.db.query('offers').withIndex('by_active_kind',q=>q.eq('active',true)).take(50) });
export const testimonials = query({ args: {}, handler: ctx=>ctx.db.query('testimonials').withIndex('by_approved',q=>q.eq('approved',true)).take(12) });

export const workspace = query({ args: { domain: v.string(), tenantId: v.optional(v.id('tenants')) }, handler: async (ctx, { domain, tenantId }) => {
	const { user } = await resolve(ctx);
	const id = user._id;
	const mine = <T extends 'attempts' | 'payments' | 'certificates' | 'payouts' | 'purchases'>(table: T) => ctx.db.query(table).withIndex('by_user' as never, (q: any) => q.eq('userId', id)).order('desc').take(50);
	if (domain === 'home' || domain === 'practice' || domain === 'review' || domain === 'plan' || domain === 'attempt') {
		const attempts = await mine('attempts');
		const mastery = await ctx.db.query('mastery').withIndex('by_user_exam', q => q.eq('userId', id)).take(200);
		const review = await ctx.db.query('reviewQueue').withIndex('by_user_due', q => q.eq('userId', id).lte('dueAt', Date.now())).take(50);
		return { attempts, mastery, review, completedSessions:await attemptAggregate.count(ctx,{namespace:id}), certificates: await mine('certificates') };
	}
	if (['wallet', 'earn', 'payouts', 'referrals', 'checkout', 'certificates', 'record'].includes(domain)) {
		const wallet = await ctx.db.query('wallets').withIndex('by_owner', q => q.eq('ownerUserId', id)).unique();
		return { attempts:await mine('attempts'), payments: await mine('payments'), payouts: await mine('payouts'), certificates: await mine('certificates'), balance: wallet ? await balance(ctx, wallet._id) : 0n,
			entries: wallet ? await ctx.db.query('ledgerEntries').withIndex('by_wallet', q => q.eq('walletId', wallet._id)).order('desc').take(50) : [] };
	}
	if (['book', 'sessions', 'requests', 'offers', 'cohorts'].includes(domain)) {
		const learner = await ctx.db.query('bookings').withIndex('by_learner', q => q.eq('learnerId', id)).take(50);
		const tutor = await ctx.db.query('bookings').withIndex('by_tutor_status', q => q.eq('tutorId', id)).take(50);
		return { bookings: [...new Map([...learner, ...tutor].map(x => [x._id, x])).values()], offers: await ctx.db.query('offers').withIndex('by_tutor', q => q.eq('tutorId', id)).take(50), seats: await ctx.db.query('cohortSeats').withIndex('by_user', q => q.eq('userId', id)).take(50) };
	}
	if (['studio', 'packs'].includes(domain)) return { briefs: await ctx.db.query('studioBriefs').withIndex('by_open', q => q.eq('open', true)).take(50), submissions: await ctx.db.query('studioSubmissions').withIndex('by_author', q => q.eq('authorId', id)).take(50), packs: await ctx.db.query('packs').withIndex('by_author', q => q.eq('authorId', id)).take(50) };
	if (domain === 'notifications') return { notifications: await ctx.db.query('notifications').withIndex('by_user_read', q => q.eq('userId', id)).order('desc').take(50) };
	if (['threads', 'teams', 'contracts', 'tasks'].includes(domain)) {
		const threads = (await ctx.db.query('threads').take(300)).filter(x => x.participants.includes(id));
		const teams = await ctx.db.query('teams').withIndex('by_lead', q => q.eq('leadId', id)).take(50);
		const memberships = await ctx.db.query('teamMembers').filter(q => q.eq(q.field('userId'), id)).take(50);
		const memberTeams = await Promise.all(memberships.map(x => ctx.db.get(x.teamId)));
		return { threads, teams: [...new Map([...teams, ...memberTeams.filter(x => x !== null)].map(x => [x._id, x])).values()], contracts: await ctx.db.query('contracts').filter(q => q.or(q.eq(q.field('status'), 'open'), q.eq(q.field('posterUserId'), id))).take(50), tasks: await ctx.db.query('tasks').filter(q => q.or(q.eq(q.field('status'), 'open'), q.eq(q.field('claimedBy'), id))).take(50) };
	}
	if (domain === 'family') {
		const links=await ctx.db.query('guardianLinks').withIndex(user.isMinor?'by_child':'by_guardian',q=>q.eq(user.isMinor?'childId':'guardianId',id)).take(50);
		const children=await Promise.all(links.map(x=>ctx.db.get(x.childId)));
		const childBookings=(await Promise.all(links.filter(x=>x.guardianId===id).map(x=>ctx.db.query('bookings').withIndex('by_learner',q=>q.eq('learnerId',x.childId)).take(20)))).flat();
		return {links,children:children.filter(x=>x!==null).map(x=>({_id:x._id,name:x.name})),bookings:childBookings,consents:await ctx.db.query('consents').withIndex('by_guardian_status',q=>q.eq('guardianId',id)).take(50)};
	}
	if (domain === 'inst') {
		if (!tenantId || !(await isTenantMember(ctx, id, tenantId))) throw new ConvexError('TENANT_FORBIDDEN');
		return { tenant: await ctx.db.get(tenantId), members: await ctx.db.query('tenantMembers').withIndex('by_tenant', q => q.eq('tenantId', tenantId)).take(100), exams: await ctx.db.query('hostedExams').withIndex('by_tenant', q => q.eq('tenantId', tenantId)).take(50), invoices: await ctx.db.query('invoices').withIndex('by_tenant', q => q.eq('tenantId', tenantId)).take(50) };
	}
	if (domain === 'ops') {
		if (!(await hasRole(ctx, id, 'staff'))) throw new ConvexError('FORBIDDEN');
		return { questions: await ctx.db.query('questions').withIndex('by_status',q=>q.eq('status','unreviewed')).take(50), users: await ctx.db.query('users').take(100), enquiries: await ctx.db.query('enquiries').order('desc').take(50), reports: await ctx.db.query('reports').order('desc').take(100), tickets:await ctx.db.query('supportTickets').order('desc').take(100), payouts:await ctx.db.query('payouts').order('desc').take(100), ecosystemEvents:await ctx.db.query('ecosystemEvents').order('desc').take(100), referrals:await ctx.db.query('referrals').order('desc').take(100), submissions: await ctx.db.query('studioSubmissions').withIndex('by_status', q => q.eq('status', 'pending')).take(50), audit: await ctx.db.query('auditLog').order('desc').take(50), verifications: await ctx.db.query('verifications').order('desc').take(100), flags: await ctx.db.query('featureFlags').take(50) };
	}
	if(domain==='settings')return {documents:await ctx.db.query('mediaFiles').withIndex('by_owner',q=>q.eq('ownerId',id)).take(50),tickets:await ctx.db.query('supportTickets').withIndex('by_user',q=>q.eq('userId',id)).order('desc').take(50)};
	return { documents: await ctx.db.query('mediaFiles').withIndex('by_owner', q => q.eq('ownerId', id)).take(50) };
}});

export const createOffer = mutation({ args: { title: v.string(), subject: v.string(), priceKobo: v.number(), availability: v.string() }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx, { role: 'tutor', adultOnly: true });
	if (!Number.isSafeInteger(args.priceKobo) || args.priceKobo < 50000 || args.priceKobo > 100000000 || args.title.trim().length < 5 || args.title.length > 200 || !screen(args.title).allowed) throw new ConvexError('Invalid offer details.');
	const checks = await ctx.db.query('verifications').withIndex('by_user', q => q.eq('userId', user._id)).collect();
	if (!checks.some(x => x.kind === 'nin' && x.status === 'approved')) throw new ConvexError('Complete identity verification before publishing paid offers.');
	return ctx.db.insert('offers', { tutorId: user._id, title: args.title.trim(), subjects: [args.subject], topics: [], levels: [], languages: ['English'], availability: [args.availability], price: BigInt(args.priceKobo), kind: 'tutoring', module: 'tutors', active: true, minorsApproved: checks.some(x => x.kind === 'safeguarding' && x.status === 'approved'), rating: 0, reviews: 0, completion: 0, sessions: 0 });
}});

export const createTeam = mutation({ args: { name: v.string(), blurb: v.string() }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx, { adultOnly: true });
	if (args.name.trim().length < 3 || args.name.length > 100 || args.blurb.length > 2000 || !screen(args.blurb).allowed) throw new ConvexError('Invalid team details.');
	if (!(await hasRole(ctx, user._id, 'teamlead'))) await ctx.db.insert('roles', { userId: user._id, role: 'teamlead', grantedAt: Date.now() });
	const teamId = await ctx.db.insert('teams', { name: args.name.trim(), leadId: user._id, subjects: [], blurb: args.blurb.trim(), rating: 0 });
	await ctx.db.insert('teamMembers', { teamId, userId: user._id, role: 'lead' });
	await ctx.db.insert('splitRules', { teamId, userId: user._id, bp: 10000, accepted: true, version: 1 });
	await audit(ctx, user._id, 'team.create', teamId);
	return teamId;
}});

export const createTicket = mutation({ args: { subject: v.string(), body: v.string() }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx);
	if (args.subject.trim().length < 3 || args.subject.length > 150 || args.body.trim().length < 10 || args.body.length > 5000) throw new ConvexError('Invalid support request.');
	await rateLimiter.limit(ctx,'enquiries',{key:`support:${user._id}`,throws:true});
	return ctx.db.insert('supportTickets', { userId: user._id, subject: args.subject, body: args.body, status: 'open', priority: 'normal' });
}});
export const readNotification=mutation({args:{id:v.id('notifications')},handler:async(ctx,a)=>{const {user}=await resolve(ctx);const row=await ctx.db.get(a.id);if(!row||row.userId!==user._id)throw new ConvexError('FORBIDDEN');await ctx.db.patch(a.id,{read:true});}});

export const setEnquiryStatus = mutation({ args: { id: v.id('enquiries'), status: v.union(v.literal('new'), v.literal('in_progress'), v.literal('closed')) }, handler: async (ctx, args) => {
	const { user } = await resolve(ctx, { role: 'staff' });
	await ctx.db.patch(args.id, { status: args.status });
	await audit(ctx, user._id, 'enquiry.status', args.id, args.status);
}});

export const submitEnquiry = internalMutation({ args: { name: v.string(), email: v.string(), organisation: v.optional(v.string()), topic: v.string(), message: v.string(), rateKey: v.string() }, handler: async (ctx, { rateKey, ...args }) => {
	await rateLimiter.limit(ctx, 'enquiries', { key: rateKey, throws: true });
	if (args.name.trim().length < 2 || args.name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email) || args.email.length > 254 || args.message.trim().length < 10 || args.message.length > 4000 || args.topic.length > 100 || (args.organisation?.length ?? 0) > 150) throw new ConvexError('Invalid enquiry.');
	return ctx.db.insert('enquiries', { ...args, status: 'new', createdAt: Date.now() });
}});
