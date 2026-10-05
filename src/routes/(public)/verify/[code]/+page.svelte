<script lang="ts">
	import { page } from '$app/state';
	import { hive } from '$hive/store.svelte';
	import { date } from '$ui/format';
	import Icon from '$ui/Icon.svelte';
	import HexMark from '$ui/HexMark.svelte';
	const code = $derived(page.params.code?.toUpperCase());
	const c = $derived(hive.db.certificates.find((x) => x.code === code));
	const u = $derived(c ? hive.user(c.userId) : null);
</script>

<svelte:head><title>Verification · SchoolXense</title></svelte:head>

<section class="max-w-xl mx-auto px-4 pt-14">
	<div class="panel p-6 flex flex-col items-center text-center gap-3">
		<HexMark size={48} />
		{#if c && u}
			<span class="badge badge-good"><Icon name="shield-check" size={12} />Verified certificate</span>
			<h1 class="text-2xl font-semibold">{c.title}</h1>
			<p class="text-[var(--text-2)]">Awarded to <b>{u.name}</b> on {date(c.issuedAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
			<p class="num text-3xl font-semibold">{c.pct}% · {c.grade}</p>
			<p class="text-xs muted num">Code {c.code}</p>
		{:else}
			<span class="badge badge-bad"><Icon name="alert" size={12} />Not found</span>
			<h1 class="text-2xl font-semibold">We couldn't verify “{code}”</h1>
			<p class="muted text-sm">Check the code and try again. Verification links expire after 30 days.</p>
		{/if}
		<a href="/verify" class="ctl ctl-sm mt-2">Verify another</a>
	</div>
</section>
