/** practice.* + forge.* + review.* — Forge adaptive engine (2PL IRT) and SM-2 review, deterministic, no model call per question. */
import { v, ConvexError } from 'convex/values';
import { withAccess, isTenantMember } from './lib/access';
import type { Id } from './_generated/dataModel';
import { updateAbility, pickNextItem } from '../src/lib/engines/irt';
import { review as sm2, newCard, qualityFromAnswer } from '../src/lib/engines/sm2';
import { waecGrade } from '../src/lib/engines/grading';
import { estimateReadiness } from '../src/lib/engines/readiness';
import { rateLimiter } from './rateLimits';
import { attemptAggregate } from './components';

export const start = withAccess({ role: 'learner' }).mutation({
	args: { exam: v.string(), subject: v.string(), mode: v.union(v.literal('drill'), v.literal('mock')), topic: v.optional(v.string()), hostedExamId: v.optional(v.id('hostedExams')), clientId: v.optional(v.string()) },
	handler: async (ctx, a) => {
		if (a.clientId) { const ex = await ctx.db.query('attempts').withIndex('by_clientId', (q) => q.eq('clientId', a.clientId)).unique(); if (ex) { if (ex.userId !== ctx.user._id) throw new ConvexError('FORBIDDEN'); return ex._id; } }
		let queue: Id<'questions'>[] | undefined;
		if (a.hostedExamId) { const exam = await ctx.db.get(a.hostedExamId); const member = exam && await ctx.db.query('tenantMembers').withIndex('by_tenant_user', q => q.eq('tenantId', exam.tenantId).eq('userId', ctx.user._id)).unique(); if (!exam || !member || exam.status !== 'live') throw new ConvexError('TENANT_FORBIDDEN'); queue = exam.questionIds; }
		else if (a.mode === 'mock') queue = (await ctx.db.query('questions').withIndex('by_exam_subject_topic', (q) => q.eq('exam', a.exam).eq('subject', a.subject)).take(200)).filter((q) => q.status === 'reviewed').sort(() => Math.random() - 0.5).slice(0, 20).map((q) => q._id);
		if (queue && !queue.length) throw new ConvexError('No reviewed questions are available for this subject yet.');
		return ctx.db.insert('attempts', { userId: ctx.user._id, exam: a.exam, subject: a.subject, mode: a.mode, topic: a.topic, target: queue?.length ?? 10, timeLimitSec: queue ? queue.length * 60 : undefined, queue, startedAt: Date.now(), hostedExamId: a.hostedExamId, clientId: a.clientId });
	}
});

/** forge.nextItem — on the weakest topic, the unseen item whose difficulty b is closest to theta. */
export const nextItem = withAccess().query({
	args: { attemptId: v.id('attempts') },
	handler: async (ctx, { attemptId }) => {
		const at = await ctx.db.get(attemptId);
		if (!at || at.userId !== ctx.user._id || at.endedAt || (at.timeLimitSec && Date.now() > at.startedAt + at.timeLimitSec * 1000)) return null;
		const answered = await ctx.db.query('attemptAnswers').withIndex('by_attempt', (q) => q.eq('attemptId', attemptId)).collect();
		if (answered.length >= at.target) return null;
		if (at.queue) { const q = await ctx.db.get(at.queue[answered.length]); return q?.status === 'reviewed' ? { ...q, answer: undefined, explanation: undefined } : null; }
		const bank = (await ctx.db.query('questions').withIndex('by_exam_subject_topic', (q) => q.eq('exam', at.exam).eq('subject', at.subject)).take(400)).filter((q) => q.status === 'reviewed');
		const mastery = Object.fromEntries((await ctx.db.query('mastery').withIndex('by_user_exam', (q) => q.eq('userId', ctx.user._id).eq('exam', at.exam)).collect()).filter((m) => m.subject === at.subject).map((m) => [m.topic, { theta: m.theta, answered: m.answered }]));
		const seen = new Set(answered.map((x) => x.questionId as string));
		const item = pickNextItem(bank.map((q) => ({ ...q, id: q._id as string })), mastery, seen, { topic: at.topic });
		return item ? { ...item, answer: undefined, explanation: undefined } : null; // never leak the key to the client before answering
	}
});

/** practice.answer → forge.update + review queue, in one transaction. Idempotent on clientId (offline queue). */
export const answer = withAccess().mutation({
	args: { attemptId: v.id('attempts'), questionId: v.id('questions'), chosen: v.union(v.number(), v.null()), ms: v.number(), clientId: v.optional(v.string()) },
	handler: async (ctx, a) => {
		if (a.clientId) { const previous = await ctx.db.query('attemptAnswers').withIndex('by_clientId', q => q.eq('clientId', a.clientId)).unique(); if (previous) { if (previous.userId !== ctx.user._id) throw new ConvexError('FORBIDDEN'); return null; } }
		const at = await ctx.db.get(a.attemptId);
		if (!at || at.userId !== ctx.user._id || at.endedAt) throw new ConvexError('FORBIDDEN');
		if (at.timeLimitSec && Date.now() > at.startedAt + at.timeLimitSec * 1000) throw new ConvexError('Time is up. Finish to save your result.');
		const previousAnswers = await ctx.db.query('attemptAnswers').withIndex('by_attempt', q => q.eq('attemptId', at._id)).collect();
		const q = await ctx.db.get(a.questionId);
		if (!q || q.exam !== at.exam || q.subject !== at.subject || q.status !== 'reviewed' || previousAnswers.length >= at.target || previousAnswers.some(x => x.questionId === a.questionId) || (at.queue && at.queue[previousAnswers.length] !== q._id)) throw new ConvexError('Invalid question for this attempt.');
		if (!at.queue) {
			const bank = (await ctx.db.query('questions').withIndex('by_exam_subject_topic',x=>x.eq('exam',at.exam).eq('subject',at.subject)).take(400)).filter(x=>x.status==='reviewed');
			const mastery = Object.fromEntries((await ctx.db.query('mastery').withIndex('by_user_exam',x=>x.eq('userId',ctx.user._id).eq('exam',at.exam)).collect()).filter(x=>x.subject===at.subject).map(x=>[x.topic,{theta:x.theta,answered:x.answered}]));
			const expected = pickNextItem(bank.map(x=>({...x,id:x._id as string})),mastery,new Set(previousAnswers.map(x=>x.questionId as string)),{topic:at.topic});
			if(expected?._id!==q._id) throw new ConvexError('Answer the current question before continuing.');
		}
		if ((a.chosen !== null && (!Number.isInteger(a.chosen) || a.chosen < 0 || a.chosen >= q.options.length)) || !Number.isFinite(a.ms) || a.ms < 0 || a.ms > 3600000) throw new ConvexError('Invalid answer.');
		const sub = await ctx.db.query('subscriptions').withIndex('by_user', x => x.eq('userId', ctx.user._id)).order('desc').first();
		if (!sub || sub.until < Date.now()) await rateLimiter.limit(ctx, 'freeDailyQuestions', { key: ctx.user._id, count: 1, throws: true });
		const correct = a.chosen === q.answer;
		await ctx.db.insert('attemptAnswers', { attemptId: a.attemptId, userId: ctx.user._id, questionId: q._id, chosen: a.chosen, correct, ms: a.ms, at: Date.now(), clientId: a.clientId });
		const m = await ctx.db.query('mastery').withIndex('by_key', (x) => x.eq('userId', ctx.user._id).eq('exam', at.exam).eq('subject', at.subject).eq('topic', q.topic)).unique();
		const theta = updateAbility(m?.theta ?? 0, q.a, q.b, correct, m?.answered ?? 0);
		if (m) await ctx.db.patch(m._id, { theta, answered: m.answered + 1, correct: m.correct + (correct ? 1 : 0) });
		else await ctx.db.insert('mastery', { userId: ctx.user._id, exam: at.exam, subject: at.subject, topic: q.topic, theta, answered: 1, correct: correct ? 1 : 0 });
		const rq = await ctx.db.query('reviewQueue').withIndex('by_user_question', (x) => x.eq('userId', ctx.user._id).eq('questionId', q._id)).unique();
		const quality = qualityFromAnswer(correct, a.ms);
		if (rq) await ctx.db.patch(rq._id, sm2(rq, quality));
		else if (!correct) await ctx.db.insert('reviewQueue', { userId: ctx.user._id, questionId: q._id, ...sm2(newCard(), quality) });
		const stats = await ctx.db.query('questionStats').withIndex('by_question', (x) => x.eq('questionId', q._id)).unique();
		if (stats) await ctx.db.patch(stats._id, { served: stats.served + 1, correct: stats.correct + (correct ? 1 : 0) });
		else await ctx.db.insert('questionStats', { questionId: q._id, served: 1, servedPaying: 0, correct: correct ? 1 : 0 });
		return at.mode === 'mock' ? { correct: null } : { correct, answer: q.answer, explanation: q.explanation };
	}
});

export const finish = withAccess().mutation({
	args: { attemptId: v.id('attempts') },
	handler: async (ctx, { attemptId }) => {
		const at = await ctx.db.get(attemptId);
		if (!at || at.userId !== ctx.user._id) throw new ConvexError('FORBIDDEN');
		if (at.endedAt) return { pct: at.pct ?? 0, grade: at.grade ?? '' };
		const ans = await ctx.db.query('attemptAnswers').withIndex('by_attempt', (q) => q.eq('attemptId', attemptId)).collect();
		const pct = Math.round((ans.filter((x) => x.correct).length / Math.max(1, at.target)) * 100);
		const grade = waecGrade(pct).grade;
		await ctx.db.patch(attemptId, { endedAt: Date.now(), pct, grade });
		await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'learning.completed',subject:ctx.user.ecosystemId??`schoolxense:${ctx.user._id}`,payload:{version:1,recordId:attemptId,exam:at.exam,subject:at.subject,pct,referralCode:ctx.user.centralReferralCode},createdAt:Date.now()});
		await attemptAggregate.insert(ctx,(await ctx.db.get(attemptId))!);
		if (at.mode === 'mock' && pct >= 70) await ctx.db.insert('certificates', { userId: ctx.user._id, title: `${at.exam.toUpperCase()} ${at.subject} — Mock`, pct, grade, code: 'SH-C-' + Math.random().toString(36).slice(2, 8).toUpperCase(), module: 'secondary', issuedAt: Date.now() });
		return { pct, grade };
	}
});

export const reviewDue = withAccess().query({ args: {}, handler: (ctx) => ctx.db.query('reviewQueue').withIndex('by_user_due', (q) => q.eq('userId', ctx.user._id).lte('dueAt', Date.now())).take(100) });

export const readiness = withAccess().query({
	args: { exam: v.string(), userId: v.optional(v.id('users')) },
	handler: async (ctx, { exam, userId }) => {
		const uid = userId ?? ctx.user._id; // guardians/tenant staff pass a child/learner id; checked below
		if (uid !== ctx.user._id) {
			const link = await ctx.db.query('guardianLinks').withIndex('by_child', (q) => q.eq('childId', uid)).collect();
			if (!link.some((l) => l.guardianId === ctx.user._id)) throw new ConvexError('FORBIDDEN');
		}
		const rows = await ctx.db.query('mastery').withIndex('by_user_exam', (q) => q.eq('userId', uid).eq('exam', exam)).collect();
		const answered = rows.reduce((s, r) => s + r.answered, 0);
		const mastery = rows.length ? rows.reduce((s, r) => s + r.correct / Math.max(1, r.answered), 0) / rows.length : 0;
		const mocks = (await ctx.db.query('attempts').withIndex('by_user_mode', (q) => q.eq('userId', uid).eq('mode', 'mock')).collect()).filter((a) => a.pct != null).map((a) => a.pct!);
		return estimateReadiness({ mastery, coverage: Math.min(1, rows.filter((r) => r.answered >= 3).length / 15), mocks, answered });
	}
});
