import { json,error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { CONVEX_SITE_URL } from '$lib/config';
import { assertSameOrigin } from '$lib/server/convex';
import { residence } from '../../../../convex/lib/profileValidation';
import type { RequestHandler } from './$types';
export const POST:RequestHandler=async event=>{
 assertSameOrigin(event);
 const token=event.platform?.env?.INTERNAL_WEBHOOK_TOKEN??env.INTERNAL_WEBHOOK_TOKEN;
 if(!token)error(503,'Registration is not configured.');
 const raw=await event.request.text();if(raw.length>5000)error(413,'Request too large.');
 let a;try{a=JSON.parse(raw);residence(a.state,a.lga,a.whatsapp);if(!/^\d{11}$/.test(a.nin)||typeof a.password!=='string'||a.password.length<12||a.password.length>128||typeof a.name!=='string'||a.name.trim().length<2||a.name.length>100||typeof a.email!=='string')throw Error();}catch{error(400,'Provide valid identity, residence and account details.');}
 const response=await event.fetch('/api/auth/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json',origin:event.url.origin},body:JSON.stringify({name:a.name.trim(),email:a.email,password:a.password,callbackURL:`${event.url.origin}/login?verified=1&ref=${encodeURIComponent(typeof a.ref==='string'?a.ref.slice(0,12):'')}`})});
 const result=await response.json();if(!response.ok)return json({message:result.message??'Account creation failed.'},{status:response.status});
 if(!result.user?.id)error(502,'Account creation could not be confirmed.');
 const stored=await fetch(`${CONVEX_SITE_URL}/registration`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({authId:result.user.id,state:a.state,lga:a.lga,whatsapp:a.whatsapp,nin:a.nin}),signal:AbortSignal.timeout(15000)});
 return json({ok:true,notice:stored.ok?'Check your email to verify your account, then sign in.':'Account created. Verify your email, then complete identity and residence setup when you sign in.'});
};
