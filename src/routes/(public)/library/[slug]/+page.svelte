<script lang="ts">
	import { DEMO_MODE } from '$lib/config';
	import LivePack from '$lib/live/LivePack.svelte';
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ui } from '$ui/ui.svelte';
	import { naira, date } from '$ui/format';
	import Icon from '$ui/Icon.svelte';
	import Avatar from '$ui/Avatar.svelte';
	import Stars from '$ui/Stars.svelte';
	import HiveShare from '$ui/HiveShare.svelte';
	let { data } = $props();
	const p = $derived(DEMO_MODE?hive.db.packs.find((x) => x.id === data.packId)!:null as never);
	const a = $derived(DEMO_MODE?hive.user(p.authorId)!:null as never);
	const owned = $derived(!!ui.me && hive.db.purchases.some((x) => x.userId === ui.me!.id && x.packId === p.id));
	function buy() {
		if (!ui.me) { goto(`/login?next=/library/${p.slug}`); return; }
		const pay = ui.run(() => hive.buyPack(p.id));
		if (pay) goto(`/checkout/${pay.id}`);
	}
</script>
<svelte:head><title>{DEMO_MODE ? `${p.title} · SchoolXense Library` : 'SchoolXense Library · Study packs'}</title></svelte:head>

{#if !DEMO_MODE}<LivePack slug={data.slug}/>{:else}
<section class="max-w-[1100px] mx-auto px-4 sm:px-6 pt-10 grid lg:grid-cols-[1.5fr_1fr] gap-6" data-module="library">
	<div class="flex flex-col gap-5">
		<a href="/library" class="link text-sm inline-flex items-center gap-1"><Icon name="arrow-left" size={14} />Library</a>
		<h1 class="text-3xl font-semibold">{p.title}</h1>
		<div class="flex items-center gap-3"><Avatar name={a.name} hue={a.hue} size={32} /><span class="text-sm">by <a class="link" href={a.slug ? `/tutors/${a.slug}` : '#'}>{a.name}</a> · updated {date(p.createdAt)} · version {p.version}</span></div>
		<div class="panel p-6">
			<p class="eyebrow mb-3">{owned ? 'Your pack' : 'Preview'}</p>
			<ul class="grid gap-3">{#each p.preview as line, i}<li class="flex gap-3"><span class="num text-xs muted mt-1">{String(i + 1).padStart(2, '0')}</span><span>{line}</span></li>{/each}</ul>
			{#if owned}
				<div class="panel-sunk mt-5 p-4 text-sm"><p class="font-semibold flex items-center gap-2"><Icon name="check" size={16} class="text-[var(--good)]" />Full pack unlocked ({p.pages} pages)</p><p class="muted mt-1">Opens in the reader from Cloudflare R2 via a signed URL. You'll keep access to every future version.</p><button class="ctl ctl-sm mt-3" onclick={() => ui.toast('Signed download link created (demo)', 'good')}><Icon name="download" size={15} />Download PDF</button></div>
			{:else}
				<div class="relative mt-5 h-28 rounded-lg overflow-hidden panel-sunk"><div class="absolute inset-0 p-4 text-sm muted blur-[3px] select-none">Sign convention: distances measured from the optical centre; real is positive. For a converging lens, f &gt; 0. Object at 2F → image at 2F, real, inverted, same size …</div><div class="absolute inset-0 grid place-items-center"><span class="badge badge-brand"><Icon name="lock" size={12} />Unlock the full pack</span></div></div>
			{/if}
		</div>
	</div>
	<aside class="flex flex-col gap-4 lg:sticky lg:top-20 h-fit">
		<div class="panel p-5 flex flex-col gap-3">
			<p class="num text-3xl font-semibold">{naira(p.priceKobo)}</p>
			<div class="flex items-center gap-3 text-sm"><Stars value={p.rating} /><span class="muted num">{p.sales} sold</span></div>
			<span class="badge badge-good w-fit"><Icon name="shield-check" size={12} />Originality check passed · {Math.round(p.originality * 100)}% similarity</span>
			{#if owned}<span class="ctl" data-pressed="true"><Icon name="check" size={16} />Owned</span>{:else}<button class="ctl ctl-primary" onclick={buy}><Icon name="lock" size={16} />Buy with Flutterwave</button>{/if}
			<p class="text-xs muted">Schools can licence packs for whole classes from the institution console.</p>
		</div>
		<div class="panel p-5"><p class="eyebrow mb-3">Where your money goes</p><HiveShare kind="pack" grossKobo={p.priceKobo} referrer={!!a.referredBy} /></div>
	</aside>
</section>
{/if}
