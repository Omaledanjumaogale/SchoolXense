import { error } from '@sveltejs/kit';
import { GLOSSARY } from '$hive/catalogue';
export const load = ({ params }) => {
	const g = GLOSSARY[params.term];
	if (!g) error(404, 'Term not found');
	return { slug: params.term, g };
};
