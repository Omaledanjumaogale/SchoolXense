/** teams.* splitRules.* contracts.* milestones.* tasks.* threads.* — Hive Collab. */
import { v, ConvexError } from 'convex/values';
import { withAccess, audit } from './lib/access';
import { post, systemWallet, userWallet } from './lib/ledger';
import { split, splitByRules } from '../src/lib/engines/hiveShare';
import { screen } from '../src/lib/engines/integrity';

export const setSplitRules = withAccess({ role: 'teamlead', adultOnly: true, capability:'collab.earn' }).mutation({
	args: { teamId: v.id('teams'), rules: v.array(v.object({ userId: v.id('users'), bp: v.number() })) },
	handler: async (ctx, { teamId, rules }) => {
		const t = (await ctx.db.get(teamId))!;
		if (t.leadId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if (!rules.length || rules.some(r=>!Number.isInteger(r.bp)||r.bp<0)||new Set(rules.map(x=>x.userId)).size!==rules.length||rules.reduce((s, r) => s + r.bp, 0) !== 10_000) throw new ConvexError('SPLIT_NOT_100');
		const members=await ctx.db.query('teamMembers').withIndex('by_team',q=>q.eq('teamId',teamId)).collect();
		if(rules.some(r=>!members.some(m=>m.userId===r.userId)))throw new ConvexError('Splits must belong to team members.');
		const old = await ctx.db.query('splitRules').withIndex('by_team', (q) => q.eq('teamId', teamId)).collect();
		const version = (old[0]?.version ?? 0) + 1;
		for (const o of old) await ctx.db.delete(o._id);
		for (const r of rules) await ctx.db.insert('splitRules', { teamId, userId: r.userId, bp: r.bp, accepted: r.userId === ctx.user._id, version });
		await audit(ctx, ctx.user._id, 'splitRules.set', teamId, `v${version}`);
	}
});

export const acceptSplit = withAccess({ adultOnly: true, capability:'collab.earn' }).mutation({
	args: { teamId: v.id('teams') },
	handler: async (ctx, { teamId }) => {
		const mine = (await ctx.db.query('splitRules').withIndex('by_team', (q) => q.eq('teamId', teamId)).collect()).find((r) => r.userId === ctx.user._id);
		if (!mine) throw new ConvexError('NOT_INVITED');
		await ctx.db.patch(mine._id, { accepted: true });
	}
});

export const bid = withAccess({ role: 'teamlead', adultOnly: true, capability:'collab.earn' }).mutation({
	args: { contractId: v.id('contracts'), teamId: v.id('teams'), amount: v.int64(), note: v.string() },
	handler: async (ctx, a) => {
		const team=await ctx.db.get(a.teamId),contract=await ctx.db.get(a.contractId);
		if(!team||team.leadId!==ctx.user._id||contract?.status!=='open'||a.amount<=0n||a.note.length>4000)throw new ConvexError('Invalid bid.');
		const rules = await ctx.db.query('splitRules').withIndex('by_team', (q) => q.eq('teamId', a.teamId)).collect();
		if (rules.some((r) => !r.accepted)) throw new ConvexError('SPLIT_PENDING'); // members accept before the team can bid
		await ctx.db.insert('bids', { contractId: a.contractId, teamId: a.teamId, amount: a.amount, note: a.note });
	}
});

/** milestones.release — escrow → team members by split rules (88% earner slice), in one transaction. */
export const releaseMilestone = withAccess().mutation({
	args: { milestoneId: v.id('milestones') },
	handler: async (ctx, { milestoneId }) => {
		const m = (await ctx.db.get(milestoneId))!;
		const k = (await ctx.db.get(m.contractId))!;
		if (k.posterUserId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if(m.status==='released')return;
		const escrow=await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',milestoneId)).unique();
		if(m.status!=='submitted'||!k.awardedTeamId||!escrow||escrow.status!=='held'||escrow.amount!==m.amount)throw new ConvexError('A funded, submitted milestone is required.');
		const rules = await ctx.db.query('splitRules').withIndex('by_team', (q) => q.eq('teamId', k.awardedTeamId!)).collect();
		const s = split({ kind: 'collab', grossKobo: Number(m.amount) });
		const parts = splitByRules(s.earner, rules.filter((r) => r.accepted).map((r) => ({ memberId: r.userId, bp: r.bp })));
		const rows = [{ walletId: await systemWallet(ctx, 'escrow'), amount: -m.amount, kind: 'escrow', memo: m.title }];
		for (const p of parts) rows.push({ walletId: await userWallet(ctx, p.memberId as never), amount: BigInt(p.kobo), kind: 'earner', memo: `${k.title} · ${m.title}` });
		rows.push({ walletId: await systemWallet(ctx, 'platform'), amount: BigInt(s.platform + s.referrer), kind: 'platform', memo: 'Collab fee' });
		rows.push({ walletId: await systemWallet(ctx, 'impact'), amount: BigInt(s.impact), kind: 'impact', memo: 'Collab' });
		rows.push({ walletId: await systemWallet(ctx, 'processing'), amount: BigInt(s.processing), kind: 'processing', memo: 'Collab' });
		await post(ctx, `milestone:${milestoneId}`, rows);
		await ctx.db.patch(milestoneId, { status: 'released' });
		await ctx.db.patch(escrow._id,{status:'released'});
		await audit(ctx, ctx.user._id, 'milestones.release', milestoneId);
	}
});

export const claimTask = withAccess({ adultOnly: true, capability:'collab.earn' }).mutation({
	args: { taskId: v.id('tasks') },
	handler: async (ctx, { taskId }) => {
		const t = (await ctx.db.get(taskId))!;
		if (t.status !== 'open') throw new ConvexError('TAKEN');
		const mine = await ctx.db.query('tasks').withIndex('by_claimer', (q) => q.eq('claimedBy', ctx.user._id)).collect();
		if (mine.filter((x) => x.status === 'claimed').length >= 2) throw new ConvexError('LIMIT_2');
		await ctx.db.patch(taskId, { status: 'claimed', claimedBy: ctx.user._id });
		await ctx.db.insert('taskClaims', { taskId, userId: ctx.user._id, claimedAt: Date.now() });
	}
});

/** threads.send — integrity-screened; no adult–minor messaging without the guardian; contact details blocked with minors. */
export const send = withAccess().mutation({
	args: { threadId: v.id('threads'), body: v.string() },
	handler: async (ctx, { threadId, body }) => {
		const th = (await ctx.db.get(threadId))!;
		if(!th||body.trim().length<1||body.length>4000)throw new ConvexError('Invalid message.');
		if (!th.participants.includes(ctx.user._id)) throw new ConvexError('FORBIDDEN');
		const people = await Promise.all(th.participants.map((p) => ctx.db.get(p)));
		const hasMinor = people.some((p) => p?.isMinor);
		if (hasMinor && !th.guardianIncluded) throw new ConvexError('MINOR_SAFETY');
		const v2 = screen(body);
		if (!v2.allowed || v2.contactShared) await ctx.db.insert('integrityFlags', { userId: ctx.user._id, text: body, reasons: [...v2.reasons, ...(v2.contactShared ? ['Contact details shared'] : [])], source: 'message', status: 'open' });
		if (!v2.allowed || (hasMinor && v2.contactShared)) throw new ConvexError('BLOCKED');
		await ctx.db.insert('messages', { threadId, userId: ctx.user._id, body, system: false, flagged: v2.contactShared });
	}
});

export const threadMessages = withAccess().query({
	args: { threadId: v.id('threads') },
	handler: async (ctx, { threadId }) => {
		const th = await ctx.db.get(threadId);
		if (!th?.participants.includes(ctx.user._id)) throw new ConvexError('FORBIDDEN');
		return ctx.db.query('messages').withIndex('by_thread', (q) => q.eq('threadId', threadId)).order('asc').take(500); // live query: updates without refresh
	}
});
