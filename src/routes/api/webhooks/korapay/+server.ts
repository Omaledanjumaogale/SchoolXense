import type {RequestHandler} from './$types';
import {env} from '$env/dynamic/private';
import {verifyHmacSignature} from '$payments/gateways';
export const POST:RequestHandler=async({request,platform})=>{
 if((platform?.env?.PAYMENTS_ENABLED??env.PAYMENTS_ENABLED)!=='true')return new Response('payments disabled',{status:503});
 const raw=await request.text();if(raw.length>65536)return new Response('payload too large',{status:413});
 let payload;try{payload=JSON.parse(raw);}catch{return new Response('invalid json',{status:400});}
 if(!payload.data||!await verifyHmacSignature(JSON.stringify(payload.data),request.headers.get('x-korapay-signature'),platform?.env?.KORAPAY_SECRET_KEY??env.KORAPAY_SECRET_KEY))return new Response('invalid signature',{status:401});
 if(!['charge.success','charge.failed','transfer.success','transfer.failed'].includes(payload.event))return new Response('ignored');
 const id=payload.data.reference;if(typeof id!=='string'||!/^[A-Za-z0-9_-]{3,120}$/.test(id))return new Response('invalid reference',{status:400});
 if(!platform?.env?.PAYMENT_EVENTS)return new Response('queue unavailable',{status:503});
 await platform.env.PAYMENT_EVENTS.send({id,txRef:id,type:payload.event,gateway:'korapay'});return new Response('ok');
};
