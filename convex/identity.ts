import { action, internalMutation, internalAction } from './_generated/server';
import { api, internal } from './_generated/api';
import { v,ConvexError } from 'convex/values';
import { residence } from './lib/profileValidation';
const fields={state:v.string(),lga:v.string(),whatsapp:v.string(),nin:v.string()};
async function encrypt(nin:string){
 if(!/^\d{11}$/.test(nin))throw new ConvexError('NIN must contain 11 digits.');
 const secret=process.env.NIN_ENCRYPTION_KEY;if(!secret||!/^[a-f0-9]{64}$/i.test(secret))throw new ConvexError('Identity storage is not configured.');
 const key=await crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g)!,x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(nin));
 return {ciphertext:Array.from(new Uint8Array(encrypted),x=>x.toString(16).padStart(2,'0')).join(''),iv:Array.from(iv,x=>x.toString(16).padStart(2,'0')).join(''),last4:nin.slice(-4)};
}
export const save=internalMutation({args:{authId:v.string(),state:v.string(),lga:v.string(),whatsapp:v.string(),ciphertext:v.string(),iv:v.string(),last4:v.string()},handler:async(ctx,a)=>{
 const existing=await ctx.db.query('privateIdentities').withIndex('by_authId',q=>q.eq('authId',a.authId)).unique();
 const values={...a,updatedAt:Date.now()};if(existing)await ctx.db.patch(existing._id,values);else await ctx.db.insert('privateIdentities',values);
 const user=await ctx.db.query('users').withIndex('by_authId',q=>q.eq('authId',a.authId)).unique();
 if(user){await ctx.db.patch(user._id,{state:a.state,lga:a.lga,whatsapp:a.whatsapp,ninLast4:a.last4});
 for(const old of await ctx.db.query('verifications').withIndex('by_user',q=>q.eq('userId',user._id)).collect())if(old.kind==='nin'&&old.status==='approved')await ctx.db.patch(old._id,{status:'pending',note:'Identity updated; fresh review required.'});}
}});
export const register=internalAction({args:{authId:v.string(),...fields},handler:async(ctx,a)=>{
 const location=residence(a.state,a.lga,a.whatsapp),encrypted=await encrypt(a.nin);
 await ctx.runMutation(internal.identity.save,{authId:a.authId,...location,...encrypted});
}});
export const update=action({args:fields,handler:async(ctx,a):Promise<void>=>{
 const profile=await ctx.runQuery(api.portal.profile,{});if(!profile?.authId)throw new ConvexError('Sign in and verify your email.');
 await ctx.runAction(internal.identity.register,{authId:profile.authId,...a});
}});
