import { internalQuery, internalMutation, internalAction, action } from './_generated/server';
import { internal, api } from './_generated/api';
import { v, ConvexError } from 'convex/values';
import { withAccess, audit, resolve } from './lib/access';
import { verifyEwinLink } from './lib/ewinLink';

const linkAssertion=v.object({version:v.literal(1),platformId:v.literal('schoolcbt'),platformSubject:v.string(),centralUserId:v.string(),linkId:v.string(),referralCode:v.string(),issuedAt:v.number(),expiresAt:v.number()});
export const persistAccountLink=internalMutation({args:{assertion:linkAssertion},handler:async(ctx,{assertion})=>{
 const {user}=await resolve(ctx);
 if(user.ecosystemId!==assertion.platformSubject)throw new ConvexError('Account link subject does not match this SchoolXense account.');
 const claimed=await ctx.db.query('users').withIndex('by_centralUserId',q=>q.eq('centralUserId',assertion.centralUserId)).unique();if(claimed&&claimed._id!==user._id)throw new ConvexError('This E-WIN account is already linked to another SchoolXense account.');
 if(user.centralUserId&&user.centralUserId!==assertion.centralUserId)throw new ConvexError('Disconnect the existing E-WIN account before linking another.');
 const firstLink=!user.centralUserId;await ctx.db.patch(user._id,{centralUserId:assertion.centralUserId,centralLinkId:assertion.linkId,centralLinkedAt:Date.now()});
 if(firstLink)await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'account.linked',subject:assertion.platformSubject,payload:{version:1,linkId:assertion.linkId,referralCode:assertion.referralCode},createdAt:Date.now()});
 return {linked:true,referralCode:assertion.referralCode};
}});
export const linkAccount=action({args:{assertion:linkAssertion,signature:v.string()},handler:async(ctx,a):Promise<{linked:boolean;referralCode:string}>=>{
 const profile=await ctx.runQuery(api.portal.profile,{});if(!profile)throw new ConvexError('ACCOUNT_REQUIRED');
 if(a.assertion.platformSubject!==profile.ecosystemId||!/^schoolxense:[A-Za-z0-9_-]{3,160}$/.test(a.assertion.platformSubject)||!/^[-A-Za-z0-9_]{1,80}$/.test(a.assertion.referralCode)||a.assertion.centralUserId.length>160||a.assertion.linkId.length>160)throw new ConvexError('Invalid E-WIN account link.');
 if(!await verifyEwinLink(a.assertion,a.signature,process.env.EWIN_SYNC_SECRET))throw new ConvexError('Invalid or expired E-WIN link signature.');
 return ctx.runMutation(internal.ecosystem.persistAccountLink,{assertion:a.assertion});
}});
export const pending=internalQuery({args:{},handler:ctx=>ctx.db.query('ecosystemEvents').withIndex('by_delivery',q=>q.eq('deliveredAt',undefined)).filter(q=>q.and(q.eq(q.field('quarantinedAt'),undefined),q.or(q.eq(q.field('nextAttemptAt'),undefined),q.lte(q.field('nextAttemptAt'),Date.now())))).take(25)});
export const acknowledge=internalMutation({args:{id:v.id('ecosystemEvents')},handler:async(ctx,{id})=>{const event=await ctx.db.get(id);if(event&&!event.deliveredAt)await ctx.db.patch(id,{deliveredAt:Date.now()});}});
export const failed=internalMutation({args:{id:v.id('ecosystemEvents'),reason:v.string(),permanent:v.boolean()},handler:async(ctx,a)=>{const event=await ctx.db.get(a.id);if(!event||event.deliveredAt)return;const attempts=(event.attempts??0)+1;await ctx.db.patch(a.id,{attempts,lastError:a.reason.slice(0,160),nextAttemptAt:Date.now()+Math.min(86400000,300000*2**Math.min(attempts,8)),quarantinedAt:a.permanent||attempts>=10?Date.now():undefined});}});
export const replay=withAccess({role:'staff'}).mutation({args:{id:v.id('ecosystemEvents'),note:v.string()},handler:async(ctx,a)=>{const row=await ctx.db.get(a.id);if(!row||row.deliveredAt||a.note.trim().length<10)throw new Error('An undelivered event and review rationale are required.');await ctx.db.patch(a.id,{attempts:0,nextAttemptAt:undefined,quarantinedAt:undefined,lastError:undefined});await audit(ctx,ctx.user._id,'ecosystem.replay',a.id,a.note.trim());}});
export const deliver=internalAction({args:{},handler:async(ctx):Promise<void>=>{
 if(process.env.EWIN_SYNC_ENABLED!=='true')return;
 const endpoint=process.env.EWIN_SYNC_ENDPOINT,secret=process.env.EWIN_SYNC_SECRET;
 if(!endpoint||!secret||new URL(endpoint).protocol!=='https:')throw new Error('An approved ecosystem endpoint and signing secret are required.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const events=await ctx.runQuery(internal.ecosystem.pending,{});
 for(const event of events){try{const timestamp=String(Date.now());const body=JSON.stringify({version:1,eventId:event.eventId,app:event.app,type:event.type,subject:event.subject,payload:event.payload,createdAt:event.createdAt});const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body));
 const signature=Array.from(new Uint8Array(sig),x=>x.toString(16).padStart(2,'0')).join('');
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-SchoolXense-Timestamp':timestamp,'X-SchoolXense-Event':event.eventId,'X-SchoolXense-Signature':signature},body,signal:AbortSignal.timeout(10000)});
 const receipt=await response.json().catch(()=>null);if(!response.ok||receipt?.acceptedEventId!==event.eventId){await ctx.runMutation(internal.ecosystem.failed,{id:event._id,reason:`HTTP ${response.status}: receipt not accepted`,permanent:[400,413,422].includes(response.status)});continue;}await ctx.runMutation(internal.ecosystem.acknowledge,{id:event._id});
 }catch{await ctx.runMutation(internal.ecosystem.failed,{id:event._id,reason:'Transport unavailable or timed out',permanent:false});}
 }
}});
