import { error } from '@sveltejs/kit';
import { hive } from '$hive/store.svelte';
export const load = ({ params }) => {
	const u = hive.db.users.find((x) => x.slug === params.slug);
	if (!u) error(404, 'Tutor not found');
	return { userId: u.id };
};
