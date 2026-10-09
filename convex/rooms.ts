import { action } from './_generated/server';
import { api } from './_generated/api';
import { v,ConvexError } from 'convex/values';
import { withAccess } from './lib/access';
export const authorize=withAccess().query({args:{bookingId:v.id('bookings')},handler:async(ctx,a)=>{
 const b=await ctx.db.get(a.bookingId),thread=b?.threadId&&await ctx.db.get(b.threadId);
 if(!b||!thread||!thread.participants.includes(ctx.user._id)||b.status!=='confirmed'||Date.now()<Date.parse(b.slot)-15*60000||Date.now()>Date.parse(b.slot)+b.minutes*60000+30*60000)throw new ConvexError('ROOM_ACCESS_DENIED');
 const p=b.paymentId&&await ctx.db.get(b.paymentId);if(!p||p.status!=='successful'||!p.fulfilledAt)throw new ConvexError('SETTLED_PAYMENT_REQUIRED');
 return {room:b._id,sub:ctx.user._id};
}});
export const token=action({args:{bookingId:v.id('bookings')},handler:async(ctx,a):Promise<{token:string;expiresAt:number}>=>{
 if(process.env.ROOMS_ENABLED!=='true'||!process.env.ROOM_JWT_SECRET||process.env.ROOM_JWT_SECRET.length<32)throw new ConvexError('ROOMS_UNAVAILABLE');
 const claims=await ctx.runQuery(api.rooms.authorize,a),iat=Math.floor(Date.now()/1000),exp=iat+300;
 const encode=(x:unknown)=>btoa(JSON.stringify(x)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
 const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({...claims,iat,exp,aud:'schoolxense-room',iss:'schoolxense',origin:process.env.SITE_URL??'https://schoolxense.ewinproject.org'});
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(process.env.ROOM_JWT_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));
 return {token:body+'.'+btoa(String.fromCharCode(...signature)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'),expiresAt:exp*1000};
}});
