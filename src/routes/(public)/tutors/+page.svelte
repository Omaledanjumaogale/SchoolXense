<script lang="ts">
	import { page } from '$app/state';
	import { hive } from '$hive/store.svelte';
	import { LANGUAGES } from '$hive/catalogue';
	import type { Offer } from '$hive/types';
	import OfferCard from '$ui/OfferCard.svelte';
	import BookingSheet from '$ui/BookingSheet.svelte';
	import PageHeader from '$ui/PageHeader.svelte';
	import Icon from '$ui/Icon.svelte';
	import Empty from '$ui/Empty.svelte';
	import { ui } from '$ui/ui.svelte';
	let q = $state(page.url.searchParams.get('q') ?? '');
	let kind = $state<'' | Offer['kind']>('');
	let lang = $state('');
	let maxPrice = $state(6000);
	let selected = $state<Offer | null>(null);
	const subjects = [...new Set(hive.db.offers.flatMap((o) => o.subjects))];
	const results = $derived(
		hive.matchOffers({ subject: subjects.find((s) => s.toLowerCase() === q.toLowerCase()), topic: q || undefined, language: lang || undefined, budgetKobo: maxPrice * 100, kind: kind || undefined })
			.filter((o) => (!q || `${o.title} ${o.subjects.join(' ')} ${o.topics.join(' ')} ${hive.user(o.tutorId)?.name}`.toLowerCase().includes(q.toLowerCase())) && (!lang || o.languages.includes(lang)) && o.priceKobo <= maxPrice * 100)
	);
</script>

<svelte:head><title>Find a verified tutor · SchoolXense</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10" data-module="tutors">
	<PageHeader eyebrow="Hive Tutors" title="Verified help, paid safely." sub="Every tutor is NIN-verified with results proof and an integrity pledge. Your payment is held in escrow until the session is done — 48 hours to dispute." />
	<div class="panel p-3 sm:p-4 flex flex-col lg:flex-row gap-3">
		<label class="flex-1 relative"><span class="sr-only">Search</span><Icon name="search" size={17} class="absolute left-3 top-1/2 -translate-y-1/2 muted" /><input class="field !pl-10" bind:value={q} placeholder="Subject, topic or course code — e.g. Optics, MTH 101" /></label>
		<div class="flex flex-wrap gap-1.5 items-center">
			{#each [['', 'All'], ['tutoring', '1:1 / group'], ['feedback', 'Draft feedback'], ['coaching', 'Research coaching'], ['skills', 'Skills']] as [k, l]}
				<button class="ctl chip" data-active={kind === k} onclick={() => (kind = k as typeof kind)}>{l}</button>
			{/each}
		</div>
		<select class="field lg:!w-40" bind:value={lang} aria-label="Language"><option value="">Any language</option>{#each LANGUAGES as l}<option>{l}</option>{/each}</select>
		<label class="flex items-center gap-2 text-sm whitespace-nowrap">≤ <span class="num font-semibold w-16">₦{maxPrice.toLocaleString()}</span><input type="range" min="500" max="6000" step="250" bind:value={maxPrice} class="accent-[var(--brand)] w-28" /></label>
	</div>
	<p class="text-sm muted mt-4">{results.length} tutors · ranked by fit, rating and completion — newly verified tutors get a fair boost.</p>
	<div class="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
		{#each results as o (o.id)}<OfferCard offer={o} onbook={(x) => (selected = x)} />{:else}<div class="md:col-span-3"><Empty icon="search" title="No tutors match yet" body="Try another topic or widen the price range." /></div>{/each}
	</div>
	{#if ui.me?.isMinor}<p class="text-xs muted mt-4 flex gap-1.5"><Icon name="shield" size={14} />Showing only tutors approved for under-18 learners.</p>{/if}
</section>

<BookingSheet bind:offer={selected} preferTopic={q} />
