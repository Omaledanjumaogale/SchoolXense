/** tenants.* seats.* hostedExams.* proctor.* invoices.* — Hive Institutions (tenant-isolated). */
import { v, ConvexError } from 'convex/values';
import { withAccess, audit } from './lib/access';

export const overview = withAccess({ tenantArg: 'tenantId' }).query({
	args: { tenantId: v.id('tenants') },
	handler: async (ctx, { tenantId }) => {
		const members = await ctx.db.query('tenantMembers').withIndex('by_tenant', (q) => q.eq('tenantId', tenantId)).collect();
		const licence = await ctx.db.query('licences').withIndex('by_tenant', (q) => q.eq('tenantId', tenantId)).order('desc').first();
		const exams = await ctx.db.query('hostedExams').withIndex('by_tenant', (q) => q.eq('tenantId', tenantId)).collect();
		const invoices = await ctx.db.query('invoices').withIndex('by_tenant', (q) => q.eq('tenantId', tenantId)).collect();
		return { seatsUsed: members.filter((m) => m.kind === 'learner').length, licence, exams, invoices };
	}
});

export const assignSeat = withAccess({ anyRole:['instadmin','staff'], tenantArg: 'tenantId' }).mutation({
	args: { tenantId: v.id('tenants'), userId: v.id('users'), className: v.optional(v.string()) },
	handler: async (ctx, a) => {
		if(!(await ctx.db.get(a.userId)))throw new ConvexError('Unknown learner.');
		const existing=await ctx.db.query('tenantMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',a.tenantId).eq('userId',a.userId)).unique();if(existing)return existing._id;
		const licence = await ctx.db.query('licences').withIndex('by_tenant', (q) => q.eq('tenantId', a.tenantId)).order('desc').first();
		const used = (await ctx.db.query('tenantMembers').withIndex('by_tenant', (q) => q.eq('tenantId', a.tenantId)).collect()).filter((m) => m.kind === 'learner').length;
		if (!licence || licence.startsAt>Date.now()||licence.endsAt<=Date.now()||used >= licence.seats) throw new ConvexError('NO_SEATS');
		await ctx.db.insert('tenantMembers', { tenantId: a.tenantId, userId: a.userId, kind: 'learner', className: a.className });
		await audit(ctx, ctx.user._id, 'seats.assign', `${a.tenantId}/${a.userId}`);
	}
});

export const scheduleExam = withAccess({ anyRole:['instadmin','staff'], tenantArg: 'tenantId' }).mutation({
	args: { tenantId: v.id('tenants'), title: v.string(), exam: v.string(), subject: v.string(), date: v.number(), seats: v.number(), durationMin: v.number(), questionIds: v.array(v.id('questions')) },
	handler: async (ctx, a) => {
		if(!Number.isInteger(a.seats)||a.seats<1||a.seats>1000||!Number.isInteger(a.durationMin)||a.durationMin<5||a.durationMin>240||a.date<Date.now()||!a.questionIds.length||a.questionIds.length>200||new Set(a.questionIds).size!==a.questionIds.length||a.title.length>200)throw new ConvexError('Invalid exam details.');
		for(const id of a.questionIds){const q=await ctx.db.get(id);if(q?.status!=='reviewed'||q.exam!==a.exam||q.subject!==a.subject)throw new ConvexError('Exams must use reviewed questions for the selected subject.');}
		const licence=await ctx.db.query('licences').withIndex('by_tenant',q=>q.eq('tenantId',a.tenantId)).order('desc').first();if(!licence||licence.endsAt<=a.date||a.seats>licence.seats)throw new ConvexError('Exam must fit the active institution licence.');
		const id = await ctx.db.insert('hostedExams', { ...a, status: 'scheduled' });
		await ctx.db.insert('invoices', { tenantId: a.tenantId, title: `Hosted CBT — ${a.title}`, amount: BigInt(a.seats) * 50_000n, status: 'sent', due: a.date });
		return id;
	}
});
export const reviewedQuestions=withAccess({anyRole:['instadmin','staff'],tenantArg:'tenantId'}).query({args:{tenantId:v.id('tenants'),exam:v.string(),subject:v.string()},handler:async(ctx,a)=>(await ctx.db.query('questions').withIndex('by_exam_subject_topic',q=>q.eq('exam',a.exam).eq('subject',a.subject)).take(200)).filter(x=>x.status==='reviewed')});
export const examStatus=withAccess({anyRole:['instadmin','staff'],tenantArg:'tenantId'}).mutation({args:{tenantId:v.id('tenants'),id:v.id('hostedExams'),status:v.union(v.literal('live'),v.literal('closed'))},handler:async(ctx,a)=>{
 const exam=await ctx.db.get(a.id);if(!exam||exam.tenantId!==a.tenantId)throw new ConvexError('TENANT_FORBIDDEN');if(a.status==='live'&&(exam.status!=='scheduled'||exam.date>Date.now()))throw new ConvexError('Only a scheduled exam whose start time has arrived may go live.');if(a.status==='closed'&&exam.status!=='live')throw new ConvexError('Only a live exam may be closed.');await ctx.db.patch(a.id,{status:a.status});await audit(ctx,ctx.user._id,'exam.'+a.status,a.id);
}});

export const logProctor = withAccess().mutation({
	args: { hostedExamId: v.id('hostedExams'), type: v.union(v.literal('tab_switch'), v.literal('paste'), v.literal('multiple_faces'), v.literal('fullscreen_exit'), v.literal('idle')) },
	handler: async (ctx, a) => { const exam=await ctx.db.get(a.hostedExamId);const membership=exam&&await ctx.db.query('tenantMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',exam.tenantId).eq('userId',ctx.user._id)).unique();if(!exam||!membership||exam.status!=='live')throw new ConvexError('TENANT_FORBIDDEN');await ctx.db.insert('proctorEvents', { ...a, userId: ctx.user._id, at: Date.now() }); }
});
