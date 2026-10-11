<script lang="ts">
 import { useQuery, useConvexClient } from 'convex-svelte';
 import { api } from '$convex/_generated/api';
 const client = useConvexClient(), account = useQuery(api.payoutAccounts.mine, {});
 let banks = $state<{code:string;name:string}[]>([]), bankCode = $state(''), accountNumber = $state(''), busy = $state(false), message = $state('');
 async function loadBanks() { busy=true; message=''; try { banks=await client.action(api.payoutAccounts.banks, {}); } catch { message='Bank verification is unavailable. Please try again later.'; } finally { busy=false; } }
 async function save(event:SubmitEvent) { event.preventDefault(); busy=true; message=''; try { await client.action(api.payoutAccounts.onboard,{bankCode,accountNumber});accountNumber='';message='Your name-matched bank account was saved.'; } catch(e) { message=e instanceof Error?e.message:'Unable to verify the bank account.'; } finally { busy=false; } }
</script>
<section class="panel p-5 mb-5"><h2 class="text-xl font-semibold">Payout bank account</h2>
 {#if account.data}<p class="muted mt-2">{account.data.bankName} · ending {account.data.accountLast4} · {account.data.accountName}</p>{/if}
 <p class="muted text-sm mt-2">Use an account in your profile name. Changing banks requires all pending payouts to be resolved.</p>
 {#if !banks.length}<button class="ctl mt-3" disabled={busy} onclick={loadBanks}>Load banks</button>{:else}
 <form class="grid gap-3 mt-4" onsubmit={save}><label class="label" for="payout-bank">Bank</label><select id="payout-bank" class="field" bind:value={bankCode} required><option value="">Choose a bank</option>{#each banks as bank}<option value={bank.code}>{bank.name}</option>{/each}</select><label class="label" for="bank-account-number">Account number</label><input id="bank-account-number" class="field" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" autocomplete="off" bind:value={accountNumber} required /><button class="ctl ctl-primary" disabled={busy}>Verify and save account</button></form>{/if}
 {#if message}<p class="mt-3 text-sm" role="status">{message}</p>{/if}
</section>
