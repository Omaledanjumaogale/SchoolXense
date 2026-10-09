<script lang="ts">
	import '../app.css';
	import SEO from '$lib/components/SEO.svelte';
	import NotificationBridge from '$lib/live/NotificationBridge.svelte';
	import { onMount } from 'svelte';
	import { ui } from '$ui/ui.svelte';
	import Toaster from '$ui/Toaster.svelte';
	import CommandPalette from '$ui/CommandPalette.svelte';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { CONVEX_URL } from '$lib/config';
	import { page } from '$app/state';
	import InstallApp from '$ui/InstallApp.svelte';
	createSvelteAuthClient({ authClient, convexUrl: CONVEX_URL });
	let { children, data } = $props();
	onMount(() => {
		ui.init();
		if ('serviceWorker' in navigator && location.hostname !== 'localhost') navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
</script>

<SEO meta={page.data.seo ?? data.seo}/>

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] ctl ctl-sm">Skip to content</a>
{@render children()}
<Toaster />
<NotificationBridge/>
<div class="fixed bottom-3 right-3 z-40"><InstallApp/></div>
{#if ui.mounted}<CommandPalette />{/if}
