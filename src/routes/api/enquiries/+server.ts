import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { assertSameOrigin } from '$lib/server/convex';
import { CONVEX_SITE_URL } from '$lib/config';
export const POST: RequestHandler=async event=>{
 assertSameOrigin(event);
 const length=Number(event.request.headers.get('content-length')??0);
 if(length>16000)return json({message:'Enquiry is too long.'},{status:413});
 const form=await event.request.formData().catch(()=>null);
 if(!form)return json({message:'Invalid enquiry.'},{status:400});
 if(form.get('website'))return json({ok:true});
 if(!form.get('consent'))return json({message:'Please consent to being contacted about your enquiry.'},{status:400});
 const fields=Object.fromEntries(['name','email','organisation','topic','message'].map(k=>[k,String(form.get(k)??'').trim()]));
 if(fields.name.length<2 || fields.name.length>100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || fields.email.length>254 || fields.message.length<10 || fields.message.length>4000 || fields.organisation.length>150 || fields.topic.length>100)return json({message:'Check your contact details and include a message of 10–4,000 characters.'},{status:400});
 const token=event.platform?.env?.INTERNAL_WEBHOOK_TOKEN??env.INTERNAL_WEBHOOK_TOKEN;
 if(!token)return json({message:'Enquiries are temporarily unavailable. Please try again later.'},{status:503});
 const address=event.getClientAddress();
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token+':'+address));
 const rateKey=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
 try { const response=await fetch(CONVEX_SITE_URL+'/enquiries',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...fields,rateKey}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)return json({message:'Unable to submit. Please check your details or try again later.'},{status:response.status===429?429:503});return json({ok:true}); }
 catch{return json({message:'Enquiries are temporarily unavailable. Please try again later.'},{status:503});}
};
