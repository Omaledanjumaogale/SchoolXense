import {mkdirSync,writeFileSync} from 'node:fs';
const base=(process.argv[2]??'https://schoolxense.ewinproject.org').replace(/\/$/,'');
const preview=new URL(base).hostname.endsWith('.pages.dev');
const results=[];
async function check(path,verify){const response=await fetch(base+path,{signal:AbortSignal.timeout(30000)}),text=await response.text();if(response.status!==200)throw new Error(`${path}: HTTP ${response.status}`);await verify(text,response);results.push({path,status:response.status,passed:true});console.log('Passed '+path);return text;}
await check('/faq',(html,response)=>{
 const blocks=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
 if(blocks.length!==1)throw new Error('FAQ requires one JSON-LD graph');
 const graph=JSON.parse(blocks[0][1])['@graph'];
 const faq=graph.find(x=>x['@type']==='FAQPage');if(!faq?.mainEntity?.length)throw new Error('FAQ schema missing');
 const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/gi,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 for(const row of faq.mainEntity)if(!visible.includes(row.name))throw new Error('FAQ content missing from SSR: '+row.name);
 if(!html.includes('rel="canonical"')||!html.includes('summary_large_image'))throw new Error('Social metadata missing');
 if(preview&&!response.headers.get('x-robots-tag')?.includes('noindex'))throw new Error('Preview must be noindex');
});
await check('/languages/fr',html=>{if(!html.includes('Apprenez')||!html.includes('hreflang="ar"'))throw new Error('Localized SSR or reciprocal hreflang missing');});
await check('/languages/ar',html=>{if(!html.includes('dir="rtl"')||!html.includes('lang="ar"'))throw new Error('Arabic language or RTL missing');});
const sitemap=await check('/sitemap.xml',xml=>{if(!xml.includes('<urlset')||xml.includes('/wallet')||xml.includes('/checkout'))throw new Error('Sitemap invalid or contains private pages');});
const paths=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>new URL(x[1]).pathname).filter(x=>/^\/(library|tutors|cohorts)\/.+/.test(x));
for(const path of paths.slice(0,3))await check(path,html=>{if(!html.includes('application/ld+json')||!html.includes('<h1'))throw new Error('Dynamic page lacks server content/schema');});
const image=await fetch(base+'/social-card.png',{signal:AbortSignal.timeout(30000)});const png=new DataView(await image.arrayBuffer());if(image.status!==200||png.getUint32(16)!==1200||png.getUint32(20)!==630)throw new Error('Social image must be a valid 1200×630 PNG');results.push({path:'/social-card.png',passed:true,width:1200,height:630});
for(const path of ['/robots.txt','/llms.txt','/llms-full.txt','/.well-known/ai-agent-manifest.json'])await check(path,text=>{if(!text.length)throw new Error(path+' is empty');});
mkdirSync('.artifacts',{recursive:true});writeFileSync('.artifacts/discovery-live.json',JSON.stringify({base,preview,results,dynamicPagesChecked:Math.min(3,paths.length),dynamicPagesAvailable:paths.length},null,2));
