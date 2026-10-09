import { writeFile, readFile } from 'node:fs/promises';
const productionVars = {
	PUBLIC_APP_URL: 'https://schoolxense.ewinproject.org', PUBLIC_SITE_URL: 'https://schoolxense.ewinproject.org',
	PUBLIC_CONVEX_URL: 'https://adjoining-dalmatian-113.eu-west-1.convex.cloud',
	PUBLIC_CONVEX_SITE_URL: 'https://adjoining-dalmatian-113.eu-west-1.convex.site',
	PUBLIC_CONVEX_HTTP_ACTIONS_URL: 'https://adjoining-dalmatian-113.eu-west-1.convex.site',
	PUBLIC_DEMO_MODE: 'false', HIVE_DEMO_MODE: 'false', PAYMENTS_ENABLED:'false', APP_ENV: 'production'
};
let toml = '# SchoolXense Cloudflare Pages. Secrets are set through the Cloudflare API or Pages dashboard.\nname = "schoolxense"\npages_build_output_dir = ".svelte-kit/cloudflare"\ncompatibility_date = "2026-09-01"\ncompatibility_flags = ["nodejs_compat"]\n';
for (const name of ['', 'preview', 'production']) {
	const prefix = name ? `env.${name}.` : '';
	toml += `\n[${prefix}vars]\n`;
	const vars=name==='preview'?{...productionVars,PUBLIC_CONVEX_URL:'https://preview-isolation-required.invalid',PUBLIC_CONVEX_SITE_URL:'https://preview-isolation-required.invalid',PUBLIC_CONVEX_HTTP_ACTIONS_URL:'https://preview-isolation-required.invalid'}:productionVars;
	for (const [key, value] of Object.entries({ ...vars, APP_ENV: name || 'production' })) toml += `${key} = ${JSON.stringify(value)}\n`;
	for (const [binding, bucket] of [['DOCUMENTS', 'schoolxense-documents'], ['IMAGES', 'schoolxense-images']]) toml += `\n[[${prefix}r2_buckets]]\nbinding = "${binding}"\nbucket_name = "${bucket}${name === 'preview' ? '-preview' : ''}"\n`;
	toml += `\n[[${prefix}queues.producers]]\nbinding = "PAYMENT_EVENTS"\nqueue = "schoolxense-payment-events${name === 'preview' ? '-preview' : ''}"\n`;
}
await writeFile('wrangler.toml', toml);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
pkg.scripts.deploy = 'npm run build && wrangler pages deploy .svelte-kit/cloudflare --project-name schoolxense';
pkg.scripts['check:backend'] = 'tsc -p convex/tsconfig.json';
await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Pages configuration generated for default, preview and production.');
