import { loadEnv } from 'vite';
const env=loadEnv('development',process.cwd(),'');
const base='https://api.cloudflare.com/client/v4';const headers={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
async function call(path,method='GET',body){const response=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});const result=await response.json();if(!result.success)throw new Error(result.errors?.map(x=>x.message).join('; '));return result.result;}
const zones=await call('/zones?name=ewinproject.org');if(!zones.length)throw new Error('ewinproject.org zone not accessible');
const path='/zones/'+zones[0].id+'/rulesets/phases/http_request_firewall_custom/entrypoint';
const existing=await call(path);const ref='schoolxense_sensitive_paths';
if(existing.rules.some(x=>x.ref===ref))console.log('SchoolXense WAF rule already configured');
else{const result=await call('/zones/'+zones[0].id+'/rulesets/'+existing.id+'/rules','POST',{ref,description:'SchoolXense: block probes for hidden configuration and source-control files',expression:'(http.host eq "schoolxense.ewinproject.org" and (starts_with(http.request.uri.path, "/.env") or starts_with(http.request.uri.path, "/.git/") or starts_with(http.request.uri.path, "/wp-admin")))',action:'block',enabled:true});console.log('SchoolXense host-scoped WAF rule configured; existing rules preserved:',result.rules.length);}
