import { loadEnv } from 'vite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const env=loadEnv('development',process.cwd(),'');
const base='https://api.cloudflare.com/client/v4';
const account=base+'/accounts/'+env.CLOUDFLARE_ACCOUNT_ID;
const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
const report=[];
async function call(path,method='GET',body){
 const response=await fetch(path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 const data=await response.json();
 if(!response.ok||!data.success){const message=data.errors?.map(x=>x.message).join('; ')||('HTTP '+response.status);report.push({path:path.replace(account,''),status:response.status,error:message});console.log(method,path.replace(account,''),response.status,message);return null;}
 return data.result;
}
const listed=await call(account+'/r2/buckets');
if(listed)for(const name of ['schoolxense-documents','schoolxense-images','schoolxense-documents-preview','schoolxense-images-preview']){
 if(!listed.buckets.some(x=>x.name===name)){const created=await call(account+'/r2/buckets','POST',{name});report.push({resource:'bucket',name,created:!!created});}
 else report.push({resource:'bucket',name,exists:true});
}
const queues=await call(account+'/queues');
if(queues)for(const queue_name of ['schoolxense-payment-events','schoolxense-payment-events-preview','schoolxense-payment-dlq','schoolxense-payment-dlq-preview']){
 if(!queues.some(x=>x.queue_name===queue_name)){const created=await call(account+'/queues','POST',{queue_name});report.push({resource:'queue',name:queue_name,created:!!created});}
 else report.push({resource:'queue',name:queue_name,exists:true});
}
const projects=await call(account+'/pages/projects');
if(projects){if(!projects.some(x=>x.name==='schoolxense')){const created=await call(account+'/pages/projects','POST',{name:'schoolxense',production_branch:'main'});report.push({resource:'pages',name:'schoolxense',created:!!created});}else report.push({resource:'pages',name:'schoolxense',exists:true});}
for(const bucket of ['schoolxense-images','schoolxense-images-preview'])for(const name of ['learning-together.webp','collaboration.webp','study-community.webp']){
 try{const response=await fetch(account+'/r2/buckets/'+bucket+'/objects/landing/'+name,{method:'PUT',headers:{Authorization:headers.Authorization,'Content-Type':'image/webp'},body:readFileSync('static/media/'+name),signal:AbortSignal.timeout(25000)});const data=await response.json();report.push({resource:'photo',bucket,name,status:response.status,success:data.success});console.log('photo',bucket,name,response.status);}catch(error){report.push({resource:'photo',bucket,name,error:error.message});}
}
const domains=await call(account+'/pages/projects/schoolxense/domains');
if(domains&&!domains.some(x=>x.name==='schoolxense.ewinproject.org')){const domain=await call(account+'/pages/projects/schoolxense/domains','POST',{name:'schoolxense.ewinproject.org'});report.push({resource:'domain',name:'schoolxense.ewinproject.org',status:domain?.status});}
const zones=await call(base+'/zones?name=ewinproject.org');
if(zones?.length){const zone=zones[0];const dns=await call(base+'/zones/'+zone.id+'/dns_records?name=schoolxense.ewinproject.org');
 if(dns && !dns.length){const record=await call(base+'/zones/'+zone.id+'/dns_records','POST',{type:'CNAME',name:'schoolxense',content:'schoolxense.pages.dev',proxied:true,ttl:1});report.push({resource:'dns',created:!!record});}
 else if(dns?.length)report.push({resource:'dns',existing:dns.map(x=>({type:x.type,content:x.content}))});
 const rules=await call(base+'/zones/'+zone.id+'/rulesets/phases/http_request_firewall_custom/entrypoint');
 report.push({resource:'waf',existingRules:rules?.rules?.length??0,inspectOnly:true});
}
mkdirSync('.artifacts',{recursive:true});writeFileSync('.artifacts/cloud-provision.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
