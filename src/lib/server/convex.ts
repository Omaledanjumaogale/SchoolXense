import { ConvexHttpClient } from 'convex/browser';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { error, type RequestEvent } from '@sveltejs/kit';
import { CONVEX_URL } from '$lib/config';
export function authenticatedClient(event: Pick<RequestEvent, 'cookies'>) {
	const token = getToken(event.cookies);
	if (!token) error(401, 'Sign in to continue.');
	const client = new ConvexHttpClient(CONVEX_URL);
	client.setAuth(token);
	return client;
}
export function assertSameOrigin(event: Pick<RequestEvent, 'request' | 'url'>) {
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Cross-origin request rejected.');
}
