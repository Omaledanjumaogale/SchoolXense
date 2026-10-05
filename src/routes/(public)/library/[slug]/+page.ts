import { error } from '@sveltejs/kit';
import { hive } from '$hive/store.svelte';
export const load = ({ params }) => {
	const p = hive.db.packs.find((x) => x.slug === params.slug);
	if (!p) error(404, 'Pack not found');
	return { packId: p.id };
};
