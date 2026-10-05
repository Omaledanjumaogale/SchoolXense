import { loadEnv } from 'vite';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

// Supply test credentials through the environment. Never log cookies, passwords or links.
const env={...loadEnv('development',process.cwd(),''),...process.env};
const origin=env.PUBLIC_APP_URL??'https://schoolxense.ewinproject.org';
const email=env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password=env.SCHOOLXENSE_OWNER_TEST_PASSWORD??env.SUPER_ADMIN_PASSWORD;
if(!email||!password)throw new Error('Owner authentication test credentials are required.');
const response=await fetch(origin+'/api/auth/sign-in/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(30000)});
const result=await response.json();
console.log(JSON.stringify({check:'owner sign-in',status:response.status,verified:result.user?.emailVerified===true,errorCode:response.ok?undefined:result.code}));
if(!response.ok){process.exitCode=1;}else{
 const cookie=response.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 const session=await fetch(origin+'/api/auth/get-session',{headers:{Cookie:cookie},signal:AbortSignal.timeout(30000)});
 const state=await session.json();console.log(JSON.stringify({check:'session',status:session.status,authenticated:!!state?.session}));
 const tokenResponse=await fetch(origin+'/api/auth/convex/token',{headers:{Cookie:cookie},signal:AbortSignal.timeout(30000)});
 const token=await tokenResponse.json();console.log(JSON.stringify({check:'session token',status:tokenResponse.status,issued:!!token.token}));
 if(token.token){const client=new ConvexHttpClient(env.PUBLIC_CONVEX_URL);client.setAuth(token.token);const profile=await client.query(makeFunctionReference('portal:profile'),{});console.log(JSON.stringify({check:'owner profile',exists:!!profile,complete:profile?.profileComplete??!!(profile?.state&&profile?.lga&&profile?.whatsapp&&profile?.ninLast4),admin:profile?.roles.includes('staff')??false}));if(profile?.roles.includes('staff')){const health=await client.query(makeFunctionReference('admin:health'),{});console.log(JSON.stringify({check:'authorized admin health',database:health.database?.status,ai:health.ai?.status,email:health.email?.status,payments:health.payments?.status}));}}
 if(session.status!==200||!state?.session||tokenResponse.status!==200||!token.token)process.exitCode=1;
 if(process.argv.includes('--request-recovery')){const recovery=await fetch(origin+'/api/auth/request-password-reset',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,redirectTo:origin+'/reset-password'}),signal:AbortSignal.timeout(30000)});console.log(JSON.stringify({check:'password recovery request',status:recovery.status}));}
}
if(env.RESEND_API_KEY){
 const sent=await fetch('https://api.resend.com/emails?limit=100',{headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`},signal:AbortSignal.timeout(30000)});
 const payload=await sent.json();console.log(JSON.stringify({check:'email provider delivery inspection',status:sent.status}));
 if(sent.ok)for(const subject of ['Verify your SchoolXense email','Reset your SchoolXense password']){const record=payload.data?.find(x=>x.subject===subject&&x.to?.some(to=>to.toLowerCase()===email));console.log(JSON.stringify({check:subject,event:record?.last_event??'no matching delivery record',createdAt:record?.created_at}));}
}
