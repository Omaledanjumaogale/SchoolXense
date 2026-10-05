<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import { ago } from './format';
	import Icon from './Icon.svelte';
	let open = $state(false);
	const list = $derived(hive.myNotifications());
	const unread = $derived(list.filter((n) => !n.read).length);
</script>

<div class="relative">
	<button class="ctl ctl-icon ctl-sm relative" aria-label="Notifications ({unread} unread)" onclick={() => (open = !open)} data-pressed={open}>
		<Icon name="bell" size={18} />
		{#if unread}<span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-[10px] font-bold num" style="background:var(--brand);color:var(--brand-ink);box-shadow:var(--brand-glow)">{unread}</span>{/if}
	</button>
	{#if open}
		<button class="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onclick={() => (open = false)}></button>
		<div class="panel rise absolute right-0 mt-2 w-[min(92vw,22rem)] z-50 overflow-hidden" style="background:var(--surface-solid)">
			<div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--line)">
				<span class="font-semibold">Notifications</span>
				<button class="text-xs link" onclick={() => hive.markAllRead()}>Mark all read</button>
			</div>
			<ul class="max-h-96 overflow-y-auto">
				{#each list.slice(0, 12) as n (n.id)}
					<li>
						<a href={n.href ?? '#'} onclick={() => { hive.markRead(n.id); open = false; }} class="flex gap-3 px-4 py-3 hover:bg-[var(--surface-sunk)]" style="border-bottom:1px solid var(--line)">
							<span class="mt-1.5 w-2 h-2 rounded-full shrink-0" style="background:{n.read ? 'transparent' : `var(--${n.tone ?? 'info'})`}"></span>
							<span class="min-w-0 flex-1"><span class="block text-sm font-medium">{n.title}</span><span class="block text-xs muted line-clamp-2">{n.body}</span><span class="block text-[11px] muted mt-0.5">{ago(n.at)}</span></span>
						</a>
					</li>
				{:else}
					<li class="p-6 text-sm muted text-center">You're all caught up.</li>
				{/each}
			</ul>
			<a href="/notifications" class="block text-center text-sm link py-2.5" onclick={() => (open = false)}>See all</a>
		</div>
	{/if}
</div>
