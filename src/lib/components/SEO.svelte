<script lang="ts">
 import type {PageSEO} from '$lib/seo';
 let {meta}:{meta:PageSEO}=$props();
</script>
<svelte:head>
 <title>{meta.title}</title><meta name="description" content={meta.description}/><link rel="canonical" href={meta.canonical}/><meta name="robots" content={meta.robots}/>
 <meta property="og:site_name" content="SchoolXense"/><meta property="og:type" content="website"/><meta property="og:locale" content="en_NG"/><meta property="og:title" content={meta.title}/><meta property="og:description" content={meta.description}/><meta property="og:url" content={meta.canonical}/><meta property="og:image" content={meta.image}/>
 <meta name="twitter:card" content="summary"/><meta name="twitter:title" content={meta.title}/><meta name="twitter:description" content={meta.description}/><meta name="twitter:image" content={meta.image}/>
 {#if meta.graph}{@html '<script type="application/ld+json">'+meta.graph+'</script>'}{/if}
</svelte:head>
