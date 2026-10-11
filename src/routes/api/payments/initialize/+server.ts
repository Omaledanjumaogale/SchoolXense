import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {authenticatedClient,assertSameOrigin} from '$lib/server/convex';
import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
export const POST:RequestHandler=async event=>{
 assertSameOrigin(event);const client=authenticatedClient(event);
 const body=await event.request.json().catch(()=>null);
 if(!body||typeof body.paymentId!=='string'||!['flutterwave','korapay'].includes(body.gateway))return json({message:'A saved order and supported gateway are required.'},{status:400});
 try{return json(await client.action(api.gateways.initialize,{paymentId:body.paymentId as Id<'payments'>,gateway:body.gateway}));}
 catch{return json({message:'Checkout is unavailable or requires reconciliation. Your order remains unpaid.'},{status:409});}
};
