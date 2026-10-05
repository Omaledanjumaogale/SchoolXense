import { json } from '@sveltejs/kit';
import { DEMO_MODE } from '$lib/config';
export const GET = () => json({ ok: true, service: 'schoolxense-web', demo: DEMO_MODE, time: new Date().toISOString() },{headers:{'Cache-Control':'no-store'}});
