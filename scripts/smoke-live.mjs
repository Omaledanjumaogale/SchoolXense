import { writeFileSync, mkdirSync } from 'node:fs';
const base=process.argv[2]??'https://schoolxense.ewinproject.org';const results=[];
for(const path of ['/','/admin-login','/login','/faq','/manifest.webmanifest','/api/auth/get-session','/api/images/landing/learning-together.webp','/api/media/documents/uploads/not-owned/test.pdf']){
 try{const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});const type=response.headers.get('content-type');const body=type?.includes('text/html')?await response.text():null;
 const result={path,status:response.status,type,cache:response.headers.get('cache-control'),title:body?.match(/<title>(.*?)<\/title>/)?.[1],serverError:body?.includes('Internal Error')};results.push(result);console.log(JSON.stringify(result));}
 catch(error){results.push({path,error:error.message});console.log(path,error.message);}
}
for(const path of ['/api/payments/initialize','/api/ai/generate','/api/media/sign-upload']){const response=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(20000)});results.push({path,status:response.status});console.log(path,response.status);}
const invalid=await fetch(base+'/api/enquiries',{method:'POST',headers:{Origin:base},body:new URLSearchParams({name:'A',email:'bad',message:'short',consent:'on'}),signal:AbortSignal.timeout(20000)});console.log('Invalid enquiry',invalid.status);results.push({path:'/api/enquiries invalid',status:invalid.status});
mkdirSync('.artifacts',{recursive:true});writeFileSync('.artifacts/live-smoke.json',JSON.stringify(results,null,2));
if(results.some(x=>x.status>=500||x.error||x.serverError))process.exitCode=1;
