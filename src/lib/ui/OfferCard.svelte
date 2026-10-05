<script lang="ts">
	import type { Offer } from '$hive/types';
	import { hive } from '$hive/store.svelte';
	import Avatar from './Avatar.svelte';
	import Stars from './Stars.svelte';
	import Icon from './Icon.svelte';
	import { naira } from './format';
	let { offer, onbook, compact = false }: { offer: Offer; onbook?: (o: Offer) => void; compact?: boolean } = $props();
	const t = $derived(hive.user(offer.tutorId)!);
	const KIND: Record<string, string> = { tutoring: '1:1 / group', feedback: 'Draft feedback', coaching: 'Coaching', skills: 'Skills practical' };
</script>

<article class="panel card-interactive p-4 flex flex-col gap-3">
	<div class="flex gap-3 items-start">
		<Avatar name={t.name} hue={t.hue} size={44} />
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-1.5 flex-wrap">
				<a href="/tutors/{t.slug}" class="font-semibold hover:underline">{t.name}</a>
				{#if t.verified.nin && t.verified.results}<span title="NIN + results verified" style="color:var(--good)"><Icon name="shield-check" size={15} /></span>{/if}
				{#if offer.minorsApproved}<span class="badge badge-info !text-[10px]">Approved for under-18s</span>{/if}
			</div>
			<p class="text-sm muted truncate">{offer.title}</p>
		</div>
		<div class="text-right shrink-0"><p class="num font-semibold">{naira(offer.priceKobo)}</p><p class="text-[11px] muted">per 45 min</p></div>
	</div>
	{#if !compact}
		<div class="flex flex-wrap gap-1.5">
			<span class="badge badge-brand">{KIND[offer.kind]}</span>
			{#each offer.topics.slice(0, 3) as tp}<span class="badge">{tp}</span>{/each}
			{#each offer.languages.filter((l) => l !== 'English') as l}<span class="badge badge-accent">{l}</span>{/each}
		</div>
	{/if}
	<div class="flex items-center justify-between gap-2 mt-auto">
		<div class="flex items-center gap-3 text-sm">
			<Stars value={offer.rating} count={offer.reviews} />
			{#if offer.sessions}<span class="muted text-xs num">{Math.round(offer.completion * 100)}% completion</span>{:else}<span class="badge badge-good !text-[10px]">New · boosted</span>{/if}
		</div>
		{#if onbook}<button class="ctl ctl-sm ctl-primary" onclick={() => onbook(offer)}>Book<Icon name="chevron-right" size={16} /></button>{/if}
	</div>
</article>
