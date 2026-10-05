import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticatedClient, assertSameOrigin } from '$lib/server/convex';
import { secret, signGrant, validMedia } from '$lib/server/media';
import { api } from '$convex/_generated/api';
export const POST: RequestHandler = async event => {
 assertSameOrigin(event); const client = authenticatedClient(event);
 const profile = await client.query(api.portal.profile,{});
 if (!profile) return json({message:'Complete account setup.'},{status:403});
 const body=await event.request.json().catch(()=>null);
 if (!body || !validMedia(body.kind,body.contentType,body.size)) return json({message:'Use a JPEG, PNG or WebP image up to 5 MB, or a PDF up to 10 MB.'},{status:400});
 if(body.kind==='image' && !profile.roles.includes('staff')) return json({message:'Only administrators may publish public images.'},{status:403});
 const bucket=body.kind==='image'?event.platform?.env?.IMAGES:event.platform?.env?.DOCUMENTS;
 if(!bucket) return json({message:'Media storage is unavailable.'},{status:503});
 const ext:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
 const token=await signGrant({key:'uploads/'+profile._id+'/'+crypto.randomUUID()+'.'+ext[body.contentType],ownerId:profile._id,kind:body.kind,contentType:body.contentType,size:body.size,expires:Date.now()+300000},secret(event));
 return json({url:'/api/media/upload?grant='+encodeURIComponent(token),expiresIn:300},{headers:{'Cache-Control':'no-store'}});
};
