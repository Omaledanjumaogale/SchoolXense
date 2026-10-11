<script lang="ts">
	import { useQuery,useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { naira } from '$ui/format';
	import Icon from '$ui/Icon.svelte';
	import {safeCheckoutUrl,type Gateway} from '$payments/gateways';
	import LanguageSelect from '$lib/i18n/LanguageSelect.svelte';
 import {accountText} from '$lib/i18n/account';
 import {transactionText} from '$lib/i18n/transactions';
	let { paymentId }: { paymentId: Id<'payments'> } = $props();
	const checkout = useQuery(api.checkout.get, () => ({ paymentId }));
	const availability=useQuery(api.gateways.availability,{});
	let gateway=$state<Gateway>('korapay');
	let busy = $state(false), error = $state('');
	const client=useConvexClient();let chargeId=$state(''),locale=$state('en');const text=$derived(transactionText(locale));const account=$derived(accountText(locale));
	async function verify(){busy=true;error='';try{const result=await client.action(api.gateways.verify,{paymentId,...(chargeId?{chargeId}:{})});if(result.status!=='successful')error=text.pending;}catch(e){error=e instanceof Error?e.message:'Payment verification is unavailable.';}finally{busy=false;}}
	async function pay() {
		busy = true; error = '';
		try {
			const response = await fetch('/api/payments/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId,gateway:checkout.data?.payment.gateway??gateway }) });
			const data = await response.json();
			if (!response.ok) throw new Error(data.message ?? 'Checkout is temporarily unavailable.');
			if(data.link)location.assign(safeCheckoutUrl(data.link,checkout.data?.payment.gateway??gateway));
			else if(!data.bank)throw new Error('Checkout details could not be confirmed.');
		} catch (e) { error = e instanceof Error ? e.message : 'Unable to start checkout.'; }
		finally { busy = false; }
	}
</script>
<section class="panel p-6 max-w-xl mx-auto" lang={locale} dir={locale==='ar'?'rtl':'ltr'}>
	<LanguageSelect bind:locale />
	<h2 class="text-2xl font-semibold">{text.checkout}</h2>
	{#if checkout.data}<p class="num text-4xl font-semibold mt-5">{naira(Number(checkout.data.payment.amount))}</p><p class="muted mt-2">{checkout.data.payment.purpose} · {checkout.data.payment.currency}</p><p class="text-xs muted mt-3 break-all">Reference: {checkout.data.payment.txRef}</p>
		<div class="panel-sunk p-4 mt-5" role="status">{checkout.data.payment.status === 'successful' ? text.verified : text.pending}</div>
		{#if checkout.data.payment.status==='pending'}
		 {#if !checkout.data.payment.gateway}<fieldset class="mt-5"><legend class="font-semibold">{text.gateway}</legend><label class="block mt-3"><input type="radio" bind:group={gateway} value="korapay" disabled={!availability.data?.korapay||busy} /> Korapay · card and bank transfer{!availability.data?.korapay?' (unavailable)':''}</label><label class="block mt-3"><input type="radio" bind:group={gateway} value="flutterwave" disabled={!availability.data?.flutterwave||busy} /> Flutterwave · bank transfer{!availability.data?.flutterwave?' (unavailable)':''}</label></fieldset>{/if}
		 {#if checkout.data.payment.bankInstructions && new Date(checkout.data.payment.bankInstructions.expiresAt).getTime() <= Date.now()}<p role="alert" class="mt-5">This temporary bank account has expired. Do not transfer funds to it. Contact support with your order reference.</p>
		 {:else if checkout.data.payment.bankInstructions}<div class="panel-sunk p-4 mt-5"><h3 class="font-semibold">{account.transfer} {naira(checkout.data.payment.bankInstructions.amountKobo)}</h3><p class="text-sm muted">Plan price {naira(Number(checkout.data.payment.amount))} + {account.fee} {naira(checkout.data.payment.bankInstructions.feeKobo)}. Do not reuse this temporary account.</p><p>{checkout.data.payment.bankInstructions.bank}</p><p class="num text-xl">{checkout.data.payment.bankInstructions.account}</p><p class="text-sm muted">{account.expires} {new Date(checkout.data.payment.bankInstructions.expiresAt).toLocaleString()}. Access starts after the provider confirms payment.</p></div>
		 {:else if checkout.data.payment.checkoutState==='reconciliation'||checkout.data.payment.checkoutState==='initializing'}<p role="status" class="mt-5">Checkout is being reconciled. Do not send another payment; contact support with your reference.</p>{#if checkout.data.payment.gateway==='flutterwave'&&checkout.data.payment.checkoutState==='reconciliation'}<button class="ctl mt-3" disabled={busy} onclick={pay}>Recover checkout details</button>{/if}
		 {:else}<button class="ctl ctl-primary w-full mt-5" disabled={busy||!availability.data?.[checkout.data.payment.gateway??gateway]} onclick={pay}><Icon name="lock" size={16} />{busy?'Opening checkout…':`${text.continue} ${checkout.data.payment.gateway??gateway}`}</button>{/if}
		{/if}
		{#if checkout.data.payment.status==='pending'&&checkout.data.payment.gateway}<div class="mt-4">{#if checkout.data.payment.gateway==='flutterwave'}<label class="block text-sm">Charge ID from your payment receipt <input class="ctl w-full mt-2" bind:value={chargeId} placeholder="chg_…" /></label>{/if}<button class="ctl mt-3" disabled={busy} onclick={verify}>{account.checkPayment}</button></div>{/if}
	{:else}<p class="muted mt-4">{checkout.error ? 'This order is unavailable for your account.' : 'Loading your order…'}</p>{/if}
	{#if error}<p role="alert" class="mt-4" style="color:var(--bad)">{error}</p>{/if}
</section>
