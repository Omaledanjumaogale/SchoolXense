/** studio.* royalties.* packs.* — question supply, two-reviewer approval, monthly royalties, originality. */
import { v, ConvexError } from 'convex/values';
import { internalMutation } from './_generated/server';
import { withAccess, audit, hasRole } from './lib/access';
import { post, systemWallet, userWallet, balance } from './lib/ledger';
import { validateQuestions } from '../src/lib/ai-validation';

export const submit = withAccess({ role: 'creator', adultOnly: true, capability:'studio.create' }).mutation({
	args: { briefId: v.id('studioBriefs'), stem: v.string(), options: v.array(v.string()), answer: v.number(), explanation: v.string() },
	handler: async (ctx, a) => {
		const brief = await ctx.db.get(a.briefId); if (!brief?.open) throw new ConvexError('Brief is closed.');
		validateQuestions([{...a,topic:brief.topic}],1);
		return ctx.db.insert('studioSubmissions', { ...a, authorId: ctx.user._id, status: 'pending', approvals: [], rejections: [] });
	}
});

export const review = withAccess({ role: 'creator', adultOnly: true, capability:'studio.create' }).mutation({
	args: { submissionId: v.id('studioSubmissions'), approve: v.boolean() },
	handler: async (ctx, { submissionId, approve }) => {
		const s = (await ctx.db.get(submissionId))!;
		if (!s || s.status !== 'pending') throw new ConvexError('Submission has already been reviewed.');
		const checks = await ctx.db.query('verifications').withIndex('by_user', q=>q.eq('userId',ctx.user._id)).collect();
		if (!(await hasRole(ctx,ctx.user._id,'staff'))&&!checks.some(x=>x.kind==='nin' && x.status==='approved')) throw new ConvexError('Verified reviewers only.');
		if (s.approvals.includes(ctx.user._id)||s.rejections.includes(ctx.user._id)) throw new ConvexError('You already reviewed this submission.');
		if (s.authorId === ctx.user._id) throw new ConvexError('SELF_REVIEW');
		const approvals = approve ? [...new Set([...s.approvals, ctx.user._id])] : s.approvals;
		const rejections = approve ? s.rejections : [...s.rejections, ctx.user._id];
		const status = rejections.length ? 'rejected' : approvals.length >= 2 ? 'approved' : 'pending';
		await ctx.db.patch(submissionId, { approvals, rejections, status });
		if (status === 'approved') {
			const br = (await ctx.db.get(s.briefId))!;
			if (!br?.open) throw new ConvexError('Brief is closed.');
			const treasury = await systemWallet(ctx,'platform');
			if (br.reward < 0n || await balance(ctx,treasury)<br.reward) throw new ConvexError('The reward budget must be funded before acceptance.');
			await ctx.db.insert('questions', { exam: br.exam, subject: br.subject, topic: br.topic, stem: s.stem, options: s.options, answer: s.answer, explanation: s.explanation, a: 1.1, b: 0, bloom: 'apply', status: 'reviewed', authorId: s.authorId, licence: 'schoolxense-studio-v1', contentHash: await hash(s.stem + s.options.join('|')) });
			await post(ctx, `studio-accept:${submissionId}`, [{ walletId: await systemWallet(ctx, 'platform'), amount: -br.reward, kind: 'platform', memo: 'Studio accepted' }, { walletId: await userWallet(ctx, s.authorId), amount: br.reward, kind: 'earner', memo: `Studio · ${br.topic}` }]);
		}
		await audit(ctx, ctx.user._id, 'studio.review', submissionId, status);
	}
});

async function hash(s: string) {
	const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s.trim().toLowerCase()));
	return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** royalties.computeMonthly (cron) — the pool (10% of subscription net) split by serves of each author's approved items. Sums exactly. */
export const computeMonthly = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now=new Date(Date.now()),period=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1));
		const month=period.toISOString().slice(0,7);
		if(await ctx.db.query('royaltyRuns').withIndex('by_month',q=>q.eq('month',month)).unique())return;
		const pool = await systemWallet(ctx, 'royalty_pool');
		const end=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1);
		const funding=await ctx.db.query('ledgerEntries').withIndex('by_wallet',q=>q.eq('walletId',pool)).collect();
		const earned=funding.filter(e=>e.amount>0n&&e.createdAt>=period.getTime()&&e.createdAt<end).reduce((n,e)=>n+e.amount,0n);
		const available=await balance(ctx,pool),amount=earned<available?earned:available;
		if (amount <= 0n) return;
		const serves = new Map<string, number>();
		for(const st of await ctx.db.query('paidQuestionUsage').withIndex('by_month',q=>q.eq('month',month)).collect())serves.set(st.authorId,(serves.get(st.authorId)??0)+st.serves);
		const total = [...serves.values()].reduce((a, b) => a + b, 0);
		if (!total) return;
		let paid = 0n;
		const rows = [];
		for (const [author, n] of serves) {
			const amt = (amount * BigInt(n)) / BigInt(total);
			paid += amt;
			rows.push({ walletId: await userWallet(ctx, author as never), amount: amt, kind: 'royalty', memo: `Royalties ${month}` });
			await ctx.db.insert('questionRoyalties', { authorId: author as never, month, serves: n, amount: amt });
		}
		await post(ctx, `royalties:${month}`, [{ walletId: pool, amount: -paid, kind: 'royalty', memo: `Royalty run ${month}` }, ...rows]);
		await ctx.db.insert('royaltyRuns',{month,amount:paid,closedAt:Date.now()});
	}
});

/** packs.submit → originality.check (Copyleaks) → live or rejected. */
export const submitPack = withAccess({ role: 'creator', adultOnly: true, capability:'studio.create' }).mutation({
	args: { title: v.string(), subject: v.string(), exam: v.string(), kind: v.string(), price: v.int64(), pages: v.number(), preview: v.array(v.string()), fileId: v.id('_storage') },
	handler: async (ctx, a) => {
		const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
		const id = await ctx.db.insert('packs', { ...a, authorId: ctx.user._id, slug, status: 'checking', version: 1, rating: 0, sales: 0 });
		// an action calls Copyleaks and writes originalityChecks; packs above the threshold never go live
		return id;
	}
});
