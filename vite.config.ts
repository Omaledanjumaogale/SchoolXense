import options from './svelte-options.js';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(options)],
	test: { include: ['tests/unit/**/*.test.ts'], environment: 'node', testTimeout: 15_000 }
});
