import { loadEnv } from 'vite';
import { spawn } from 'node:child_process';
const env=loadEnv('development',process.cwd(),'');
const args=process.argv[2]==='create'?['pages','project','create','schoolxense','--production-branch','main','--force']:process.argv[2]==='consumer'?['deploy','--config','workers/payment-consumer/wrangler.toml']:['pages','deploy','.svelte-kit/cloudflare','--project-name','schoolxense','--branch','main'];
if(process.argv[2]==='consumer'&&process.argv[3])args.push('--env',process.argv[3]);
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{env:{...process.env,CLOUDFLARE_API_TOKEN:env.CLOUDFLARE_API_TOKEN,CLOUDFLARE_ACCOUNT_ID:env.CLOUDFLARE_ACCOUNT_ID},stdio:'inherit'});
child.on('exit',code=>process.exit(code??1));
