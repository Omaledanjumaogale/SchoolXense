/** Convex HTTP actions: the Queue consumer posts verified payment events here; USSD answers write to attempts. */
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { authComponent, createAuth } from './auth';

const http = httpRouter();
authComponent.registerRoutes(http, createAuth);
http.route({path:'/registration',method:'POST',handler:httpAction(async(ctx,req)=>{
 if(!process.env.INTERNAL_WEBHOOK_TOKEN||req.headers.get('authorization')!==`Bearer ${process.env.INTERNAL_WEBHOOK_TOKEN}`)return new Response('forbidden',{status:403});
 try{const a=await req.json();await ctx.runAction(internal.identity.register,{authId:a.authId,state:a.state,lga:a.lga,whatsapp:a.whatsapp,nin:a.nin});return Response.json({ok:true});}catch{return Response.json({message:'Complete identity and residence setup after verifying your email.'},{status:400});}
})});

http.route({ path: '/enquiries', method: 'POST', handler: httpAction(async (ctx,req)=>{
	if (!process.env.INTERNAL_WEBHOOK_TOKEN || req.headers.get('authorization') !== `Bearer ${process.env.INTERNAL_WEBHOOK_TOKEN}`) return new Response('forbidden',{status:403});
	try {
		const b=await req.json();
		await ctx.runMutation(internal.portal.submitEnquiry,{name:b.name,email:b.email,organisation:b.organisation,topic:b.topic,message:b.message,rateKey:b.rateKey});
		return Response.json({ok:true});
	} catch { return Response.json({message:'Invalid enquiry or submission limit reached.'},{status:429}); }
}) });

http.route({
	path: '/payments/settle',
	method: 'POST',
	handler: httpAction(async (ctx, req) => {
		if (!process.env.INTERNAL_WEBHOOK_TOKEN || req.headers.get('authorization') !== `Bearer ${process.env.INTERNAL_WEBHOOK_TOKEN}`) return new Response('forbidden', { status: 403 });
		const b = (await req.json()) as { txRef: string; flwTxId: string; amountKobo: string; currency: string; method?: string; kind: 'payment' | 'transfer'; success?: boolean };
		if (b.kind === 'transfer') await ctx.runMutation(internal.money.closePayout, { reference: b.txRef, success: !!b.success, flwTransferId: b.flwTxId });
		else await ctx.runMutation(internal.money.settlePayment, { txRef: b.txRef, flwTxId: b.flwTxId, amountKobo: BigInt(b.amountKobo), currency: b.currency, method: b.method });
		return new Response('ok');
	})
});

export default http;
