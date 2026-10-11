import {v,ConvexError} from 'convex/values';
import {mutation,query,internalMutation,internalQuery} from './_generated/server';
import {internal} from './_generated/api';
import {resolve} from './lib/access';
export function validPushEndpoint(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.port===''&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}}
export const configuration=query({args:{},handler:async ctx=>{await resolve(ctx);return {publicKey:process.env.WEB_PUSH_PUBLIC_KEY??null,enabled:process.env.APP_ENV!=='preview'&&!!process.env.WEB_PUSH_PRIVATE_KEY};}});
export const subscribe=mutation({args:{endpoint:v.string(),p256dh:v.string(),auth:v.string(),locale:v.string()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx);if(!validPushEndpoint(a.endpoint)||a.endpoint.length>2048||!/^[\w-]{86,90}$/.test(a.p256dh)||!/^[\w-]{20,24}$/.test(a.auth)||!['en','ha','ig','yo','fr','ar','pt','sw'].includes(a.locale))throw new ConvexError('INVALID_PUSH_SUBSCRIPTION');
 const previous=await ctx.db.query('pushSubscriptions').withIndex('by_endpoint',q=>q.eq('endpoint',a.endpoint)).unique();
 if(previous&&previous.userId!==user._id)throw new ConvexError('Unsubscribe this browser before switching accounts.');
 const rows=await ctx.db.query('pushSubscriptions').withIndex('by_user',q=>q.eq('userId',user._id)).collect();if(!previous&&rows.filter(x=>x.active).length>=5)throw new ConvexError('Remove an existing device before adding another.');
 const values={...a,userId:user._id,active:true,since:Date.now(),checkedAt:Date.now(),failures:0,leaseUntil:undefined};if(previous)await ctx.db.patch(previous._id,values);else await ctx.db.insert('pushSubscriptions',values);
}});
export const unsubscribe=mutation({args:{endpoint:v.string()},handler:async(ctx,a)=>{const {user}=await resolve(ctx);const p=await ctx.db.query('pushSubscriptions').withIndex('by_endpoint',q=>q.eq('endpoint',a.endpoint)).unique();if(p?.userId===user._id)await ctx.db.patch(p._id,{active:false,auth:'',p256dh:''});}});
export const dispatch=internalMutation({args:{},handler:async ctx=>{
 if(process.env.APP_ENV==='preview'||!process.env.WEB_PUSH_PRIVATE_KEY)return;
 const now=Date.now(),rows=await ctx.db.query('pushSubscriptions').withIndex('by_check',q=>q.eq('active',true).lt('checkedAt',now-60000)).take(100);
 for(const p of rows){if((p.leaseUntil??0)>now)continue;const user=await ctx.db.get(p.userId);if(user?.status!=='active'){await ctx.db.patch(p._id,{active:false});continue;}
 const items=await ctx.db.query('notifications').withIndex('by_user_time',q=>q.eq('userId',p.userId).gt('_creationTime',p.since)).order('desc').take(20);
 if(!items.length){await ctx.db.patch(p._id,{checkedAt:now});continue;}
 const until=items[0]._creationTime;await ctx.db.patch(p._id,{leaseUntil:now+60000,checkedAt:now});await ctx.scheduler.runAfter(0,internal.pushDelivery.send,{id:p._id,until,endpoint:p.endpoint,p256dh:p.p256dh,auth:p.auth,locale:p.locale});
 }
}});
export const outcome=internalMutation({args:{id:v.id('pushSubscriptions'),until:v.number(),status:v.number()},handler:async(ctx,a)=>{const p=await ctx.db.get(a.id);if(!p)return;const ok=a.status>=200&&a.status<300;await ctx.db.patch(p._id,{since:ok?Math.max(p.since,a.until):p.since,leaseUntil:undefined,lastStatus:a.status,failures:ok?0:p.failures+1,active:p.active&&![404,410].includes(a.status),checkedAt:Date.now()+(ok?0:Math.min(3600000,60000*2**Math.min(p.failures,6)))});}});
export const deliveryAllowed=internalQuery({args:{id:v.id('pushSubscriptions')},handler:async(ctx,a)=>{const p=await ctx.db.get(a.id);return !!p?.active&&(p.leaseUntil??0)>Date.now()&&(await ctx.db.get(p.userId))?.status==='active';}});
