import { GLOSSARY } from '$hive/catalogue';
import { LANDINGS } from '$hive/landings';
import {publicCatalogue} from '$lib/server/catalogue';
import {locales} from '$lib/locales';
export const GET = async () => {
	const base = 'https://schoolxense.ewinproject.org';
	const paths = [...new Set(['/', '/explore', '/tutors', '/library', '/cohorts', '/for-schools', '/for-sponsors', '/pricing', '/about', '/integrity', '/safety', '/security', '/privacy', '/terms', '/faq', '/glossary', ...Object.keys(LANDINGS).map((k) => `/${k}`), ...Object.keys(GLOSSARY).map((k) => `/glossary/${k}`)])];
	const packs=await publicCatalogue('packs').catch(()=>[]);
	paths.push(...Object.keys(locales).map(locale=>'/languages/'+locale));
	for(const pack of packs)if('slug' in pack)paths.push('/library/'+encodeURIComponent(pack.slug));
	const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>${p==='/'?'1.0':'0.7'}</priority></url>`).join('')}</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml', 'cache-control': 'max-age=3600' } });
};
