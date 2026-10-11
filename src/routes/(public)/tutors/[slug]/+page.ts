import { error } from '@sveltejs/kit';
import { hive } from '$hive/store.svelte';
import { DEMO_MODE } from '$lib/config';
export const load = ({ params }) => {
	if(!DEMO_MODE)return {};
	const u = hive.db.users.find((x) => x.slug === params.slug);
	if (!u) error(404, 'Tutor not found');
	return { userId: u.id };
};
