import { internalQuery, internalMutation, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
export const pending=internalQuery({args:{},handler:ctx=>ctx.db.query('ecosystemEvents').withIndex('by_delivery',q=>q.eq('deliveredAt',undefined)).take(25)});
export const acknowledge=internalMutation({args:{id:v.id('ecosystemEvents')},handler:async(ctx,{id})=>{const event=await ctx.db.get(id);if(event&&!event.deliveredAt)await ctx.db.patch(id,{deliveredAt:Date.now()});}});
export const deliver=internalAction({args:{},handler:async(ctx):Promise<void>=>{
 if(process.env.EWIN_SYNC_ENABLED!=='true')return;
 const endpoint=process.env.EWIN_SYNC_ENDPOINT,secret=process.env.EWIN_SYNC_SECRET;
 if(!endpoint||!secret||new URL(endpoint).protocol!=='https:')throw new Error('An approved ecosystem endpoint and signing secret are required.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const events=await ctx.runQuery(internal.ecosystem.pending,{});
 for(const event of events){const timestamp=String(Date.now());const body=JSON.stringify({version:1,eventId:event.eventId,app:event.app,type:event.type,subject:event.subject,payload:event.payload,createdAt:event.createdAt});const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(timestamp+'.'+body));
 const signature=Array.from(new Uint8Array(sig),x=>x.toString(16).padStart(2,'0')).join('');
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-SchoolXense-Timestamp':timestamp,'X-SchoolXense-Event':event.eventId,'X-SchoolXense-Signature':signature},body,signal:AbortSignal.timeout(10000)});
 const receipt=await response.json().catch(()=>null);if(!response.ok||receipt?.acceptedEventId!==event.eventId)throw new Error('Ecosystem receipt mismatch.');await ctx.runMutation(internal.ecosystem.acknowledge,{id:event._id});
 }
}});
