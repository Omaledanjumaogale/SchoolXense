import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('static/media', { recursive: true });
const sources = [
	{ key: 'learning-together.webp', page: 'https://unsplash.com/photos/IgUR1iX0mqM', credit: 'Desola Lanre-Ologun / Unsplash' },
	{ key: 'collaboration.webp', page: 'https://unsplash.com/photos/QckxruozjRg', credit: 'Annie Spratt / Unsplash' },
	{ key: 'study-community.webp', page: 'https://unsplash.com/photos/g1Kr4Ozfoac', credit: 'Brooke Cagle / Unsplash' }
];
const saved = [];
for (const source of sources) {
	const response = await fetch(source.page, { signal: AbortSignal.timeout(25000) });
	if (!response.ok) throw new Error(`Photo source ${source.key}: ${response.status}`);
	const html = await response.text();
	const raw = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1] ?? html.match(/https:\/\/images\.unsplash\.com\/photo-[\w-]+/)?.[0];
	if (!raw) throw new Error(`No source image found: ${source.key}`);
	const url = new URL(raw.replaceAll('&amp;', '&'));
	url.search = 'auto=format&fm=webp&fit=crop&w=1200&q=82';
	const photo = await fetch(url, { signal: AbortSignal.timeout(25000) });
	if (!photo.ok) throw new Error(`Image download ${source.key}: ${photo.status}`);
	const bytes = Buffer.from(await photo.arrayBuffer());
	await writeFile(`static/media/${source.key}`, bytes);
	saved.push({ ...source, sourceImage: url.href, licence: 'https://unsplash.com/license', bytes: bytes.length });
	console.log(`Saved ${source.key}: ${bytes.length} bytes`);
}
await writeFile('static/media/credits.json', JSON.stringify(saved, null, 2));
