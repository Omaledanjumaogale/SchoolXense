import { query, mutation, type QueryCtx, type MutationCtx } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { resolve, hasRole, audit } from './lib/access';
import { policy, eligible, receipt, freeSlots, SESSION_MS, unallocatedCredits } from './lib/tutorBundle';
import { requireCapability, entitlement } from './lib/entitlements';
import { screen } from '../src/lib/engines/integrity';
import { BUNDLE_RESOURCES, BUNDLE_GUIDE } from '../src/lib/tutor-bundle/resources';

async function access(ctx:QueryCtx,bundleId:Id<'tutorBundles'>,active=false){
 const {user}=await resolve(ctx),b=await ctx.db.get(bundleId),staff=await hasRole(ctx,user._id,'staff');
 if(!b)throw new ConvexError('BUNDLE_UNAVAILABLE');
 const learner=await ctx.db.get(b.userId),links=learner?.isMinor?await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',b.userId)).collect():[];
 const guardian=links.some(x=>x.guardianId===user._id);
 if(!staff&&user._id!==b.userId&&user._id!==b.tutorId&&!guardian)throw new ConvexError('FORBIDDEN');
 await receipt(ctx,b);
 if(active&&b.expiresAt<=Date.now())throw new ConvexError('BUNDLE_EXPIRED');
 if(active&&!staff)await requireCapability(ctx,b.userId,'tutor.priority');
 return {user,b,staff,guardian,learner};
}
async function notify(ctx:MutationCtx,b:Doc<'tutorBundles'>,title:string,body:string){for(const userId of new Set([b.userId,b.payerId,...(b.tutorId?[b.tutorId]:[])]))await ctx.db.insert('notifications',{userId,title,body,href:'/tutor-bundle',read:false});}
function text(value:string,min=2,max=2000){if(value.trim().length<min||value.length>max||!screen(value).allowed)throw new ConvexError('Provide original learning content within the stated length.');return value.trim();}
async function sessionAccess(ctx:QueryCtx,id:Id<'tutorBundleSessions'>,active=true){const s=await ctx.db.get(id);if(!s)throw new ConvexError('SESSION_UNAVAILABLE');return {...await access(ctx,s.bundleId,active),s};}

export const dashboard=query({args:{},handler:async ctx=>{
 const {user}=await resolve(ctx),staff=await hasRole(ctx,user._id,'staff');
 const own=staff?await ctx.db.query('tutorBundles').order('desc').take(100):await ctx.db.query('tutorBundles').withIndex('by_user',q=>q.eq('userId',user._id)).take(50);
 const teaching=staff?[]:await ctx.db.query('tutorBundles').withIndex('by_tutor',q=>q.eq('tutorId',user._id)).take(50);
 const links=await ctx.db.query('guardianLinks').withIndex('by_guardian',q=>q.eq('guardianId',user._id)).take(50);
 const children=(await Promise.all(links.map(x=>ctx.db.query('tutorBundles').withIndex('by_user',q=>q.eq('userId',x.childId)).take(20)))).flat();
 const roster=staff?await ctx.db.query('tutorBundleRoster').take(300):await ctx.db.query('tutorBundleRoster').withIndex('by_tutor',q=>q.eq('tutorId',user._id)).take(50);
 const allRoster=await ctx.db.query('tutorBundleRoster').take(300);
 const bundles=await Promise.all([...new Map([...own,...teaching,...children].map(x=>[x._id,x])).values()].map(async b=>{
  let paid=true;try{await receipt(ctx,b);}catch{paid=false;}
  const current=await entitlement(ctx,b.userId),canUse=staff||current.active&&current.capabilities.includes('tutor.priority');
  const sessions=await ctx.db.query('tutorBundleSessions').withIndex('by_bundle',q=>q.eq('bundleId',b._id)).collect();
  const learner=await ctx.db.get(b.userId),tutor=b.tutorId?await ctx.db.get(b.tutorId):null;
  const row=b.offerId?allRoster.find(r=>r.offerId===b.offerId):undefined;
  const tutorValid=row?await eligible(ctx,row,learner?.isMinor,b.subject,b.sessionKobo):false;
  const candidates=[];if(staff&&b.subject)for(const r of allRoster)if(await eligible(ctx,r,learner?.isMinor,b.subject,b.sessionKobo))candidates.push({offerId:r.offerId,name:(await ctx.db.get(r.tutorId))?.name??'Tutor',capacity:r.capacity});
  return {...b,paid,canUse,guardian:links.some(x=>x.childId===b.userId),expired:b.expiresAt<=Date.now(),learnerName:learner?.name??'Learner',tutorName:tutor?.name??'Awaiting allocation',tutorValid,candidates,slots:canUse&&tutorValid?await freeSlots(ctx,row!,b.expiresAt):[],sessions:sessions.sort((a,c)=>a.ordinal-c.ordinal).map(s=>({...s,meetingUrl:paid&&canUse&&b.expiresAt>Date.now()&&b.guardianApproved&&tutorValid&&s.status==='scheduled'&&s.startsAt&&Date.now()>=s.startsAt-15*60_000&&Date.now()<=s.startsAt+SESSION_MS+30*60_000?s.meetingUrl:undefined}))};
 }));
 return {userId:user._id,staff,tutor:await hasRole(ctx,user._id,'tutor'),policy:await policy(ctx),bundles,roster,offers:staff?await ctx.db.query('offers').withIndex('by_active_kind',q=>q.eq('active',true)).take(300):await ctx.db.query('offers').withIndex('by_tutor',q=>q.eq('tutorId',user._id)).take(50),resources:BUNDLE_RESOURCES,guide:BUNDLE_GUIDE};
}});

export const configure=mutation({args:{enabled:v.boolean(),sessionKobo:v.int64()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'});if(a.sessionKobo<50000n||a.sessionKobo*6n>=2500000n)throw new ConvexError('Set a session budget from ₦500, leaving a positive learning allocation.');
 const p=await policy(ctx);if(p)await ctx.db.patch(p._id,{...a,approvedBy:user._id,updatedAt:Date.now()});else await ctx.db.insert('tutorBundlePolicy',{key:'current',...a,approvedBy:user._id,updatedAt:Date.now()});
 await audit(ctx,user._id,'tutor_bundle.policy','current',`${a.enabled?'enabled':'paused'}; ${a.sessionKobo} kobo per session before Hive Share.`);
}});
export const availability=mutation({args:{offerId:v.id('offers'),capacity:v.number(),slots:v.array(v.number())},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'tutor',adultOnly:true}),o=await ctx.db.get(a.offerId),p=await policy(ctx);
 if(!o||o.tutorId!==user._id||!o.active||o.kind!=='tutoring'||!p||!Number.isInteger(a.capacity)||a.capacity<1||a.capacity>30||a.slots.length<6||a.slots.length>100||a.slots.some(s=>!Number.isSafeInteger(s)||s<Date.now()||s>Date.now()+180*86400000))throw new ConvexError('Choose your active tutoring offer, capacity 1–30 and 6–100 future slots. Compensation must first be configured.');
 const slots=[...new Set(a.slots)].sort((a,b)=>a-b);if(slots.length!==a.slots.length||slots.some((s,i)=>i>0&&s-slots[i-1]<SESSION_MS))throw new ConvexError('Tutor slots must be unique and at least 45 minutes apart.');
 const row=await ctx.db.query('tutorBundleRoster').withIndex('by_offer',q=>q.eq('offerId',a.offerId)).unique();
 const data={offerId:a.offerId,tutorId:user._id,capacity:a.capacity,slots,sessionKobo:p.sessionKobo,approved:false};
 const id=row?(await ctx.db.patch(row._id,data),row._id):await ctx.db.insert('tutorBundleRoster',data);await audit(ctx,user._id,'tutor_bundle.availability',id,'Tutor accepted the current per-session budget; staff approval required.');return id;
}});
export const approveRoster=mutation({args:{id:v.id('tutorBundleRoster'),approved:v.boolean()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{role:'staff'}),r=await ctx.db.get(a.id);if(!r)throw new ConvexError('ROSTER_UNAVAILABLE');if(a.approved&&r.tutorId===user._id)throw new ConvexError('An independent administrator must approve your tutor capacity.');
 // Eligibility includes trusted tutor identity and independent safeguarding decisions.
 if(a.approved&&!(await eligible(ctx,{...r,approved:true})))throw new ConvexError('An active, identity-verified tutor must accept the enabled compensation policy first.');
 await ctx.db.patch(a.id,{approved:a.approved});await audit(ctx,user._id,'tutor_bundle.roster',a.id,a.approved?'approved':'paused');
}});
export const preferences=mutation({args:{bundleId:v.id('tutorBundles'),subject:v.string(),goal:v.string()},handler:async(ctx,a)=>{
 const {user,b,staff,guardian}=await access(ctx,a.bundleId,true);if(!staff&&user._id!==b.userId&&!guardian)throw new ConvexError('FORBIDDEN');
 if(b.status!=='needs_preferences'&&b.status!=='awaiting_tutor')throw new ConvexError('Ask an administrator before changing an allocated subject.');
 await ctx.db.patch(b._id,{subject:text(a.subject,2,120),goal:text(a.goal,10,1000),status:'awaiting_tutor'});await notify(ctx,b,'Tutor matching requested','Your subject and goal are ready for administrator allocation.');await audit(ctx,user._id,'tutor_bundle.preferences',b._id);
}});
export const allocate=mutation({args:{bundleId:v.id('tutorBundles'),offerId:v.id('offers'),note:v.string()},handler:async(ctx,a)=>{
 const {user,b,staff,learner}=await access(ctx,a.bundleId,true);if(!staff)throw new ConvexError('FORBIDDEN');
 const r=await ctx.db.query('tutorBundleRoster').withIndex('by_offer',q=>q.eq('offerId',a.offerId)).unique();
 if(b.status==='completed'||!b.subject||!r||r.tutorId===b.userId||!await eligible(ctx,r,learner?.isMinor,b.subject,b.sessionKobo))throw new ConvexError('Choose an approved tutor matching the subject, compensation and safeguarding requirements.');
 text(a.note,10,1000);
 const sessions=await ctx.db.query('tutorBundleSessions').withIndex('by_bundle',q=>q.eq('bundleId',b._id)).collect();if(sessions.some(s=>s.status!=='available'&&s.status!=='completed'))throw new ConvexError('Resolve scheduled or disputed sessions before reallocating.');
 const active=(await ctx.db.query('tutorBundles').withIndex('by_tutor',q=>q.eq('tutorId',r.tutorId)).collect()).filter(x=>x._id!==b._id&&x.status!=='completed'&&x.expiresAt>Date.now());
 if(active.length>=r.capacity||(await freeSlots(ctx,r,b.expiresAt)).length-await unallocatedCredits(ctx,r.tutorId,b._id)<sessions.filter(s=>s.status==='available').length)throw new ConvexError('TUTOR_CAPACITY_REACHED');
 await ctx.db.patch(b._id,{offerId:r.offerId,tutorId:r.tutorId,status:'allocated',guardianApproved:!learner?.isMinor});await notify(ctx,{...b,tutorId:r.tutorId},'Tutor allocated','Your tutor is ready. Under-18 learners need guardian approval before scheduling.');await audit(ctx,user._id,'tutor_bundle.allocate',b._id,a.note.trim());
}});
export const consent=mutation({args:{bundleId:v.id('tutorBundles')},handler:async(ctx,a)=>{const {user,b,guardian,learner}=await access(ctx,a.bundleId,true);if(!guardian||!learner?.isMinor||b.status!=='allocated')throw new ConvexError('LINKED_GUARDIAN_REQUIRED');await ctx.db.patch(b._id,{guardianApproved:true});await audit(ctx,user._id,'tutor_bundle.guardian_consent',b._id,b.tutorId);}});

export const schedule=mutation({args:{sessionId:v.id('tutorBundleSessions'),startsAt:v.number()},handler:async(ctx,a)=>{
 const {user,b,s,staff,guardian,learner}=await sessionAccess(ctx,a.sessionId);if(!staff&&user._id!==b.userId&&!guardian)throw new ConvexError('FORBIDDEN');
 if(!staff)await requireCapability(ctx,b.userId,'tutor.priority');
 if(s.status!=='available'||b.status!=='allocated'||!b.guardianApproved||!b.offerId||!b.tutorId)throw new ConvexError('ALLOCATION_AND_CONSENT_REQUIRED');
 const r=await ctx.db.query('tutorBundleRoster').withIndex('by_offer',q=>q.eq('offerId',b.offerId!)).unique();
 if(!r||!await eligible(ctx,r,learner?.isMinor,b.subject,b.sessionKobo)||!r.slots.includes(a.startsAt)||a.startsAt<Date.now()+60*60_000||a.startsAt+SESSION_MS>b.expiresAt)throw new ConvexError('Select an available tutor slot at least an hour ahead and within the bundle period.');
 const all=await ctx.db.query('tutorBundleSessions').withIndex('by_tutor_start',q=>q.eq('tutorId',b.tutorId!)).collect();
 const regular=await ctx.db.query('bookings').withIndex('by_tutor_status',q=>q.eq('tutorId',b.tutorId!)).collect();
 const mine=await ctx.db.query('tutorBundles').withIndex('by_user',q=>q.eq('userId',b.userId)).collect();
 const learnerSessions=(await Promise.all(mine.map(x=>ctx.db.query('tutorBundleSessions').withIndex('by_bundle',q=>q.eq('bundleId',x._id)).collect()))).flat();
 if([...all,...learnerSessions].some(x=>x.startsAt&&['scheduled','under_review','disputed'].includes(x.status)&&Math.abs(x.startsAt-a.startsAt)<SESSION_MS)||regular.some(x=>['confirmed','pending_payment','awaiting_consent'].includes(x.status)&&Date.parse(x.slot)<a.startsAt+SESSION_MS&&Date.parse(x.slot)+x.minutes*60000>a.startsAt))throw new ConvexError('SLOT_ALREADY_RESERVED');
 const links=learner?.isMinor?await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',b.userId)).collect():[];
 if(learner?.isMinor&&!links.length)throw new ConvexError('NO_GUARDIAN');
 const threadId=await ctx.db.insert('threads',{title:`Tutor bundle · ${b.subject} · session ${s.ordinal}`,kind:'tutor_bundle',refId:s._id,participants:[b.userId,b.tutorId,...links.map(x=>x.guardianId)],guardianIncluded:!!learner?.isMinor});
 await ctx.db.patch(s._id,{status:'scheduled',startsAt:a.startsAt,tutorId:b.tutorId,threadId,meetingUrl:undefined});await notify(ctx,b,'Tutor session scheduled',`Session ${s.ordinal}: ${new Date(a.startsAt).toISOString()}. Your guardian is included where required.`);await audit(ctx,user._id,'tutor_bundle.schedule',s._id);
}});
export const cancel=mutation({args:{sessionId:v.id('tutorBundleSessions')},handler:async(ctx,a)=>{
 const {user,b,s,staff,guardian}=await sessionAccess(ctx,a.sessionId);if(!staff&&user._id!==b.userId&&!guardian)throw new ConvexError('FORBIDDEN');
 if(s.status!=='scheduled'||!s.startsAt||(!staff&&s.startsAt-Date.now()<24*60*60_000))throw new ConvexError('Changes within 24 hours require administrator review.');
 await ctx.db.patch(s._id,{status:'available',startsAt:undefined,tutorId:undefined,meetingUrl:undefined,threadId:undefined});await notify(ctx,b,'Session returned to your bundle','The session credit is available to schedule again.');await audit(ctx,user._id,'tutor_bundle.cancel',s._id);
}});
export const meeting=mutation({args:{sessionId:v.id('tutorBundleSessions'),url:v.string()},handler:async(ctx,a)=>{
 await resolve(ctx,{role:'tutor',adultOnly:true,capability:'market.earn'});
 const {user,b,s}=await sessionAccess(ctx,a.sessionId);if(user._id!==b.tutorId||s.status!=='scheduled')throw new ConvexError('ASSIGNED_TUTOR_REQUIRED');
 let url:URL;try{url=new URL(a.url);}catch{throw new ConvexError('INVALID_MEETING_URL');}
 if(a.url.length>1000||url.protocol!=='https:'||url.username||url.password||!['meet.google.com','zoom.us'].includes(url.hostname)&&!url.hostname.endsWith('.zoom.us'))throw new ConvexError('Use a secure Google Meet or Zoom meeting link with guardian participation.');
 await ctx.db.patch(s._id,{meetingUrl:url.toString()});await audit(ctx,user._id,'tutor_bundle.meeting',s._id);
}});
export const draft=mutation({args:{sessionId:v.id('tutorBundleSessions'),draft:v.string(),ownWork:v.boolean()},handler:async(ctx,a)=>{const {user,b,s}=await sessionAccess(ctx,a.sessionId);if(user._id!==b.userId||!a.ownWork||s.status!=='scheduled')throw new ConvexError('Submit only your own draft to a scheduled session.');await ctx.db.patch(s._id,{draft:text(a.draft,20,10000),feedback:undefined});await audit(ctx,user._id,'tutor_bundle.draft',s._id);}});
export const report=mutation({args:{sessionId:v.id('tutorBundleSessions'),covered:v.string(),progress:v.string(),homework:v.string(),feedback:v.string()},handler:async(ctx,a)=>{
 await resolve(ctx,{role:'tutor',adultOnly:true,capability:'market.earn'});
 const {user,b,s}=await sessionAccess(ctx,a.sessionId);if(user._id!==b.tutorId||s.status!=='scheduled'||!s.startsAt||Date.now()<s.startsAt+SESSION_MS)throw new ConvexError('An assigned tutor may report after the 45-minute session.');
 const report={covered:text(a.covered,10),progress:text(a.progress,10),homework:text(a.homework,10)},feedback=s.draft?text(a.feedback,10,4000):undefined;
 await ctx.db.patch(s._id,{report,feedback,status:'under_review',deliveredAt:Date.now(),meetingUrl:undefined});await notify(ctx,b,'Tutor report ready','Review the report and draft feedback, then confirm delivery or open a dispute.');await audit(ctx,user._id,'tutor_bundle.report',s._id);
}});
async function complete(ctx:MutationCtx,b:Doc<'tutorBundles'>,s:Doc<'tutorBundleSessions'>){
 const e=await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',`bundle:${b.paymentId}:${s.ordinal}`)).unique();if(!e||e.amount!==b.sessionKobo||e.paymentId!==b.paymentId||!['held','disputed'].includes(e.status)||!s.tutorId||!s.report)throw new ConvexError('Session funding and report require reconciliation.');
 await ctx.db.patch(e._id,{status:'held',recipients:{earner:s.tutorId}});await ctx.db.patch(s._id,{status:'completed',confirmedAt:Date.now()});await ctx.scheduler.runAfter(0,internal.money.releaseEscrow,{escrowId:e._id});
 const sessions=await ctx.db.query('tutorBundleSessions').withIndex('by_bundle',q=>q.eq('bundleId',b._id)).collect();if(sessions.every(x=>x._id===s._id||x.status==='completed'))await ctx.db.patch(b._id,{status:'completed'});
}
export const confirm=mutation({args:{sessionId:v.id('tutorBundleSessions')},handler:async(ctx,a)=>{const {user,b,s,guardian}=await sessionAccess(ctx,a.sessionId,false);if(user._id!==b.userId&&!guardian||s.status!=='under_review')throw new ConvexError('LEARNER_CONFIRMATION_REQUIRED');await complete(ctx,b,s);await notify(ctx,b,'Session confirmed','One of your six session credits is completed.');await audit(ctx,user._id,'tutor_bundle.confirm',s._id);}});
export const dispute=mutation({args:{sessionId:v.id('tutorBundleSessions'),reason:v.string()},handler:async(ctx,a)=>{const {user,b,s,guardian}=await sessionAccess(ctx,a.sessionId,false);if(user._id!==b.userId&&!guardian||!['scheduled','under_review'].includes(s.status))throw new ConvexError('FORBIDDEN');const reason=text(a.reason,10);const e=await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',`bundle:${b.paymentId}:${s.ordinal}`)).unique();if(e?.status==='held')await ctx.db.patch(e._id,{status:'disputed'});await ctx.db.patch(s._id,{status:'disputed',dispute:reason,meetingUrl:undefined});await audit(ctx,user._id,'tutor_bundle.dispute',s._id,reason);}});
export const resolveDispute=mutation({args:{sessionId:v.id('tutorBundleSessions'),decision:v.union(v.literal('restore_credit'),v.literal('confirm_delivery')),note:v.string()},handler:async(ctx,a)=>{
 const {user,b,s,staff}=await sessionAccess(ctx,a.sessionId,false);if(!staff||s.status!=='disputed'||s.tutorId===user._id||b.userId===user._id||b.payerId===user._id)throw new ConvexError('INDEPENDENT_STAFF_REVIEW_REQUIRED');text(a.note,10);
 if(a.decision==='confirm_delivery')await complete(ctx,b,s);
 else{const e=await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',`bundle:${b.paymentId}:${s.ordinal}`)).unique();if(e?.status!=='disputed')throw new ConvexError('FUNDING_RECONCILIATION_REQUIRED');await ctx.db.patch(e._id,{status:'held'});await ctx.db.patch(s._id,{status:'available',tutorId:undefined,startsAt:undefined,meetingUrl:undefined,report:undefined,feedback:undefined,deliveredAt:undefined,threadId:undefined,dispute:undefined});}
 await notify(ctx,b,'Session dispute reviewed',a.note.trim());await audit(ctx,user._id,`tutor_bundle.${a.decision}`,s._id,a.note.trim());
}});
