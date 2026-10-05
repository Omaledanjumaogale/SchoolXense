import { loadEnv } from 'vite';
import { readFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root=process.cwd();let env=loadEnv('development',root,'');
for(const name of ['BETTER_AUTH_SECRET','INTERNAL_WEBHOOK_TOKEN','MEDIA_SIGNING_SECRET'])if(!env[name])appendFileSync('.env.local','\n'+name+'='+randomBytes(32).toString('hex')+'\n');
env=loadEnv('development',root,'');
const text=process.env.CREDENTIALS_ATTACHMENT?readFileSync(process.env.CREDENTIALS_ATTACHMENT,'utf8'):'';
// Match named credentials without writing them to logs or source.
const credential=(label)=>text.match(new RegExp(label+'[^\\n:=]*[:=]\\s*["\']?([^\\s"\']+)','i'))?.[1];
const supplied={GOOGLE_CLIENT_ID:text.match(/[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com/)?.[0],GOOGLE_CLIENT_SECRET:text.match(/GOCSPX-[A-Za-z0-9_-]+/)?.[0],GITHUB_CLIENT_ID:text.match(/github[\s\S]{0,100}?client\s*id[^\n:=]*[:=]\s*([A-Za-z0-9_]+)/i)?.[1],GITHUB_CLIENT_SECRET:text.match(/github[\s\S]{0,250}?client\s*secret[^\n:=]*[:=]\s*([A-Za-z0-9_]+)/i)?.[1]};
for(const [name,label]of [['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_ID'],['GOOGLE_CLIENT_SECRET','GOOGLE_CLIENT_SECRET'],['GITHUB_CLIENT_ID','GITHUB_CLIENT_ID'],['GITHUB_CLIENT_SECRET','GITHUB_CLIENT_SECRET']])if(!env[name]){const value=supplied[name]??credential(label);if(value){env[name]=value;appendFileSync('.env.local','\n'+name+'='+value+'\n');}}
const domainResponse=await fetch('https://api.resend.com/domains',{headers:{Authorization:'Bearer '+env.RESEND_API_KEY},signal:AbortSignal.timeout(20000)});
const domains=await domainResponse.json();const verified=domains.data?.find(x=>x.name==='ewinproject.org'&&x.status==='verified');
console.log('Email sender domain lookup:',domainResponse.status, verified?'ewinproject.org verified':'No verified ewinproject.org sender found');
if(verified&&!env.RESEND_FROM){env.RESEND_FROM='SchoolXense <accounts@ewinproject.org>';appendFileSync('.env.local','\nRESEND_FROM="'+env.RESEND_FROM+'"\n');}
const settings={SITE_URL:'https://schoolxense.ewinproject.org',AUTH_TRUSTED_ORIGINS:'https://schoolxense.ewinproject.org,https://*.schoolxense.pages.dev,http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173',PAYMENTS_ENABLED:'false',PAYOUTS_ENABLED:'false'};
for(const name of ['BETTER_AUTH_SECRET','INTERNAL_WEBHOOK_TOKEN','RESEND_API_KEY','RESEND_FROM','SUPER_ADMIN_EMAIL','AGNES_AI_KEY','AGNES_AI_BASE_URL','AGNES_AI_MODEL','CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_AI_TOKEN','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET'])if(env[name])settings[name]=env[name];
for(const [name,value] of Object.entries(settings)){
 if(process.argv[2]&&name!==process.argv[2])continue;
 const run=spawnSync(process.execPath,['node_modules/convex/bin/main.js','env','set',name,value],{env:{...process.env,...env},encoding:'utf8',timeout:120000});
 console.log('Convex setting',name,run.status===0?'configured':'FAILED');
 if(run.status!==0){let diagnostic=(run.stderr||run.error?.message||'Unknown error');for(const value of Object.values(env))if(value)diagnostic=diagnostic.split(value).join('[redacted]');console.log(diagnostic.slice(0,1000));throw new Error('Unable to configure '+name);}
}
const base='https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/pages/projects/schoolxense';
const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
const project=await (await fetch(base,{headers})).json();if(!project.success)throw new Error('Cannot read SchoolXense Pages project');
const deployment_configs={};
for(const mode of ['preview','production']){
 const previous=project.result.deployment_configs?.[mode]??{};
 const env_vars={...(previous.env_vars??{})};
 for(const name of ['INTERNAL_WEBHOOK_TOKEN','MEDIA_SIGNING_SECRET'])env_vars[name]={type:'secret_text',value:env[name]};
 env_vars.PAYMENTS_ENABLED={type:'plain_text',value:'false'};
 const publicSettings={PUBLIC_APP_URL:'https://schoolxense.ewinproject.org',PUBLIC_SITE_URL:'https://schoolxense.ewinproject.org',PUBLIC_CONVEX_URL:env.PUBLIC_CONVEX_URL,PUBLIC_CONVEX_SITE_URL:env.PUBLIC_CONVEX_SITE_URL,PUBLIC_CONVEX_HTTP_ACTIONS_URL:env.PUBLIC_CONVEX_SITE_URL,PUBLIC_DEMO_MODE:'false',HIVE_DEMO_MODE:'false',APP_ENV:mode};
 for(const[name,value]of Object.entries(publicSettings))env_vars[name]={type:'plain_text',value};
 const suffix=mode==='preview'?'-preview':'';
 deployment_configs[mode]={...previous,env_vars,r2_buckets:{DOCUMENTS:{name:'schoolxense-documents'+suffix},IMAGES:{name:'schoolxense-images'+suffix}},queue_producers:{PAYMENT_EVENTS:{name:'schoolxense-payment-events'+suffix}}};
}
const response=await fetch(base,{method:'PATCH',headers,body:JSON.stringify({deployment_configs})});const result=await response.json();console.log('Pages secrets:',response.status,result.success?'configured':'FAILED');
if(!result.success)console.log(result.errors?.map(x=>x.message));
