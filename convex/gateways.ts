import {action,query,internalMutation,internalQuery} from './_generated/server';
import {api,internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {resolve,hasRole,audit} from './lib/access';
import {rateLimiter} from './rateLimits';
import {createGatewayCheckout,verifyGatewayPayment} from '../src/lib/payments/gateways';
import type {GatewayCheckout} from '../src/lib/payments/gateways';
import type {CheckoutRequest} from '../src/lib/payments/provider';
const gateway=v.union(v.literal('flutterwave'),v.literal('korapay'));
export const availability=query({args:{},handler:async ctx=>{await resolve(ctx);const enabled=process.env.PAYMENTS_ENABLED==='true'&&process.env.APP_ENV!=='preview';return {flutterwave:enabled&&process.env.FLW_ENABLED==='true'&&!!process.env.FLW_CLIENT_ID,korapay:enabled&&process.env.KORAPAY_ENABLED==='true'&&!!process.env.KORAPAY_SECRET_KEY};}});
export const claim=internalMutation({args:{paymentId:v.id('payments'),gateway},handler:async(ctx,a)=>{
 const {user}=await resolve(ctx);const p=await ctx.db.get(a.paymentId);
 if(!p||p.userId!==user._id)throw new ConvexError('FORBIDDEN');
 if(process.env.PAYMENTS_ENABLED!=='true'||process.env.APP_ENV==='preview'||process.env[a.gateway==='korapay'?'KORAPAY_ENABLED':'FLW_ENABLED']!=='true')throw new ConvexError('GATEWAY_UNAVAILABLE');
 if(p.status!=='pending')throw new ConvexError('ORDER_NOT_PENDING');
 if(p.gateway&&p.gateway!==a.gateway)throw new ConvexError('This order already has a checkout with another provider. Reconcile it before starting another payment.');
 if(p.checkoutState==='ready')return {existing:true,payment:p};
 if(p.checkoutState&&!(p.checkoutState==='reconciliation'&&p.gateway==='flutterwave'))throw new ConvexError('Checkout initialization needs reconciliation. Do not pay twice.');
 await rateLimiter.limit(ctx,'checkout',{key:user._id,throws:true});
 await ctx.db.patch(p._id,{gateway:a.gateway,checkoutState:'initializing'});return {existing:false,payment:p};
}});
export const inspect=internalQuery({args:{paymentId:v.id('payments')},handler:async(ctx,a)=>{const {user}=await resolve(ctx);const p=await ctx.db.get(a.paymentId);if(!p||(p.userId!==user._id&&!await hasRole(ctx,user._id,'staff')))throw new ConvexError('FORBIDDEN');return p;}});
export const limitVerification=internalMutation({args:{},handler:async ctx=>{const {user}=await resolve(ctx);await rateLimiter.limit(ctx,'checkout',{key:'verify:'+user._id,throws:true});}});
export const verify=action({args:{paymentId:v.id('payments'),chargeId:v.optional(v.string())},handler:async(ctx,a):Promise<{status:string}>=>{
 const p=await ctx.runQuery(internal.gateways.inspect,{paymentId:a.paymentId});await ctx.runMutation(internal.gateways.limitVerification,{});
 if(p.status!=='pending')return {status:p.status};if(!p.gateway)throw new ConvexError('Gateway has not been selected.');
 if(p.gateway==='flutterwave'&&!a.chargeId?.startsWith('chg_'))throw new ConvexError('Use the provider charge ID shown on your bank-transfer receipt.');
 const tx=await verifyGatewayPayment(p.gateway,process.env,p.gateway==='korapay'?p.txRef:a.chargeId!);
 if(tx.txRef!==p.txRef||tx.amountKobo!==Number(p.providerAmountKobo??p.amount)||tx.currency!==p.currency)throw new ConvexError('Provider receipt does not match this order.');
 if(tx.status==='successful')await ctx.runMutation(internal.money.settlePayment,{txRef:tx.txRef,flwTxId:tx.id,amountKobo:BigInt(tx.amountKobo),currency:tx.currency,gateway:p.gateway});return {status:tx.status};
}});
export const reconciliationQueue=query({args:{},handler:async ctx=>{await resolve(ctx,{role:'staff'});const rows=await ctx.db.query('payments').filter(q=>q.eq(q.field('status'),'pending')).order('desc').take(100);return rows.map(p=>({id:p._id,reference:p.txRef,amount:p.amount,gateway:p.gateway,state:p.checkoutState,createdAt:p.createdAt}));}});
export const record=internalMutation({args:{paymentId:v.id('payments'),link:v.optional(v.string()),providerRef:v.optional(v.string()),bank:v.optional(v.object({bank:v.string(),account:v.string(),expiresAt:v.string(),amountKobo:v.number(),feeKobo:v.number()})),failed:v.boolean()},handler:async(ctx,a)=>{const {user}=await resolve(ctx);const p=await ctx.db.get(a.paymentId);if(!p||p.userId!==user._id||p.checkoutState!=='initializing')throw new ConvexError('FORBIDDEN');await ctx.db.patch(p._id,{checkoutState:a.failed?'reconciliation':'ready',checkoutLink:a.link,providerRef:a.providerRef,bankInstructions:a.bank,providerAmountKobo:a.bank?BigInt(a.bank.amountKobo):p.amount,providerFeeKobo:a.bank?BigInt(a.bank.feeKobo):0n});}});
export const initialize=action({args:{paymentId:v.id('payments'),gateway},handler:async(ctx,a):Promise<GatewayCheckout>=>{
 const order=await ctx.runQuery(api.checkout.get,{paymentId:a.paymentId});
 if(!order.customer.email)throw new ConvexError('Verified customer email is required.');
 const claimed=await ctx.runMutation(internal.gateways.claim,a);
 if(claimed.existing)return {link:claimed.payment.checkoutLink,bank:claimed.payment.bankInstructions,providerRef:claimed.payment.providerRef!};
 try{const result=await createGatewayCheckout(a.gateway,process.env,{txRef:order.payment.txRef,amountKobo:Number(order.payment.amount),currency:'NGN',customer:{email:order.customer.email,name:order.customer.name},purpose:order.payment.purpose as CheckoutRequest['purpose'],redirectUrl:process.env.SITE_URL+'/checkout/'+a.paymentId});await ctx.runMutation(internal.gateways.record,{paymentId:a.paymentId,...result,failed:false});return result;}
 catch{await ctx.runMutation(internal.gateways.record,{paymentId:a.paymentId,failed:true});throw new ConvexError('Checkout could not be confirmed. Your order remains unpaid and is awaiting reconciliation.');}
}});
