<script lang="ts">
	import { hive } from '$hive/store.svelte';
	import { naira } from './format';
	import Icon from './Icon.svelte';
	let { userId, onwithdraw }: { userId: string; onwithdraw?: () => void } = $props();
	const w = $derived(hive.wallet(userId));
	const month = new Date().toLocaleString('en', { month: 'short' });
</script>

<div class="panel p-5 relative overflow-hidden">
	<div class="decor absolute -right-10 -top-12 w-44 h-44 hex opacity-[.08]" style="background:var(--brand)"></div>
	<div class="flex items-center justify-between">
		<span class="eyebrow">Hive Wallet</span>
		<span class="badge badge-good"><Icon name="shield-check" size={12} />Name-matched payouts</span>
	</div>
	<div class="mt-3 num text-[2.2rem] font-semibold leading-none">{naira(w.available)}</div>
	<p class="text-sm muted mt-1">Available to withdraw</p>
	<div class="grid grid-cols-2 gap-3 mt-4">
		<div class="panel-sunk p-3"><p class="text-xs muted flex items-center gap-1"><Icon name="lock" size={12} />In escrow</p><p class="num font-semibold mt-0.5">{naira(w.inEscrow)}</p></div>
		<div class="panel-sunk p-3"><p class="text-xs muted">Earned in {month}</p><p class="num font-semibold mt-0.5">{naira(w.earnedMonth)}</p></div>
	</div>
	<div class="flex items-center gap-3 mt-4">
		<button class="ctl ctl-primary flex-1" onclick={onwithdraw} disabled={w.available < 200_000}><Icon name="bank" size={18} />Withdraw</button>
		<span class="text-xs muted leading-tight">Daily payout<br />18:00 WAT</span>
	</div>
</div>
