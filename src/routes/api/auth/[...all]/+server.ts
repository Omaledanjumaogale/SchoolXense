import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { CONVEX_SITE_URL } from '$lib/config';
import type { RequestHandler } from './$types';
const handlers = createSvelteKitHandler({ convexSiteUrl: CONVEX_SITE_URL });
function guarded(handler: RequestHandler): RequestHandler {
	return async event => {
		try { return await handler(event); }
		catch (cause) {
			if(event.request.signal.aborted)return new Response(null,{status:499});
			if(cause instanceof Error && (cause.name==='AbortError'||cause.name==='TimeoutError'))return Response.json({message:'Authentication is temporarily unavailable. Please retry.'},{status:503,headers:{'Retry-After':'3'}});
			throw cause;
		}
	};
}
export const GET = guarded(handlers.GET);
export const POST = guarded(handlers.POST);
