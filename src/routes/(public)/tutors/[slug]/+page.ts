import { error } from '@sveltejs/kit';
import { hive } from '$hive/store.svelte';
import { DEMO_MODE } from '$lib/config';
export const load = ({ params, data }) => {
	if(!DEMO_MODE)return data;
	const u = hive.db.users.find((x) => x.slug === params.slug);
	if (!u) error(404, 'Tutor not found');
	return {...data, userId: u.id };
};
