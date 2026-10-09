import { ConvexError } from 'convex/values';
import type { QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { hasRole } from './access';
import { profileIsComplete, requireCapability } from './entitlements';

export async function eligibleTutor(ctx:QueryCtx,offer:Doc<'offers'>,minor:boolean){
 const tutor=await ctx.db.get(offer.tutorId),staff=await hasRole(ctx,offer.tutorId,'staff');
 if(!offer.active||offer.kind!=='tutoring'||!tutor||tutor.status!=='active'||tutor.isMinor||(!staff&&(!profileIsComplete(tutor)||!await hasRole(ctx,tutor._id,'tutor'))))throw new ConvexError('OFFER_UNAVAILABLE');
 await requireCapability(ctx,offer.tutorId,'market.earn');
 const checks=await ctx.db.query('verifications').withIndex('by_user',q=>q.eq('userId',offer.tutorId)).collect();
 if(!staff&&!checks.some(x=>x.kind==='nin'&&x.status==='approved'))throw new ConvexError('IDENTITY_APPROVAL_REQUIRED');
 if(minor&&(!offer.minorsApproved||!checks.some(x=>x.kind==='safeguarding'&&x.status==='approved')))throw new ConvexError('MINOR_SAFETY');
}
export async function reserveSlot(ctx:QueryCtx,offer:Doc<'offers'>,starts:number,minutes:number,exclude?:Id<'bookings'>){
 if(!offer.availability.some(s=>Date.parse(s)===starts))throw new ConvexError('SLOT_NOT_OFFERED');
 const end=starts+minutes*60000;
 const bookings=await ctx.db.query('bookings').withIndex('by_tutor_status',q=>q.eq('tutorId',offer.tutorId)).collect();
 if(bookings.some(b=>b._id!==exclude&&['pending_payment','awaiting_consent','confirmed','delivered','disputed'].includes(b.status)&&Date.parse(b.slot)<end&&Date.parse(b.slot)+b.minutes*60000>starts))throw new ConvexError('SLOT_ALREADY_RESERVED');
 const sessions=await ctx.db.query('tutorBundleSessions').withIndex('by_tutor_start',q=>q.eq('tutorId',offer.tutorId)).collect();
 if(sessions.some(s=>s.startsAt!==undefined&&['scheduled','under_review','disputed'].includes(s.status)&&s.startsAt<end&&s.startsAt+45*60000>starts))throw new ConvexError('SLOT_ALREADY_RESERVED');
}
