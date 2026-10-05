<script lang="ts">
	import PublicNav from '$ui/PublicNav.svelte';
	import Footer from '$ui/Footer.svelte';
	import { page } from '$app/state';
	import LiveCatalogue from '$lib/live/LiveCatalogue.svelte';
	let { children } = $props();
</script>

<PublicNav />
<main id="main">
	{#if /^\/(tutors|library|cohorts)(\/|$)/.test(page.url.pathname)}<LiveCatalogue />{:else}{@render children()}{/if}
</main>
<Footer />
