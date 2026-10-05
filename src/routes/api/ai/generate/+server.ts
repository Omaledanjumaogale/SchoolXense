import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticatedClient, assertSameOrigin } from '$lib/server/convex';
import { api } from '$convex/_generated/api';
export const POST: RequestHandler = async (event) => {
 assertSameOrigin(event);
 const client = authenticatedClient(event);
 const body = await event.request.json().catch(() => null);
 if (!body || typeof body.exam !== 'string' || typeof body.subject !== 'string' || !Number.isInteger(body.count) || body.count < 1 || body.count > 10) return json({ message: 'Provide an exam, subject and a count from 1 to 10.' }, { status: 400 });
 try { return json(await client.action(api.ai.generate, { exam: body.exam, subject: body.subject, count: body.count })); }
 catch { return json({ message: 'Generation is unavailable or your usage limit has been reached. Please try again later.' }, { status: 503 }); }
};