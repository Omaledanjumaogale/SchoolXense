<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	let { open = $bindable(false), title, children, footer, wide = false }: { open: boolean; title: string; children: Snippet; footer?: Snippet; wide?: boolean } = $props();
	let dialog = $state<HTMLDialogElement>();
	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="sheet panel p-0 m-auto max-h-[92dvh] w-[min(100vw-1.5rem,{wide ? '44rem' : '30rem'})] overflow-hidden" aria-label={title}>
	{#if open}
		<div class="flex items-center justify-between gap-3 px-5 py-4 divider-b" style="border-bottom:1px solid var(--line)">
			<h2 class="text-lg font-semibold">{title}</h2>
			<button class="ctl ctl-sm ctl-icon ctl-ghost" onclick={() => (open = false)} aria-label="Close"><Icon name="x" size={18} /></button>
		</div>
		<div class="px-5 py-4 overflow-y-auto max-h-[70dvh]">{@render children()}</div>
		{#if footer}<div class="px-5 py-4 flex gap-2 justify-end" style="border-top:1px solid var(--line);background:var(--surface-sunk)">{@render footer()}</div>{/if}
	{/if}
</dialog>

<style>
	.sheet { color: var(--text); background: var(--surface-solid); }
	.sheet::backdrop { background: rgba(8, 12, 22, 0.55); backdrop-filter: blur(3px); }
	.sheet[open] { animation: rise 260ms var(--ease-snap); }
</style>
