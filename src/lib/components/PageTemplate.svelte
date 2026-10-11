<script lang="ts">
 import type {Snippet} from 'svelte';import TLDRBlock from './TLDRBlock.svelte';import RelatedLinks from './RelatedLinks.svelte';
 let {title,intro,modified,links=[],children}:{title:string;intro:string;modified?:string;links?:{title:string;url:string}[];children:Snippet}=$props();
</script>
<article class="max-w-4xl mx-auto px-4 py-12"><h1 class="text-4xl font-semibold mb-6">{title}</h1><TLDRBlock text={intro}/>{#if modified}<p class="muted text-sm mt-3">Last updated <time datetime={modified}>{modified}</time></p>{/if}<div class="grid gap-8 mt-8">{@render children()}<RelatedLinks {links}/></div></article>
