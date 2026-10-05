import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticatedClient, assertSameOrigin } from '$lib/server/convex';
import { secret, readGrant, validMagic } from '$lib/server/media';
import { api } from '$convex/_generated/api';
export const PUT: RequestHandler = async event => {
 assertSameOrigin(event); const client=authenticatedClient(event);
 const grant=await readGrant(event.url.searchParams.get('grant')??'',secret(event));
 const profile=await client.query(api.portal.profile,{});
 if(profile?._id!==grant.ownerId || (grant.kind==='image' && !profile.roles.includes('staff'))) return json({message:'Upload forbidden.'},{status:403});
 const bucket=grant.kind==='image'?event.platform?.env?.IMAGES:event.platform?.env?.DOCUMENTS;
 if(!bucket) return json({message:'Media storage is unavailable.'},{status:503});
 if(event.request.headers.get('content-type')!==grant.contentType) return json({message:'File type mismatch.'},{status:400});
 // Stream with a hard bound instead of trusting Content-Length.
 const reader=event.request.body?.getReader(); if(!reader) return json({message:'Empty file.'},{status:400});
 const chunks:Uint8Array[]=[]; let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>grant.size){await reader.cancel();return json({message:'File is too large.'},{status:413});}chunks.push(part.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 if(size!==grant.size || !validMagic(bytes,grant.contentType)) return json({message:'Invalid file content.'},{status:400});
 const existing=await bucket.get(grant.key); if(existing) return json({message:'Upload permission already used.'},{status:409});
 await bucket.put(grant.key,bytes,{httpMetadata:{contentType:grant.contentType}});
 try { const id=await client.mutation(api.media.register,{key:grant.key,kind:grant.kind,contentType:grant.contentType,size});return json({id,key:grant.key}); }
 catch { await bucket.delete(grant.key);return json({message:'Unable to register file. Please retry.'},{status:503}); }
};
