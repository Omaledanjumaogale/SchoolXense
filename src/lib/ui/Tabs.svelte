<script lang="ts">
	let { items, value = $bindable(), label = 'Tabs', size = 'sm' }: { items: { id: string; label: string; count?: number }[]; value: string; label?: string; size?: 'sm' | 'md' } = $props();
</script>

<div role="tablist" aria-label={label} class="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
	{#each items as it (it.id)}
		<button role="tab" type="button" aria-selected={value === it.id} class="ctl {size === 'sm' ? 'ctl-sm' : ''} tab" onclick={() => (value = it.id)}>
			{it.label}
			{#if it.count !== undefined}<span class="badge !py-0 !px-1.5 num">{it.count}</span>{/if}
		</button>
	{/each}
</div>
