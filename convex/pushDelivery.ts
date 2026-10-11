'use node';
import webpush from 'web-push';
import {internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {v} from 'convex/values';
import {transactionText} from '../src/lib/i18n/transactions';
export const send=internalAction({args:{id:v.id('pushSubscriptions'),until:v.number(),endpoint:v.string(),p256dh:v.string(),auth:v.string(),locale:v.string()},handler:async(ctx,a)=>{
 if(!await ctx.runQuery(internal.push.deliveryAllowed,{id:a.id}))return;
 let status=0;try{const result=await webpush.sendNotification({endpoint:a.endpoint,keys:{p256dh:a.p256dh,auth:a.auth}},JSON.stringify({title:'SchoolXense',body:transactionText(a.locale).notification,href:'/notifications',tag:'schoolxense-account-update'}),{vapidDetails:{subject:'mailto:support@ewinproject.org',publicKey:process.env.WEB_PUSH_PUBLIC_KEY!,privateKey:process.env.WEB_PUSH_PRIVATE_KEY!},timeout:15000,TTL:3600});status=result.statusCode;}catch(e){status=Number((e as {statusCode?:number}).statusCode??0);}
 await ctx.runMutation(internal.push.outcome,{id:a.id,until:a.until,status});
}});
