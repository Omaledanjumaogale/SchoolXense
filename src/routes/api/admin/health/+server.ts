import { json } from '@sveltejs/kit';
import { authenticatedClient } from '$lib/server/convex';
import { api } from '$convex/_generated/api';
import type { RequestHandler } from './$types';
export const GET:RequestHandler=async event=>json(await authenticatedClient(event).query(api.admin.health,{}),{headers:{'Cache-Control':'private, no-store'}});
