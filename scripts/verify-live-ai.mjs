import { loadEnv } from 'vite';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { mkdirSync, writeFileSync } from 'node:fs';
// Deliberately opt-in: this makes ONE real provider request and saves unreviewed drafts.
const env={...loadEnv('development',process.cwd(),''),...process.env};
if(!env.SCHOOLXENSE_OWNER_TEST_PASSWORD||!env.SUPER_ADMIN_EMAIL)throw new Error('Owner test credentials must be supplied through the environment.');
const origin=env.PUBLIC_APP_URL??'https://schoolxense.ewinproject.org';
const signed=await fetch(origin+'/api/auth/sign-in/email',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:env.SUPER_ADMIN_EMAIL.trim().toLowerCase(),password:env.SCHOOLXENSE_OWNER_TEST_PASSWORD}),signal:AbortSignal.timeout(30000)});
if(!signed.ok)throw new Error(`Owner sign-in failed (${signed.status}).`);
const cookie=signed.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
try{
 const tokenResponse=await fetch(origin+'/api/auth/convex/token',{headers:{Cookie:cookie},signal:AbortSignal.timeout(30000)});
 const {token}=await tokenResponse.json();if(!tokenResponse.ok||!token)throw new Error('Authenticated token was not issued.');
 const client=new ConvexHttpClient(env.PUBLIC_CONVEX_URL);client.setAuth(token);
 const profile=await client.query(makeFunctionReference('portal:profile'),{});if(!profile?.roles.includes('staff'))throw new Error('Trusted administrator role is required for this test.');
 const checkedAt=new Date().toISOString();let result,failed=false;
 try{result=await client.action(makeFunctionReference('ai:generate'),{exam:'JAMB',subject:'Physics',count:1});}catch{failed=true;}
 const health=await client.query(makeFunctionReference('admin:health'),{});
 const report={checkedAt,request:{exam:'JAMB',subject:'Physics',count:1},status:failed?'failed':'succeeded',result,lastRun:health.ai.lastRun??null};
 console.log(JSON.stringify(report));mkdirSync('.artifacts',{recursive:true});writeFileSync('.artifacts/live-ai.json',JSON.stringify(report,null,2));
 if(failed||result?.status!=='unreviewed'||!health.ai.lastRun||health.ai.lastRun.status!=='succeeded')process.exitCode=1;
}finally{await fetch(origin+'/api/auth/sign-out',{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(30000)});}
