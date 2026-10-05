<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	let { icon = 'sparkles', title, body, children }: { icon?: string; title: string; body?: string; children?: Snippet } = $props();
</script>

<div class="panel-sunk flex flex-col items-center text-center gap-2 px-6 py-10">
	<span class="grid place-items-center w-12 h-12 rounded-2xl panel" style="color:var(--brand)"><Icon name={icon} size={22} /></span>
	<p class="font-semibold mt-1">{title}</p>
	{#if body}<p class="text-sm muted max-w-sm">{body}</p>{/if}
	{#if children}<div class="mt-2">{@render children()}</div>{/if}
</div>
