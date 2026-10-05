<script lang="ts">
	import Prose from '$ui/Prose.svelte';
	import Icon from '$ui/Icon.svelte';
	const FAQ = [
		['Is SchoolXense free?', 'Yes. The free plan gives 20 adaptive questions a day across every exam and course. Hive Plus (₦2,000/month or ₦15,000/year) unlocks unlimited practice, mocks, the review queue and saved progress.'],
		['How does escrow work?', 'When you book, your payment is held. After the session, you have 48 hours to confirm or dispute. If you do nothing, the payment releases to the tutor automatically.'],
		['Can tutors do my assignment?', 'No. Tutors explain, check your working and give feedback on your own drafts. Requests to do graded work are blocked, and tutors who accept them are removed.'],
		['I am under 18. Can I use SchoolXense?', 'Yes, with a guardian linked to your account. Your guardian approves and pays for paid bookings and is included in your message threads. You earn Hive Credits for referrals, not cash.'],
		['How do earners get paid?', 'Released money sits in your Hive Wallet. Payouts require a verified, name-matched bank account. Automated transfers remain unavailable while the payment rollout is being verified.'],
		['What is the readiness range?', 'An estimate of your likely JAMB band or WAEC grade, shown as a range with a confidence level. It narrows as you answer more questions and take mocks. It is never a promise.'],
		['Does it work without data?', 'SchoolXense can be installed on compatible devices. Live learning and account data require an internet connection. When offline, the app shows a reconnect page without caching private account data.'],
		['What happened to SchoolCBT and CollegeCBT?', 'They are now Hive Secondary and Hive Campus. Old learning links redirect to the new hub. Create a verified SchoolXense account; legacy identities are not automatically linked by email or phone.']
	];
	let open = $state(0);
</script>

<svelte:head><title>FAQ · SchoolXense</title></svelte:head>

<Prose eyebrow="Help" title="Frequently asked questions">
	<div class="grid gap-2 not-prose">
		{#each FAQ as [q, a], i}
			<div class="panel overflow-hidden">
				<button class="w-full flex items-center justify-between gap-3 p-4 text-left font-semibold" aria-expanded={open === i} onclick={() => (open = open === i ? -1 : i)}>{q}<Icon name="chevron-down" size={18} class="transition-transform {open === i ? 'rotate-180' : ''}" /></button>
				{#if open === i}<p class="px-4 pb-4 text-[var(--text-2)] rise">{a}</p>{/if}
			</div>
		{/each}
	</div>
</Prose>
