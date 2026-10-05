<script lang="ts">
	import HexMark from './HexMark.svelte';
	const cols = [
		['Learn', [['Hive Secondary', '/secondary'], ['Hive Campus', '/campus'], ['Hive Pro', '/pro'], ['Find a tutor', '/tutors'], ['Cohorts', '/cohorts'], ['Library', '/library']]],
		['Earn', [['Tutor & coach', '/tutors'], ['Hive Studio', '/studio-program'], ['Hive Collab', '/collab'], ['Hive Skills', '/skills'], ['Ambassadors', '/ambassadors'], ['Hive Record', '/record-info']]],
		['Institutions', [['For schools', '/for-schools'], ['For states & sponsors', '/for-sponsors'], ['Pricing', '/pricing'], ['Verify a certificate', '/verify']]],
		['Trust', [['Integrity policy', '/integrity'], ['Safety & safeguarding', '/safety'], ['Security', '/security'], ['Privacy (NDPA)', '/privacy'], ['Terms', '/terms'], ['Glossary', '/glossary'], ['FAQ', '/faq'], ['About', '/about']]]
	] as const;
</script>

<footer class="mt-24" style="border-top:1px solid var(--line);background:color-mix(in oklab,var(--surface) 50%,transparent)">
	<div class="max-w-[1240px] mx-auto px-4 sm:px-6 py-14 grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
		<div>
			<a href="/" class="flex items-center gap-2.5"><HexMark size={34} /><span class="display text-xl font-semibold">SchoolXense</span></a>
			<p class="mt-3 text-sm muted max-w-xs">Learn out loud, earn from what you've mastered. One account, one wallet, twelve modules.</p>
			<p class="mt-4 text-xs muted">Payments by Flutterwave · Hosted on Cloudflare · Built in Nigeria for Africa.</p>
		</div>
		{#each cols as [title, links]}
			<div>
				<p class="eyebrow mb-3">{title}</p>
				<ul class="flex flex-col gap-2 text-sm">{#each links as [l, h]}<li><a href={h} class="text-[var(--text-2)] hover:text-[var(--brand)]">{l}</a></li>{/each}</ul>
			</div>
		{/each}
	</div>
	<div class="max-w-[1240px] mx-auto px-4 sm:px-6 pb-8 text-xs muted flex flex-wrap gap-x-6 gap-y-2 justify-between">
		<span>© {new Date().getFullYear()} SchoolXense · schoolxense.ewinproject.org</span>
		<span>Earnings shown anywhere on SchoolXense are illustrative, not guarantees. We help you learn; we never sell completed assessed work.</span>
	</div>
</footer>
