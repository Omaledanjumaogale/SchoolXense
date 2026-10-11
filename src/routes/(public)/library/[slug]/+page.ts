import { error } from '@sveltejs/kit';
import { hive } from '$hive/store.svelte';
import { DEMO_MODE } from '$lib/config';
export const load = ({ params, data }) => {
	if(!DEMO_MODE)return {...data,slug:params.slug};
	const p = hive.db.packs.find((x) => x.slug === params.slug);
	if (!p) error(404, 'Pack not found');
	return {...data, packId: p.id,slug:params.slug };
};
