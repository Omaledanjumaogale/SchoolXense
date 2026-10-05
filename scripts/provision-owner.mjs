import { loadEnv } from 'vite';
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
const env=loadEnv('development',process.cwd(),'');
const origin='https://schoolxense.ewinproject.org';
let password=env.OWNER_BOOTSTRAP_PASSWORD;
if(!password){password=randomBytes(32).toString('base64url');appendFileSync('.env.local','\nOWNER_BOOTSTRAP_PASSWORD='+password+'\n');}
// Administrative invitation: the owner verifies email and chooses their own password through recovery.
const response=await fetch(env.PUBLIC_CONVEX_SITE_URL+'/api/auth/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({email:env.SUPER_ADMIN_EMAIL,password,name:'SchoolXense Owner',callbackURL:origin+'/admin-login?verified=1'}),signal:AbortSignal.timeout(25000)});
const body=await response.json().catch(()=>({}));
console.log('Owner account invitation:',response.status, response.ok?'Verification email requested':body.code??'Unable to create account');
if(response.ok||body.code==='USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'){
 const reset=await fetch(env.PUBLIC_CONVEX_SITE_URL+'/api/auth/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({email:env.SUPER_ADMIN_EMAIL,redirectTo:origin+'/reset-password'}),signal:AbortSignal.timeout(25000)});
 console.log('Owner password setup email:',reset.status);
}
