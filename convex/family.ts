import { mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { resolve, hasRole, audit } from './lib/access';
async function hash(token:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');}
export const invite=mutation({args:{},handler:async ctx=>{
 const {user}=await resolve(ctx);if(!user.isMinor)throw new ConvexError('Guardian linking is for under-18 learners.');
 const existing=await ctx.db.query('guardianInvites').withIndex('by_child',q=>q.eq('childId',user._id)).take(30);
 if(existing.filter(x=>x.expiresAt>Date.now()&&!x.claimedAt).length>=3)throw new ConvexError('Use an existing invitation or wait for it to expire.');
 const token=crypto.randomUUID();await ctx.db.insert('guardianInvites',{childId:user._id,tokenHash:await hash(token),expiresAt:Date.now()+86400000});await audit(ctx,user._id,'guardian.invite',user._id);return{token,expiresInHours:24};
}});
export const accept=mutation({args:{token:v.string(),acknowledge:v.boolean()},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx,{adultOnly:true});if(!a.acknowledge||a.token.length>100)throw new ConvexError('Confirm your guardian responsibility.');
 const tokenHash=await hash(a.token);
 const invite=await ctx.db.query('guardianInvites').withIndex('by_hash',q=>q.eq('tokenHash',tokenHash)).unique();
 if(!invite||invite.claimedAt||invite.expiresAt<Date.now()||invite.childId===user._id)throw new ConvexError('The invitation is unavailable or expired.');
 const child=await ctx.db.get(invite.childId);if(!child?.isMinor||child.status!=='active')throw new ConvexError('Learner unavailable.');
 const existing=await ctx.db.query('guardianLinks').withIndex('by_child',q=>q.eq('childId',child._id)).collect();
 if(existing.some(x=>x.guardianId===user._id))throw new ConvexError('You are already linked.');
 await ctx.db.insert('guardianLinks',{guardianId:user._id,childId:child._id,spendingLimit:0n,createdAt:Date.now()});await ctx.db.patch(invite._id,{claimedAt:Date.now()});
 if(!(await hasRole(ctx,user._id,'guardian')))await ctx.db.insert('roles',{userId:user._id,role:'guardian',grantedAt:Date.now()});
 await audit(ctx,user._id,'guardian.accept',child._id);return{linked:true};
}});
