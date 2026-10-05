<script lang="ts">
	import { GLOSSARY } from '$hive/catalogue';
	import Prose from '$ui/Prose.svelte';
</script>

<svelte:head><title>Glossary · SchoolXense</title></svelte:head>

<Prose eyebrow="Glossary" title="The words we use, in plain language.">
	<div class="grid sm:grid-cols-2 gap-3 not-prose">
		{#each Object.entries(GLOSSARY) as [slug, g]}
			<a href="/glossary/{slug}" class="panel card-interactive p-4"><p class="font-semibold">{g.term}</p><p class="text-sm muted line-clamp-2 mt-1">{g.def}</p></a>
		{/each}
	</div>
</Prose>
