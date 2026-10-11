import { v,ConvexError } from 'convex/values';
import { action,internalAction,internalQuery,internalMutation } from './_generated/server';
import { api,internal } from './_generated/api';
import { withAccess,audit,resolve } from './lib/access';
import { post,systemWallet } from './lib/ledger';
import {korapay,flutterwaveV4} from '../src/lib/payments/gateways';
export const queue=withAccess({role:'staff'}).query({args:{},handler:async ctx=>({disputes:await ctx.db.query('disputes').order('desc').take(100),refunds:await ctx.db.query('refundRequests').order('desc').take(100)})});
export const refundForReview=withAccess({role:'staff'}).query({args:{id:v.id('refundRequests')},handler:async(ctx,a)=>{const r=await ctx.db.get(a.id);if(!r||r.status==='refunded')throw new ConvexError('An unresolved refund is required.');const payment=await ctx.db.get(r.paymentId);if(!payment?.flwTxId)throw new ConvexError('Payment receipt is missing.');return {refund:r,payment};}});
export const reconcileRefund=action({args:{id:v.id('refundRequests'),providerId:v.string()},handler:async(ctx,a):Promise<void>=>{
 const {refund:r,payment:p}=await ctx.runQuery(api.disputes.refundForReview,{id:a.id});if(!/^[A-Za-z0-9_-]{3,120}$/.test(a.providerId))throw new ConvexError('Provider refund ID is required.');
 let completed=false;
 if(p.gateway==='korapay'){if(a.providerId!=='SX-RF-'+r._id)throw new ConvexError('Refund reference mismatch.');const tx=await korapay<{reference:string;payment_reference:string;amount:number;currency:string;status:string}>(process.env,'/refunds/'+encodeURIComponent(a.providerId));if(tx.reference!==a.providerId||tx.payment_reference!==p.txRef||Math.round(Number(tx.amount)*100)!==Number(p.amount)||tx.currency!==p.currency||tx.status==='failed')throw new ConvexError('Refund receipt requires review.');completed=tx.status==='success';}
 else if(p.flwTxId!.startsWith('flutterwave-v4:')){const tx=await flutterwaveV4<{id:string;charge_id:string;amount_refunded:number;status:string}>(process.env,'/refunds/'+encodeURIComponent(a.providerId));if(tx.id!==a.providerId||tx.charge_id!==p.flwTxId!.slice('flutterwave-v4:'.length)||Math.round(tx.amount_refunded*100)!==Number(p.amount)||tx.status==='failed')throw new ConvexError('Refund receipt requires review.');completed=tx.status==='succeeded';}
 else{const response=await fetch('https://api.flutterwave.com/v3/refunds/'+encodeURIComponent(a.providerId),{headers:{Authorization:'Bearer '+process.env.FLW_SECRET_KEY},signal:AbortSignal.timeout(15000)});const tx=await response.json();if(!response.ok||tx.status!=='success'||String(tx.data?.tx_id)!==p.flwTxId||Math.round(Number(tx.data?.amount_refunded)*100)!==Number(p.amount))throw new ConvexError('Refund receipt requires review.');completed=['completed-bank-transfer','completed-momo','completed-mpgs','completed-preauth'].includes(tx.data.status);}
 await ctx.runMutation(internal.disputes.record,{id:a.id,providerId:a.providerId,completed});await ctx.runMutation(internal.disputes.auditRefund,{id:a.id});
}});
export const auditRefund=internalMutation({args:{id:v.id('refundRequests')},handler:async(ctx,a)=>{const {user}=await resolve(ctx,{role:'staff'});await audit(ctx,user._id,'refund.reconcile',a.id,'Provider receipt verified; no new refund submitted.');}});
export const decide=withAccess({role:'staff'}).mutation({args:{id:v.id('disputes'),decision:v.union(v.literal('under_review'),v.literal('release'),v.literal('refund')),note:v.string()},handler:async(ctx,a)=>{
 const d=await ctx.db.get(a.id),b=d&&await ctx.db.get(d.bookingId);
 if(!d||!b||!['open','under_review'].includes(d.status)||[d.openedBy,b.tutorId,b.learnerId].includes(ctx.user._id)||a.note.trim().length<10||a.note.length>2000)throw new ConvexError('INDEPENDENT_REVIEW_REQUIRED');
 if(a.decision==='under_review'){await ctx.db.patch(d._id,{status:'under_review',decidedBy:ctx.user._id,decisionNote:a.note});return;}
 const escrow=await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',b._id)).unique();
 const payment=escrow&&await ctx.db.get(escrow.paymentId);
 if(!escrow||escrow.status!=='disputed'||!payment?.fulfilledAt||payment.status!=='successful')throw new ConvexError('FUNDING_RECONCILIATION_REQUIRED');
 if(a.decision==='release'){if(!b.deliveredAt)throw new ConvexError('DELIVERY_EVIDENCE_REQUIRED');await ctx.db.patch(escrow._id,{status:'held'});await ctx.scheduler.runAfter(0,internal.money.releaseEscrow,{escrowId:escrow._id});await ctx.db.patch(d._id,{status:'released',decidedBy:ctx.user._id,decisionNote:a.note});await ctx.db.patch(b._id,{status:'released'});}
 else{if(!payment.flwTxId)throw new ConvexError('PROVIDER_REFERENCE_REQUIRED');await ctx.db.insert('refundRequests',{disputeId:d._id,paymentId:payment._id,status:'queued',createdAt:Date.now()});await ctx.db.patch(d._id,{status:'refund_pending',decidedBy:ctx.user._id,decisionNote:a.note});await ctx.scheduler.runAfter(0,internal.disputes.processRefunds,{});}
 await audit(ctx,ctx.user._id,'dispute.'+a.decision,d._id,a.note);await ctx.db.insert('notifications',{userId:b.learnerId,title:'Booking dispute reviewed',body:a.decision==='refund'?'Refund approved; provider completion is pending.':'Delivery confirmed after independent review.',read:false});
}});
export const pending=internalQuery({args:{},handler:async ctx=>{const rows=await ctx.db.query('refundRequests').filter(q=>q.or(q.eq(q.field('status'),'queued'),q.eq(q.field('status'),'pending'))).take(25);return Promise.all(rows.map(async r=>({...r,payment:await ctx.db.get(r.paymentId)})));}});
export const claim=internalMutation({args:{id:v.id('refundRequests')},handler:async(ctx,a)=>{const r=await ctx.db.get(a.id);if(r?.status!=='queued')return false;await ctx.db.patch(r._id,{status:'submitting'});return true;}});
export const record=internalMutation({args:{id:v.id('refundRequests'),providerId:v.optional(v.string()),error:v.optional(v.string()),completed:v.boolean()},handler:async(ctx,a)=>{
 const r=await ctx.db.get(a.id);if(!r||r.status==='refunded')return;
 if(a.error){await ctx.db.patch(r._id,{status:'reconciliation',lastError:a.error});return;}
 if(!a.completed){await ctx.db.patch(r._id,{status:'pending',providerId:a.providerId});return;}
 const d=await ctx.db.get(r.disputeId),p=await ctx.db.get(r.paymentId),e=d&&await ctx.db.query('escrows').withIndex('by_ref',q=>q.eq('refId',d.bookingId)).unique();
 if(!d||!p||!e||e.status!=='disputed'||p.status!=='successful')throw new ConvexError('REFUND_RECONCILIATION_REQUIRED');
 await post(ctx,'refund:'+r._id,[{walletId:await systemWallet(ctx,'escrow'),amount:-e.amount,kind:'refund',memo:'Provider-verified refund'},{walletId:await systemWallet(ctx,'clearing'),amount:e.amount,kind:'refund',memo:'Provider-verified refund'}],p._id);
 await ctx.db.patch(e._id,{status:'refunded'});await ctx.db.patch(p._id,{status:'refunded'});await ctx.db.patch(d._id,{status:'refunded'});await ctx.db.patch(d.bookingId,{status:'refunded'});await ctx.db.patch(r._id,{status:'refunded',providerId:a.providerId});
 await ctx.db.insert('notifications',{userId:p.userId,title:'Refund verified',body:'Your booking refund has been confirmed by the payment provider.',read:false});
}});
export const processRefunds=internalAction({args:{},handler:async(ctx):Promise<void>=>{
 if(process.env.REFUNDS_ENABLED!=='true'||process.env.APP_ENV==='preview')return;
 const rows=await ctx.runQuery(internal.disputes.pending,{});
 for(const r of rows){if(r.status==='queued'&&!await ctx.runMutation(internal.disputes.claim,{id:r._id}))continue;
 try{if(!r.payment?.flwTxId)throw new Error('Missing original transaction');
 if(r.payment.gateway==='korapay'){
 const reference='SX-RF-'+r._id;
 const tx=await korapay<{refund_reference?:string;reference?:string;payment_reference:string;status:string;amount?:number;amount_returned?:number;currency:string}>(process.env,r.providerId?'/refunds/'+encodeURIComponent(r.providerId):'/refunds/initiate',r.providerId?undefined:{payment_reference:r.payment.txRef,reference,amount:Number(r.payment.amount)/100,reason:'SchoolXense approved booking dispute'});
 if(tx.payment_reference!==r.payment.txRef||tx.currency!=='NGN'||Math.round(Number(tx.amount_returned??tx.amount)*100)!==Number(r.payment.amount)||(tx.refund_reference??tx.reference)!==reference)throw new Error('Refund receipt mismatch');
 if(tx.status==='failed')throw new Error('Refund failed');
 await ctx.runMutation(internal.disputes.record,{id:r._id,providerId:reference,completed:tx.status==='success'});continue;
 }
 if(r.payment.flwTxId.startsWith('flutterwave-v4:')){
 const charge=r.payment.flwTxId.slice('flutterwave-v4:'.length);
 const tx=await flutterwaveV4<{id:string;charge_id:string;amount_refunded:number;status:string}>(process.env,r.providerId?'/refunds/'+encodeURIComponent(r.providerId):'/refunds',r.providerId?undefined:{charge_id:charge,amount:Number(r.payment.amount)/100,reason:'SchoolXense approved booking dispute'},'SX-RF-'+r._id);
 if(tx.charge_id!==charge||Math.round(tx.amount_refunded*100)!==Number(r.payment.amount))throw new Error('Refund receipt mismatch');
 await ctx.runMutation(internal.disputes.record,{id:r._id,providerId:tx.id,completed:tx.status==='succeeded'});continue;
 }
 const response=await fetch(r.providerId?`https://api.flutterwave.com/v3/refunds/${encodeURIComponent(r.providerId)}`:`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(r.payment.flwTxId)}/refund`,{method:r.providerId?'GET':'POST',headers:{Authorization:'Bearer '+process.env.FLW_SECRET_KEY,'Content-Type':'application/json'},body:r.providerId?undefined:JSON.stringify({amount:Number(r.payment.amount)/100,comments:'SchoolXense approved booking dispute'}),signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok||data.status!=='success'||String(data.data?.tx_id)!==r.payment.flwTxId||Math.round(Number(data.data?.amount_refunded)*100)!==Number(r.payment.amount))throw new Error('Provider receipt mismatch');await ctx.runMutation(internal.disputes.record,{id:r._id,providerId:String(data.data.id),completed:['completed-bank-transfer','completed-momo','completed-mpgs','completed-preauth'].includes(data.data.status)});
 }catch{await ctx.runMutation(internal.disputes.record,{id:r._id,error:'Provider outcome requires reconciliation; automatic refund retry is blocked.',completed:false});}}
}});
