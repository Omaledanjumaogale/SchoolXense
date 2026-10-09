<script lang="ts">
	import PublicNav from '$ui/PublicNav.svelte';
	import Footer from '$ui/Footer.svelte';
	import { page } from '$app/state';
	import LiveCatalogue from '$lib/live/LiveCatalogue.svelte';
	let { children } = $props();
</script>

<PublicNav />
{#if page.url.pathname==='/'}<aside class="px-4 py-3 text-center text-sm border-b border-[var(--line)]" itemscope itemtype="https://schema.org/Organization"><a href="https://ewinproject.org" itemprop="url" class="link"><span itemprop="name">A platform under the Elite Workforce Impact Nigeria (E-WIN) Project Ecosystem</span></a></aside>{/if}
<main id="main">
	{#if /^\/(tutors|library|cohorts)(\/|$)/.test(page.url.pathname)}<LiveCatalogue />{:else}{@render children()}{/if}
</main>
<Footer />
