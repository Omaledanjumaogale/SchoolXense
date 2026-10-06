import { mutation,query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { resolve, audit } from './lib/access';
import { nigeria } from '../src/lib/data/nigeria';
export const grantStaff=mutation({args:{userId:v.id('users'),note:v.string()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});if(user.email?.toLowerCase()!==process.env.SUPER_ADMIN_EMAIL?.toLowerCase())throw new ConvexError('Only the nominated owner may appoint administrators.');
 const target=await ctx.db.get(a.userId);if(!target?.authId||target.status!=='active'||target.isMinor||a.note.trim().length<10||a.note.length>1000)throw new ConvexError('Choose an active adult account and record appointment rationale.');
 const existing=await ctx.db.query('roles').withIndex('by_user_role',q=>q.eq('userId',a.userId).eq('role','staff')).unique();if(!existing)await ctx.db.insert('roles',{userId:a.userId,role:'staff',grantedBy:user._id,grantedAt:Date.now()});await audit(ctx,user._id,'staff.appoint',a.userId,a.note.trim());
}});
export const createInstitution=mutation({args:{name:v.string(),slug:v.string(),state:v.string(),adminEmail:v.string(),seats:v.number()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});if(a.name.trim().length<3||a.name.length>150||!/^[a-z0-9-]{3,50}$/.test(a.slug)||!nigeria[a.state]||!Number.isInteger(a.seats)||a.seats<1||a.seats>1000)throw new ConvexError('Check institution name, slug, state and seats.');
 if(await ctx.db.query('tenants').withIndex('by_slug',q=>q.eq('slug',a.slug)).unique())throw new ConvexError('Institution slug is already used.');
 const admin=await ctx.db.query('users').withIndex('email',q=>q.eq('email',a.adminEmail.trim().toLowerCase())).unique();if(!admin?.authId||admin.status!=='active'||admin.isMinor)throw new ConvexError('The administrator must first create and verify an adult SchoolXense account.');
 const id=await ctx.db.insert('tenants',{name:a.name.trim(),slug:a.slug,state:a.state,kind:'school',subdomain:a.slug});
 await ctx.db.insert('tenantMembers',{tenantId:id,userId:admin._id,kind:'staff'});if(!await ctx.db.query('roles').withIndex('by_user_role',q=>q.eq('userId',admin._id).eq('role','instadmin')).unique())await ctx.db.insert('roles',{userId:admin._id,role:'instadmin',grantedBy:user._id,grantedAt:Date.now()});
 await ctx.db.insert('licences',{tenantId:id,seats:a.seats,modules:['secondary'],startsAt:Date.now(),endsAt:Date.now()+30*86400000,priceKobo:0n});await audit(ctx,user._id,'institution.trial_created',id,'30-day trial; no payment entitlement implied.');return id;
}});
export const health=query({args:{},handler:async ctx=>{
 await resolve(ctx,{role:'staff'});await ctx.db.query('featureFlags').first();
 const run=await ctx.db.query('aiRuns').withIndex('by_time').order('desc').first();
 const bundlePolicy=await ctx.db.query('tutorBundlePolicy').withIndex('by_key',q=>q.eq('key','current')).unique();
 return {checkedAt:Date.now(),database:{status:'connected',detail:'Authenticated Convex database query succeeded.'},
 ai:{status:process.env.AGNES_AI_KEY?'configured':'missing',detail:run?`Last live generation ${run.status} via ${run.provider} (${run.model}); ${run.stored} validated drafts stored at ${new Date(run.checkedAt).toISOString()}. ${run.primaryFailed?(run.provider==='workers_ai'?'AGNES failed; Workers AI fallback attempted.':'AGNES failed; fallback unavailable.'):''}`:'AGNES primary; no live generation result recorded.',fallbackConfigured:!!(process.env.CLOUDFLARE_AI_TOKEN&&process.env.CLOUDFLARE_ACCOUNT_ID),lastRun:run?{status:run.status,provider:run.provider,model:run.model,stored:run.stored,checkedAt:run.checkedAt,durationMs:run.durationMs,primaryFailed:run.primaryFailed}:null},
 email:{status:process.env.RESEND_API_KEY&&process.env.RESEND_FROM?'configured':'missing',detail:'Resend verification and recovery. Delivery requires recipient confirmation.'},
 payments:{status:process.env.PAYMENTS_ENABLED==='true'&&process.env.FLW_SECRET_KEY?'configured':'disabled',detail:'Server-priced orders and provider verification; disabled until payment acceptance checks pass.'},
 tutoring:{status:bundlePolicy?.enabled?'enabled':'awaiting_approval',detail:bundlePolicy?`Session budget approved: ${Number(bundlePolicy.sessionKobo)/100} NGN before Hive Share. Tutor capacity and payment activation are separate checks.`:'Compensation is unset. An administrator must approve the policy and verified tutor capacity before bundle purchases.'},
 identity:{status:process.env.NIN_ENCRYPTION_KEY?'configured':'missing',detail:'Private AES-GCM identity storage.'},
 ecosystem:{status:process.env.EWIN_SYNC_ENABLED==='true'?'enabled':'opt_in',detail:'E-WIN connection supports member-authorized record imports. Cash settlement is separate.'}};
}});
export const queueDecision=mutation({args:{kind:v.union(v.literal('support'),v.literal('report')),id:v.string(),status:v.union(v.literal('under_review'),v.literal('resolved'),v.literal('open')),note:v.string(),expectedStatus:v.string()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});if(a.note.trim().length<10||a.note.length>1000)throw new ConvexError('Include a decision rationale of 10–1,000 characters.');
 if(a.kind==='support'){const id=ctx.db.normalizeId('supportTickets',a.id);const row=id&&await ctx.db.get(id);if(!row||row.status!==a.expectedStatus)throw new ConvexError('This ticket has changed. Refresh before deciding.');if(a.status===row.status)throw new ConvexError('Choose a different status.');await ctx.db.patch(row._id,{status:a.status});await ctx.db.insert('notifications',{userId:row.userId,title:'Support request updated',body:`${row.subject}: ${a.status.replaceAll('_',' ')}. ${a.note.trim()}`,read:false});}
 else{const id=ctx.db.normalizeId('reports',a.id);const row=id&&await ctx.db.get(id);if(!row||row.status!==a.expectedStatus)throw new ConvexError('This report has changed. Refresh before deciding.');if(a.status===row.status)throw new ConvexError('Choose a different status.');await ctx.db.patch(row._id,{status:a.status});}
 await audit(ctx,user._id,`${a.kind}.${a.status}`,a.id,a.note.trim());
}});
export const startVerification=mutation({args:{id:v.id('verifications')},handler:async(ctx,a)=>{const {user}=await resolve(ctx,{role:'staff'});const row=await ctx.db.get(a.id);if(!row||row.status!=='pending'||row.userId===user._id)throw new ConvexError('An independent reviewer and pending request are required.');await ctx.db.patch(a.id,{status:'under_review'});await audit(ctx,user._id,'verification.under_review',a.id);}});
export const reviewQuestion=mutation({args:{id:v.id('questions'),approve:v.boolean()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});const question=await ctx.db.get(a.id);
 if(!question||question.status!=='unreviewed')throw new ConvexError('Question is no longer awaiting review.');
 if(question.authorId===user._id)throw new ConvexError('A different reviewer must approve your content.');
 await ctx.db.patch(a.id,{status:a.approve?'reviewed':'retired'});
 await audit(ctx,user._id,'question.review',a.id,a.approve?'approved':'retired');
}});
export const reviewVerification=mutation({args:{id:v.id('verifications'),approve:v.boolean(),note:v.string()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});const verification=await ctx.db.get(a.id);
 if(!verification||!['pending','under_review'].includes(verification.status)||verification.userId===user._id)throw new ConvexError('An independent reviewer is required.');
 if(a.note.trim().length<10||a.note.length>1000)throw new ConvexError('Include your verification evidence and decision.');
 await ctx.db.patch(a.id,{status:a.approve?'approved':'rejected',decidedBy:user._id,note:a.note.trim()});
 await audit(ctx,user._id,'verification.review',a.id,a.approve?'approved':'rejected');
}});
export const accountStatus=mutation({args:{id:v.id('users'),status:v.union(v.literal('active'),v.literal('paused'),v.literal('suspended'))},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});const target=await ctx.db.get(a.id);
 if(!target||target._id===user._id||target.email?.toLowerCase()===process.env.SUPER_ADMIN_EMAIL?.toLowerCase())throw new ConvexError('The nominated owner account is protected.');
 await ctx.db.patch(a.id,{status:a.status});
 if(a.status!=='active')for(const offer of await ctx.db.query('offers').withIndex('by_tutor',q=>q.eq('tutorId',a.id)).take(100))await ctx.db.patch(offer._id,{active:false});
 await audit(ctx,user._id,'account.status',a.id,a.status);
}});
export const testimonial=mutation({args:{name:v.string(),role:v.string(),quote:v.string(),example:v.boolean(),hasConsent:v.boolean()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});
 if(!a.hasConsent||a.name.length<2||a.name.length>100||a.role.length>100||a.quote.length<20||a.quote.length>1500)throw new ConvexError('Consent and valid testimonial details are required.');
 const {hasConsent,...record}=a;const id=await ctx.db.insert('testimonials',{...record,approved:true});await audit(ctx,user._id,'testimonial.publish',id,a.example?'example':'customer consent attested');return id;
}});
