import { action,internalMutation,query } from './_generated/server';
import { api,internal } from './_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { v,ConvexError } from 'convex/values';
import { resolve,audit } from './lib/access';
export const attribution=query({args:{},handler:async ctx=>{const {user}=await resolve(ctx);return {centralCode:user.centralReferralCode??null,localCode:user.referralCode,referredBy:user.referredBy??null};}});
export const attach=action({args:{code:v.string()},handler:async(ctx,a):Promise<void>=>{
 const user=await ctx.runQuery(api.portal.profile,{});if(!user)throw new ConvexError('Verify your account first.');
 const code=a.code.trim().toUpperCase();if(!/^[A-Z0-9]{4,12}$/.test(code))throw new ConvexError('Invalid referral code.');
 const central=new ConvexHttpClient('https://pastel-lemur-183.convex.cloud');
 const receipt=await central.query(makeFunctionReference<'query'>('referrals:resolve'),{code}) as {valid?:boolean}|null;
 await ctx.runMutation(internal.referrals.persist,{userId:user._id,code,central:receipt?.valid===true});
}});
export const persist=internalMutation({args:{userId:v.id('users'),code:v.string(),central:v.boolean()},handler:async(ctx,a)=>{
 const user=await ctx.db.get(a.userId);if(!user||user.status!=='active')throw new ConvexError('Account is unavailable.');
 if(user.centralReferralCode||user.referredBy){if(user.centralReferralCode===a.code)return;throw new ConvexError('Referral attribution is already established.');}
 if(a.central)await ctx.db.patch(user._id,{centralReferralCode:a.code});
 else{const owner=await ctx.db.query('users').withIndex('by_referralCode',q=>q.eq('referralCode',a.code)).unique();if(!owner||owner.status!=='active'||owner._id===user._id)throw new ConvexError('Referral code is not active.');await ctx.db.patch(user._id,{referredBy:owner._id});await ctx.db.insert('referrals',{ambassadorId:owner._id,userId:user._id,channel:'schoolxense'});}
 await audit(ctx,user._id,'referral.attributed',user._id,a.central?'E-WIN verified registry':'SchoolXense registry');
 if(a.central)await ctx.db.insert('ecosystemEvents',{eventId:crypto.randomUUID(),app:'schoolxense',type:'onboarding.attributed',subject:user.ecosystemId??`schoolxense:${user.authId}`,payload:{version:1,referralCode:a.code},createdAt:Date.now()});
}});
