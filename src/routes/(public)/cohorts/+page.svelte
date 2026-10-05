<script lang="ts">
	import { goto } from '$app/navigation';
	import { hive } from '$hive/store.svelte';
	import { ui } from '$ui/ui.svelte';
	import { naira, date } from '$ui/format';
	import PageHeader from '$ui/PageHeader.svelte';
	import Icon from '$ui/Icon.svelte';
	import Avatar from '$ui/Avatar.svelte';
	const cohorts = $derived(hive.db.cohorts.slice().sort((a, b) => a.startsAt - b.startsAt));
	function join(id: string) {
		if (!ui.me) { goto('/login?next=/cohorts'); return; }
		const p = ui.run(() => hive.joinCohort(id));
		if (p) goto(`/checkout/${p.id}`);
	}
</script>

<svelte:head><title>Hive Cohorts · Exam-season groups</title></svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 pt-10" data-module="cohorts">
	<PageHeader eyebrow="Hive Cohorts" title="Revise together, with a host who's done it." sub="Small paid groups around JAMB, WAEC, semester exams and professional papers. Co-hosts split income automatically by agreed rules. Seat payments stay in escrow until the weeks are delivered." />
	<div class="grid md:grid-cols-2 gap-4">
		{#each cohorts as c (c.id)}
			{@const host = hive.user(c.hostId)!}
			{@const left = c.seats - c.members.length}
			{@const isIn = !!ui.me && c.members.includes(ui.me.id)}
			<article id={c.id} class="panel p-5 flex flex-col gap-4" data-module={c.module}>
				<div class="flex items-start justify-between gap-3">
					<div><span class="badge badge-accent">{c.exam.toUpperCase()} · {c.weeks} weeks</span><h2 class="text-xl font-semibold mt-2 leading-snug">{c.title}</h2></div>
					<div class="text-right shrink-0"><p class="num text-xl font-semibold">{naira(c.priceKobo)}</p><p class="text-xs muted">per seat</p></div>
				</div>
				<p class="text-sm text-[var(--text-2)]">{c.description}</p>
				<div class="flex items-center gap-3 flex-wrap text-sm">
					<span class="flex items-center gap-1.5"><Icon name="calendar" size={15} />Starts {date(c.startsAt, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
					<span class="flex items-center gap-1.5"><Icon name="clock" size={15} />{c.schedule}</span>
					{#if c.minorsAllowed}<span class="badge badge-info">Under-18s welcome · guardian consent</span>{/if}
				</div>
				<div>
					<div class="flex justify-between text-xs mb-1.5"><span class="muted">{c.members.length} of {c.seats} seats</span><span class="font-semibold" style="color:var(--{left <= 3 ? 'bad' : 'good'})">{left} left</span></div>
					<div class="meter"><span style="width:{(c.members.length / c.seats) * 100}%"></span></div>
				</div>
				<div class="flex items-center justify-between gap-3 mt-auto">
					<div class="flex items-center -space-x-2">
						{#each c.coHosts as h}{@const hu = hive.user(h.userId)!}<span title="{hu.name} · {h.bp / 100}% of host share"><Avatar name={hu.name} hue={hu.hue} size={30} /></span>{/each}
						<span class="pl-4 text-xs muted">Hosted by {host.name}{c.coHosts.length > 1 ? ` + ${c.coHosts.length - 1}` : ''}</span>
					</div>
					{#if isIn}<span class="ctl ctl-sm" data-pressed="true"><Icon name="check" size={15} />You're in</span>{:else}<button class="ctl ctl-sm ctl-primary" disabled={left <= 0} onclick={() => join(c.id)}>Join cohort</button>{/if}
				</div>
			</article>
		{/each}
	</div>
</section>
