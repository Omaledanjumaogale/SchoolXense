<script lang="ts">
	import { GLOSSARY } from '$hive/catalogue';
	import Prose from '$ui/Prose.svelte';
	let { data } = $props();
</script>

<svelte:head><title>{data.g.term} · Glossary · SchoolXense</title><meta name="description" content={data.g.def} /></svelte:head>

<Prose eyebrow="Glossary" title={data.g.term}>
	<p class="text-lg">{data.g.def}</p>
	<h2>Related</h2>
	<div class="flex flex-wrap gap-2">{#each data.g.related as r}{#if GLOSSARY[r]}<a class="ctl ctl-sm" href="/glossary/{r}">{GLOSSARY[r].term}</a>{/if}{/each}</div>
	<p class="mt-6"><a href="/glossary">← All terms</a></p>
</Prose>
