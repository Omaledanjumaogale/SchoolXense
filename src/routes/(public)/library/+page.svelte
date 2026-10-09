<script lang="ts">
	import { DEMO_MODE } from '$lib/config';
	import LiveCatalogue from '$lib/live/LiveCatalogue.svelte';
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ui } from '$ui/ui.svelte';
	import { naira } from '$ui/format';
	import PageHeader from '$ui/PageHeader.svelte';
	import Icon from '$ui/Icon.svelte';
	import Stars from '$ui/Stars.svelte';
	import Tabs from '$ui/Tabs.svelte';
	let tab = $state('all');
	let q = $state('');
	const owned = $derived(new Set(ui.me ? hive.db.purchases.filter((p) => p.userId === ui.me!.id).map((p) => p.packId) : []));
	const packs = $derived(hive.db.packs.filter((p) => p.status === 'live' && (tab === 'all' || (tab === 'owned' ? owned.has(p.id) : p.kind === tab)) && (!q || `${p.title} ${p.subject}`.toLowerCase().includes(q.toLowerCase()))));
	function buy(id: string) {
		if (!ui.me) { goto('/login?next=/library'); return; }
		const p = ui.run(() => hive.buyPack(id));
		if (p) goto(`/checkout/${p.id}`);
	}
</script>
<svelte:head><title>SchoolXense Library · Study packs</title></svelte:head>

{#if !DEMO_MODE}<LiveCatalogue/>{:else}
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10" data-module="library">
	<PageHeader eyebrow="Hive Library" title="Original notes, flashcards and worked solutions." sub="Every pack passes an originality check before it goes live. Authors keep 85% of each sale, and buyers keep access to every updated version." />
	<div class="flex flex-wrap items-center gap-3 justify-between">
		<Tabs bind:value={tab} label="Pack type" items={[{ id: 'all', label: 'All' }, { id: 'notes', label: 'Notes' }, { id: 'flashcards', label: 'Flashcards' }, { id: 'worked-solutions', label: 'Worked solutions' }, ...(ui.me ? [{ id: 'owned', label: 'Owned', count: owned.size }] : [])]} />
		<input class="field sm:!w-72" bind:value={q} placeholder="Search packs…" aria-label="Search packs" />
	</div>
	<div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each packs as p (p.id)}
			{@const a = hive.user(p.authorId)}
			<article class="panel card-interactive p-5 flex flex-col gap-3">
				<div class="flex items-start justify-between gap-3">
					<div class="relative w-14 h-[4.2rem] rounded-md shrink-0 grid place-items-center text-white" style="background:linear-gradient(160deg,hsl({a?.hue ?? 30} 60% 50%),hsl({((a?.hue ?? 30) + 40) % 360} 55% 35%));box-shadow:inset 0 1px 0 rgba(255,255,255,.3),3px 3px 0 -1px var(--surface-solid),3px 3px 0 0 var(--line),6px 6px 0 -1px var(--surface-solid),6px 6px 0 0 var(--line)"><Icon name="book" size={22} /></div>
					<span class="badge">{p.kind.replace('-', ' ')} · v{p.version}</span>
				</div>
				<a href="/library/{p.slug}" class="font-semibold text-lg leading-snug hover:underline">{p.title}</a>
				<p class="text-xs muted">{p.subject} · {p.exam} · {p.pages} pages · by {a?.name}</p>
				<div class="flex items-center gap-3 text-sm"><Stars value={p.rating} /><span class="muted text-xs num">{p.sales} sold</span><span class="badge badge-good !text-[10px]">{Math.round((1 - p.originality) * 100)}% original</span></div>
				<div class="flex items-center justify-between mt-auto pt-2">
					<span class="num text-xl font-semibold">{naira(p.priceKobo)}</span>
					{#if owned.has(p.id)}<a href="/library/{p.slug}" class="ctl ctl-sm"><Icon name="eye" size={15} />Open</a>{:else}<button class="ctl ctl-sm ctl-primary" onclick={() => buy(p.id)}>Buy</button>{/if}
				</div>
			</article>
		{/each}
	</div>
</section>
{/if}
