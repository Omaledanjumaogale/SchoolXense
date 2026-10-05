<script lang="ts">
	import type { Snippet } from 'svelte';
	let { eyebrow, title, lead, updated, children }: { eyebrow?: string; title: string; lead?: string; updated?: string; children: Snippet } = $props();
</script>

<article class="max-w-[820px] mx-auto px-4 sm:px-6 pt-12">
	{#if eyebrow}<p class="eyebrow" style="color:var(--accent)">{eyebrow}</p>{/if}
	<h1 class="text-[2.2rem] sm:text-[2.6rem] font-semibold leading-tight mt-2">{title}</h1>
	{#if lead}<p class="text-lg text-[var(--text-2)] mt-3">{lead}</p>{/if}
	{#if updated}<p class="text-xs muted mt-2">Last updated {updated}</p>{/if}
	<div class="prose-hive mt-8">{@render children()}</div>
</article>

<style>
	.prose-hive :global(h2) { font-size: 1.35rem; font-weight: 600; margin: 2rem 0 0.6rem; }
	.prose-hive :global(p), .prose-hive :global(li) { color: var(--text-2); line-height: 1.7; }
	.prose-hive :global(p) { margin: 0.6rem 0; }
	.prose-hive :global(ul) { list-style: none; padding: 0; margin: 0.6rem 0; display: grid; gap: 0.45rem; }
	.prose-hive :global(ul li) { padding-left: 1.4rem; position: relative; }
	.prose-hive :global(ul li)::before { content: ''; position: absolute; left: 0.25rem; top: 0.65em; width: 7px; height: 7px; border-radius: 2px; background: var(--brand); transform: rotate(45deg); }
	.prose-hive :global(strong) { color: var(--text); }
	.prose-hive :global(a) { color: var(--brand); font-weight: 600; }
</style>
