import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticatedClient } from '$lib/server/convex';
import { api } from '$convex/_generated/api';
export const GET: RequestHandler = async event=>{
 const file=await authenticatedClient(event).query(api.media.purchasedDocument,{key:event.params.key});
 if(file.kind!=='document') error(404,'Document not found.');
 const object=await event.platform?.env?.DOCUMENTS?.get(file.key);
 if(!object) error(404,'Document not found.');
 return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="schoolxense-document.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox"}});
};
