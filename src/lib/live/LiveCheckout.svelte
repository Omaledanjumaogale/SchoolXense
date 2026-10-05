<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { naira } from '$ui/format';
	import Icon from '$ui/Icon.svelte';
	let { paymentId }: { paymentId: Id<'payments'> } = $props();
	const checkout = useQuery(api.checkout.get, () => ({ paymentId }));
	let busy = $state(false), error = $state('');
	async function pay() {
		busy = true; error = '';
		try {
			const response = await fetch('/api/payments/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) });
			const data = await response.json();
			if (!response.ok || !data.link) throw new Error(data.message ?? 'Checkout is temporarily unavailable.');
			const url = new URL(data.link);
			if (url.protocol !== 'https:' || !(url.hostname === 'checkout.flutterwave.com' || url.hostname.endsWith('.flutterwave.com'))) throw new Error('Invalid payment redirect.');
			location.assign(url.href);
		} catch (e) { error = e instanceof Error ? e.message : 'Unable to start checkout.'; }
		finally { busy = false; }
	}
</script>
<section class="panel p-6 max-w-xl mx-auto">
	<h2 class="text-2xl font-semibold">Secure checkout</h2>
	{#if checkout.data}<p class="num text-4xl font-semibold mt-5">{naira(Number(checkout.data.payment.amount))}</p><p class="muted mt-2">{checkout.data.payment.purpose} · {checkout.data.payment.currency}</p><p class="text-xs muted mt-3 break-all">Reference: {checkout.data.payment.txRef}</p>
		<div class="panel-sunk p-4 mt-5" role="status">{checkout.data.payment.status === 'successful' ? 'Payment verified and saved. Thank you.' : 'Your order is awaiting server-verified payment. Returning from Flutterwave does not confirm payment until verification completes.'}</div>
		{#if checkout.data.payment.status === 'pending'}<button class="ctl ctl-primary w-full mt-5" disabled={busy} onclick={pay}><Icon name="lock" size={16} />{busy ? 'Opening checkout…' : 'Continue to Flutterwave'}</button>{/if}
	{:else}<p class="muted mt-4">{checkout.error ? 'This order is unavailable for your account.' : 'Loading your order…'}</p>{/if}
	{#if error}<p role="alert" class="mt-4" style="color:var(--bad)">{error}</p>{/if}
</section>
