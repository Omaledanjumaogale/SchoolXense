<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { ui } from '$ui/ui.svelte';
	import Toaster from '$ui/Toaster.svelte';
	import CommandPalette from '$ui/CommandPalette.svelte';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/auth-client';
	import { CONVEX_URL } from '$lib/config';
	import { APP_URL } from '$lib/config';
	import { page } from '$app/state';
	import InstallApp from '$ui/InstallApp.svelte';
	const canonical=$derived(APP_URL+page.url.pathname.replace(/\/$/,'')+(page.url.pathname==='/'?'/':''));
	createSvelteAuthClient({ authClient, convexUrl: CONVEX_URL });
	let { children } = $props();
	onMount(() => {
		ui.init();
		if ('serviceWorker' in navigator && location.hostname !== 'localhost') navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
</script>

<svelte:head>
	<title>SchoolXense — Learn out loud, earn from what you've mastered</title>
	<meta name="description" content="One account, one wallet, twelve modules: adaptive JAMB/WAEC/NECO and campus CBT, verified escrow-protected tutors, cohorts, study packs, question Studio, team contracts and institution dashboards." />
	<link rel="canonical" href={canonical}/>
	<meta property="og:site_name" content="SchoolXense"/>
	<meta property="og:type" content="website"/>
	<meta property="og:url" content={canonical}/>
	<meta property="og:title" content="SchoolXense — Learn, practise and grow together"/>
	<meta property="og:image" content={APP_URL+'/icon-512.png'}/>
	<meta name="twitter:card" content="summary"/>
	<meta name="twitter:title" content="SchoolXense — Learn, practise and grow together"/>
	{@html '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'SchoolXense',url:APP_URL,description:'Practice, tutoring and original educational resources.'})+'</script>'}
	{@html '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'EducationalOrganization','@id':APP_URL+'/#organization',name:'SchoolXense',url:APP_URL,logo:APP_URL+'/icon-512.png',areaServed:{'@type':'Country',name:'Nigeria'},parentOrganization:{'@type':'Organization',name:'E-WIN Project',url:'https://ewinproject.org'},description:'A Nigerian learning platform for reviewed exam practice, tutoring and educational collaboration.'})+'</script>'}
</svelte:head>

<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] ctl ctl-sm">Skip to content</a>
{@render children()}
<Toaster />
<div class="fixed bottom-3 right-3 z-40"><InstallApp/></div>
{#if ui.mounted}<CommandPalette />{/if}
