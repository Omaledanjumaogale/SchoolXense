<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import { ui } from './ui.svelte';
	import { ago } from './format';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	let { threadId, height = '24rem' }: { threadId: string; height?: string } = $props();
	const th = $derived(hive.db.threads.find((t) => t.id === threadId));
	const msgs = $derived(hive.db.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.at - b.at));
	let body = $state('');
	let box = $state<HTMLDivElement>();
	$effect(() => { msgs.length; queueMicrotask(() => box?.scrollTo({ top: box.scrollHeight })); });
	function send(e: Event) { e.preventDefault(); if (!body.trim()) return; const ok = ui.run(() => { hive.threadsSend(threadId, body.trim()); return true; }); if (ok) body = ''; }
</script>

{#if th}
	<div class="flex flex-col panel overflow-hidden" style="height:{height}">
		<div class="px-4 py-3 flex items-center gap-2" style="border-bottom:1px solid var(--line)">
			<Icon name="message" size={16} class="muted" /><span class="font-semibold text-sm truncate flex-1">{th.title}</span>
			<div class="flex -space-x-1.5">{#each th.participants.slice(0, 5) as p}{@const u = hive.user(p)}{#if u}<span title={u.name}><Avatar name={u.name} hue={u.hue} size={22} /></span>{/if}{/each}</div>
			{#if th.guardianIncluded}<span class="badge badge-info !text-[10px]"><Icon name="shield" size={11} />Guardian in thread</span>{/if}
		</div>
		<div bind:this={box} class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
			{#each msgs as m (m.id)}
				{#if m.system}
					<p class="text-xs text-center muted px-6">{m.body}</p>
				{:else}
					{@const u = hive.user(m.userId)}
					{@const mine = m.userId === hive.session.userId}
					<div class="flex gap-2 {mine ? 'flex-row-reverse' : ''}">
						{#if u}<Avatar name={u.name} hue={u.hue} size={28} />{/if}
						<div class="max-w-[78%]">
							<div class="px-3 py-2 rounded-2xl text-sm {mine ? 'rounded-tr-sm' : 'rounded-tl-sm panel-sunk'}" style={mine ? 'background:linear-gradient(180deg,var(--brand-2),var(--brand));color:var(--brand-ink)' : ''}>{m.body}</div>
							<p class="text-[10px] muted mt-0.5 {mine ? 'text-right' : ''}">{u?.name.split(' ')[0]} · {ago(m.at)}{m.flagged ? ' · flagged' : ''}</p>
						</div>
					</div>
				{/if}
			{:else}<p class="text-sm muted text-center my-auto">No messages yet.</p>{/each}
		</div>
		<form class="p-3 flex gap-2" style="border-top:1px solid var(--line)" onsubmit={send}>
			<input class="field" bind:value={body} placeholder="Message… (keep it on SchoolXense)" aria-label="Message" />
			<button class="ctl ctl-primary ctl-icon" aria-label="Send"><Icon name="send" size={17} /></button>
		</form>
	</div>
{/if}
