import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ routes: { include: ['/*'], exclude: ['<all>'] } }),
		alias: {
			$convex: './convex',
			$ui: 'src/lib/ui',
			$engines: 'src/lib/engines',
			$payments: 'src/lib/payments',
			$hive: 'src/lib/hive'
		},
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'https://checkout.flutterwave.com', 'https://challenges.cloudflare.com'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				'font-src': ['self', 'data:'],
				'connect-src': ['self', 'https://*.convex.cloud', 'wss://*.convex.cloud', 'https://*.convex.site', 'https://api.flutterwave.com'],
				'frame-src': ['https://checkout.flutterwave.com', 'https://challenges.cloudflare.com'],
				'frame-ancestors': ['none'],
				'base-uri': ['self'],
				'form-action': ['self', 'https://checkout.flutterwave.com']
			}
		}
	}
};
