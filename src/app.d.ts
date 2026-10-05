// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			requestId: string;
		}
		interface Platform {
			env?: {
				PAYMENT_EVENTS?: { send: (body: unknown) => Promise<void> };
				FLAGS?: { get: (k: string) => Promise<string | null> };
				DOCUMENTS?: MediaBucket;
				IMAGES?: MediaBucket;
				MEDIA_SIGNING_SECRET?: string;
				INTERNAL_WEBHOOK_TOKEN?: string;
				PAYMENTS_ENABLED?: string;
				FLW_SECRET_HASH?: string;
				FLW_SECRET_KEY?: string;
				ANTHROPIC_API_KEY?: string;
				AI_GATEWAY_URL?: string;
				HIVE_DEMO_MODE?: string;
			};
			context?: { waitUntil(p: Promise<unknown>): void };
		}
	}
}
export {};
interface MediaBucket {
	get(key: string): Promise<{ body: ReadableStream; httpEtag: string; httpMetadata?: { contentType?: string } } | null>;
	put(key: string, value: Uint8Array, options?: { httpMetadata: { contentType: string } }): Promise<unknown>;
	delete(key: string): Promise<void>;
}
