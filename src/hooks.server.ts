import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import {privatePath} from '$lib/seo';

/** Old SchoolCBT / CollegeCBT paths → hub (preserves SEO paths: glossary, curriculum, resources). */
const LEGACY: [RegExp, string][] = [
	[/^\/curriculum\/?$/, '/secondary'],
	[/^\/exam-lab\/?$/, '/practice/campus/mth101'],
	[/^\/resources\/?$/, '/library'],
	[/^\/tutor\/?$/, '/tutors'],
	[/^\/dashboard\/custom-exam\/?$/, '/practice'],
	[/^\/dashboard\/certificate\/?$/, '/certificates'],
	[/^\/dashboard\/?$/, '/home'],
	[/^\/admin(\/.*)?$/, '/ops'],
	[/^\/auth\/login\/?$/, '/login'],
	[/^\/auth\/register\/?$/, '/signup']
];

export const handle: Handle = async ({ event, resolve }) => {
	const runtime=event.platform?.env as Record<string,unknown>|undefined;
	if(runtime?.APP_ENV==='preview'&&(typeof runtime.PUBLIC_CONVEX_URL!=='string'||!/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(runtime.PUBLIC_CONVEX_URL)||runtime.PUBLIC_CONVEX_URL.includes('adjoining-dalmatian-113')))return new Response('Preview backend isolation has not been configured.',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
	event.locals.requestId = crypto.randomUUID();
	const { pathname, host } = event.url;

	// Cut-over: schoolcbt.* and collegecbt.* domains 301 to the hub module paths.
	if (host.startsWith('schoolcbt.')) redirect(301, `https://schoolxense.ewinproject.org/secondary${pathname === '/' ? '' : pathname}`);
	if (host.startsWith('collegecbt.')) redirect(301, `https://schoolxense.ewinproject.org/campus${pathname === '/' ? '' : pathname}`);
	for (const [re, to] of LEGACY) if (re.test(pathname)) redirect(301, to);

	const upstream = await resolve(event);
	// Auth proxies return fetch responses whose headers are immutable.
	const response = new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: new Headers(upstream.headers) });
	if (pathname.startsWith('/api/') || /\/(admin-login|login|signup|welcome|reset-password|forgot-password|home|ops|inst|wallet|checkout|practice|settings|sessions|threads|tutor-bundle|studio|teams|tasks|contracts|referrals|family|record|review|plan|packs|offers|requests|payouts|earn|skills|notifications|certificates|attempt|book)(\/|$)/.test(pathname)) response.headers.set('Cache-Control', 'private, no-store');
	response.headers.set('X-Request-Id', event.locals.requestId);
	if(privatePath(pathname)||runtime?.APP_ENV==='preview')response.headers.set('X-Robots-Tag','noindex, nofollow');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
	response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	return response;
};
