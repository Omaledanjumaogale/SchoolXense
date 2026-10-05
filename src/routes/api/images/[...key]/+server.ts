import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async event=>{
 const key=event.params.key;
 if(!/^(landing\/(learning-together|collaboration|study-community)\.webp|uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]+\.(jpg|png|webp))$/.test(key)) error(404,'Image not found.');
 const bucket=event.platform?.env?.IMAGES;
 if(!bucket && key.startsWith('landing/')) { const response=await event.fetch('/media/'+key.slice(8));return new Response(response.body,{status:response.status,headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}}); }
 const object=await bucket?.get(key);
 if(!object && ['localhost','127.0.0.1'].includes(event.url.hostname) && key.startsWith('landing/')){const response=await event.fetch('/media/'+key.slice(8));return new Response(response.body,{status:response.status,headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=3600'}});}
 if(!object)error(404,'Image not found.');
 const headers={'Content-Type':object.httpMetadata?.contentType??'image/webp','Cache-Control':'public, max-age=86400, stale-while-revalidate=604800','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff'};
 if(event.request.headers.get('if-none-match')===object.httpEtag)return new Response(null,{status:304,headers});
 return new Response(object.body,{headers});
};
