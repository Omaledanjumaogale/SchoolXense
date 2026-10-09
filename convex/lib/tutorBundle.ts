import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { hasRole } from './access';
import { profileIsComplete, requireCapability } from './entitlements';
import { planById } from '../../src/lib/payments/plans';

export const SESSION_COUNT=6, SESSION_MS=45*60_000;
export const CHECKOUT_HOLD_MS=30*60_000;
export function activeHold(payment:{createdAt:number},now=Date.now()){return payment.createdAt+CHECKOUT_HOLD_MS>now;}
export async function unallocatedCredits(ctx:QueryCtx,tutorId:Id<'users'>,exclude?:Id<'tutorBundles'>){
 let count=0;for(const b of await ctx.db.query('tutorBundles').withIndex('by_tutor',q=>q.eq('tutorId',tutorId)).collect())if(b._id!==exclude&&b.expiresAt>Date.now()&&b.status!=='completed')count+=(await ctx.db.query('tutorBundleSessions').withIndex('by_bundle',q=>q.eq('bundleId',b._id)).collect()).filter(s=>s.status==='available').length;
 return count;
}
export async function policy(ctx:QueryCtx){return ctx.db.query('tutorBundlePolicy').withIndex('by_key',q=>q.eq('key','current')).unique();}
export async function eligible(ctx:QueryCtx,r:Doc<'tutorBundleRoster'>,minor=false,subject?:string,budget?:bigint){
 const p=await policy(ctx),o=await ctx.db.get(r.offerId),u=await ctx.db.get(r.tutorId);
 if((budget===undefined&&(!p?.enabled||r.sessionKobo!==p.sessionKobo))||(budget!==undefined&&r.sessionKobo!==budget)||!r.approved||!o?.active||o.kind!=='tutoring'||o.tutorId!==r.tutorId||!u||u.status!=='active'||u.isMinor||!u.authId||!profileIsComplete(u)||!(await hasRole(ctx,u._id,'tutor')))return false;
 try{await requireCapability(ctx,u._id,'market.earn');}catch{return false;}
 const checks=await ctx.db.query('verifications').withIndex('by_user',q=>q.eq('userId',u._id)).collect();
 if(!checks.some(x=>x.kind==='nin'&&x.status==='approved')||(minor&&(!o.minorsApproved||!checks.some(x=>x.kind==='safeguarding'&&x.status==='approved'))))return false;
 return !subject||o.subjects.some(s=>s.toLowerCase()===subject.toLowerCase());
}
export async function freeSlots(ctx:QueryCtx,r:Doc<'tutorBundleRoster'>,until=Date.now()+90*86400000){
 const sessions=await ctx.db.query('tutorBundleSessions').withIndex('by_tutor_start',q=>q.eq('tutorId',r.tutorId)).collect();
 const bookings=await ctx.db.query('bookings').withIndex('by_tutor_status',q=>q.eq('tutorId',r.tutorId)).collect();
 return r.slots.filter(s=>s>Date.now()+60*60_000&&s+SESSION_MS<=until&&!sessions.some(x=>x.startsAt&&['scheduled','under_review','disputed'].includes(x.status)&&Math.abs(x.startsAt-s)<SESSION_MS)&&!bookings.some(x=>['confirmed','pending_payment','awaiting_consent'].includes(x.status)&&Date.parse(x.slot)<s+SESSION_MS&&Date.parse(x.slot)+x.minutes*60000>s));
}
export async function receipt(ctx:QueryCtx,b:Doc<'tutorBundles'>){
 const p=await ctx.db.get(b.paymentId),plan=planById('plus_tutor');
 if(!p||p.status!=='successful'||!p.fulfilledAt||p.userId!==b.payerId||p.amount!==BigInt(plan!.priceKobo)||p.currency!=='NGN'||p.purpose!=='subscription'||p.refId!==`plus_tutor:${b.userId}`)throw new ConvexError('BUNDLE_PAYMENT_REQUIRED');
}
export async function createBundle(ctx:MutationCtx,p:Doc<'payments'>,beneficiary:Id<'users'>){
 if(await ctx.db.query('tutorBundles').withIndex('by_payment',q=>q.eq('paymentId',p._id)).unique())return;
 if(!p.bundleSessionKobo||p.bundleSessionKobo<=0n)throw new ConvexError('Tutor compensation requires reconciliation.');
 const id=await ctx.db.insert('tutorBundles',{userId:beneficiary,payerId:p.userId,paymentId:p._id,expiresAt:Date.now()+90*86400000,sessionKobo:p.bundleSessionKobo,status:'needs_preferences',guardianApproved:false});
 for(let ordinal=1;ordinal<=SESSION_COUNT;ordinal++)await ctx.db.insert('tutorBundleSessions',{bundleId:id,ordinal,status:'available'});
 await ctx.db.insert('notifications',{userId:beneficiary,title:'Your six tutor sessions are ready',body:'Choose your subject and learning goal to start tutor allocation.',href:'/tutor-bundle',read:false});
}
