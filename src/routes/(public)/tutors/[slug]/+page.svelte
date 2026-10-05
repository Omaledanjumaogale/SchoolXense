<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import type { Offer } from '$hive/types';
	import Avatar from '$ui/Avatar.svelte';
	import Stars from '$ui/Stars.svelte';
	import Icon from '$ui/Icon.svelte';
	import OfferCard from '$ui/OfferCard.svelte';
	import BookingSheet from '$ui/BookingSheet.svelte';
	let { data } = $props();
	const u = $derived(hive.user(data.userId)!);
	const offers = $derived(hive.db.offers.filter((o) => o.tutorId === u.id));
	const reviews = $derived(hive.db.bookings.filter((b) => b.tutorId === u.id && b.review).slice(0, 4));
	const qs = $derived(hive.db.questions.filter((q) => q.authorId === u.id).length);
	const teams = $derived(hive.db.teams.filter((t) => t.members.some((m) => m.userId === u.id)));
	const best = $derived(offers[0]);
	let selected = $state<Offer | null>(null);
</script>

<svelte:head><title>{u.name} · SchoolXense tutor</title></svelte:head>

<section class="max-w-[1100px] mx-auto px-4 sm:px-6 pt-10">
	<div class="panel p-6 sm:p-8 grid md:grid-cols-[auto_1fr_auto] gap-6 items-start">
		<Avatar name={u.name} hue={u.hue} size={92} ring />
		<div class="min-w-0">
			<h1 class="text-3xl font-semibold">{u.name}</h1>
			<p class="text-[var(--text-2)] mt-1">{u.headline}</p>
			<div class="flex flex-wrap gap-2 mt-3">
				{#if u.verified.nin}<span class="badge badge-good"><Icon name="shield-check" size={12} />NIN verified</span>{/if}
				{#if u.verified.results}<span class="badge badge-good"><Icon name="badge" size={12} />Results verified</span>{/if}
				{#if u.verified.pledge}<span class="badge badge-info"><Icon name="check" size={12} />Integrity pledge</span>{/if}
				{#if u.verified.minorsApproved}<span class="badge badge-accent">Approved for under-18s</span>{/if}
				{#each u.languages ?? [] as l}<span class="badge">{l}</span>{/each}
			</div>
			<p class="mt-4 text-[var(--text-2)] max-w-2xl">{u.bio}</p>
			<p class="text-sm muted mt-2 flex items-center gap-1.5"><Icon name="map-pin" size={14} />{u.institution ?? ''}{u.state ? ` · ${u.state}` : ''}</p>
		</div>
		{#if best}
			<div class="panel-sunk p-4 w-full md:w-56 flex flex-col gap-2">
				<Stars value={best.rating} count={best.reviews} />
				<p class="text-sm"><span class="num font-semibold">{offers.reduce((s, o) => s + o.sessions, 0)}</span> sessions · <span class="num">{Math.round(best.completion * 100)}%</span> completion</p>
				{#if qs}<p class="text-sm"><span class="num font-semibold">{qs}</span> Studio questions live</p>{/if}
				<button class="ctl ctl-primary mt-1" onclick={() => (selected = best)}>Book a session</button>
			</div>
		{/if}
	</div>

	<div class="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-6">
		<div>
			<h2 class="text-xl font-semibold mb-3">Offers</h2>
			<div class="grid gap-3">{#each offers as o (o.id)}<OfferCard offer={o} onbook={(x) => (selected = x)} />{/each}</div>
		</div>
		<div class="flex flex-col gap-6">
			<div>
				<h2 class="text-xl font-semibold mb-3">What learners say</h2>
				<div class="grid gap-2">
					{#each reviews as r (r.id)}
						{@const l = hive.user(r.learnerId)}
						<div class="panel p-4"><Stars value={r.rating ?? 5} /><p class="text-sm mt-1.5">“{r.review}”</p><p class="text-xs muted mt-1">{l?.name.split(' ')[0]} · {r.topic}</p></div>
					{:else}<p class="text-sm muted">No reviews yet.</p>{/each}
				</div>
			</div>
			{#if teams.length}
				<div><h2 class="text-xl font-semibold mb-3">Teams</h2>{#each teams as t}<a href="/teams/{t.id}" class="panel card-interactive p-3 flex items-center gap-2 mb-2"><Icon name="users" size={16} />{t.name}</a>{/each}</div>
			{/if}
		</div>
	</div>
</section>

<BookingSheet bind:offer={selected} />
