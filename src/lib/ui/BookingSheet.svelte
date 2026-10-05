<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Offer } from '$hive/types';
	import { hive } from '$hive/store.svelte';
	import { ui } from './ui.svelte';
	import { naira } from './format';
	import Sheet from './Sheet.svelte';
	import Icon from './Icon.svelte';
	import Avatar from './Avatar.svelte';
	import { screen } from '$engines/integrity';
	let { offer = $bindable(null), handoffFrom, preferTopic }: { offer: Offer | null; handoffFrom?: string; preferTopic?: string } = $props();
	let open = $state(false);
	let topic = $state('');
	let slot = $state('');
	let minutes = $state(45);
	let note = $state('');
	$effect(() => { if (offer) { open = true; topic = offer.topics.find((t) => preferTopic && t.toLowerCase().includes(preferTopic.toLowerCase())) ?? offer.topics[0] ?? ''; slot = offer.availability[0] ?? ''; note = ''; minutes = 45; } });
	$effect(() => { if (!open) offer = null; });
	const t = $derived(offer ? hive.user(offer.tutorId) : null);
	const price = $derived(offer ? Math.round((offer.priceKobo * minutes) / 45) : 0);
	const verdict = $derived(screen(`${topic} ${note}`));
	function submit() {
		if (!offer) return;
		if (!hive.me) { goto('/login?next=/book'); return; }
		const b = ui.run(() => hive.bookingsCreate({ offerId: offer!.id, topic, slot, minutes, note, handoffFrom }));
		if (!b) return;
		open = false;
		if (b.status === 'awaiting_consent') { ui.toast('Sent to your guardian for approval', 'info', 'You can pay once they approve. We’ll notify you.'); goto('/sessions'); return; }
		const p = ui.run(() => hive.checkoutBooking(b.id));
		if (p) goto(`/checkout/${p.id}`);
	}
</script>

<Sheet bind:open title={offer ? `Book ${t?.name.split(' ')[0]} · ${offer.subjects[0]}` : 'Book'}>
	{#if offer && t}
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-3"><Avatar name={t.name} hue={t.hue} /><div class="min-w-0"><p class="font-semibold truncate">{offer.title}</p><p class="text-xs muted">{t.headline}</p></div></div>
			<div>
				<span class="label">Topic</span>
				<div class="flex flex-wrap gap-1.5">{#each offer.topics as tp}<button type="button" class="ctl chip" data-active={topic === tp} onclick={() => (topic = tp)}>{tp}</button>{/each}</div>
			</div>
			<div>
				<span class="label">Time</span>
				<div class="flex flex-wrap gap-1.5">{#each offer.availability as s}<button type="button" class="ctl chip" data-active={slot === s} onclick={() => (slot = s)}><Icon name="clock" size={13} />{s}</button>{/each}</div>
			</div>
			<div>
				<span class="label">Length</span>
				<div class="flex gap-1.5">{#each [30, 45, 60, 90] as m}<button type="button" class="ctl chip" data-active={minutes === m} onclick={() => (minutes = m)}>{m} min</button>{/each}</div>
			</div>
			<div>
				<label class="label" for="bk-note">What do you want to understand? <span class="muted font-normal">(optional)</span></label>
				<textarea id="bk-note" class="field min-h-20" bind:value={note} placeholder="e.g. I keep getting lens sign conventions wrong in Q4–Q7"></textarea>
				{#if !verdict.allowed}<p class="text-xs mt-1.5 flex gap-1.5" style="color:var(--bad)"><Icon name="alert" size={14} />Tutors explain; they can't do graded work for you. Rephrase as “explain”, “check my working” or “feedback on my draft”.</p>{/if}
			</div>
			<div class="panel-sunk p-3 flex flex-col gap-1.5 text-sm">
				<div class="flex justify-between"><span>Session · {minutes} min</span><span class="num font-semibold">{naira(price)}</span></div>
				<div class="flex justify-between muted text-xs"><span class="flex items-center gap-1"><Icon name="lock" size={12} />Held safely until it's done · 48 h to dispute</span><span>Escrow</span></div>
				{#if hive.me?.isMinor}<div class="text-xs flex gap-1.5" style="color:var(--info)"><Icon name="shield" size={13} />Your guardian is included in the thread and approves bookings over their limit. Sessions are audio-recorded for 30 days.</div>{/if}
			</div>
			<p class="text-xs muted flex gap-1.5"><Icon name="info" size={14} />Tutors explain; they don't do graded work for you.</p>
		</div>
	{/if}
	{#snippet footer()}
		<button class="ctl" onclick={() => (open = false)}>Cancel</button>
		<button class="ctl ctl-primary" onclick={submit} disabled={!verdict.allowed || !topic || !slot}><Icon name="lock" size={16} />Pay {naira(price)} with Flutterwave</button>
	{/snippet}
</Sheet>
