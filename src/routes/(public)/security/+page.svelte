<script lang="ts">
	import Prose from '$ui/Prose.svelte';
</script>

<svelte:head><title>Security · SchoolXense</title></svelte:head>

<Prose eyebrow="Security" title="How we protect your account and your money." updated="2 Oct 2026">
	<h2>Money</h2>
	<ul><li>Flutterwave and Korapay webhook signatures are checked, and successful payment receipts are independently verified with the provider before access or wallet credit is granted.</li><li>Ledger entries use provider-specific transaction identifiers to prevent duplicate credits. Entries record the ownership of funds.</li><li>Payouts require a verified, name-matched bank account and two independent staff approvals. Uncertain transfers require receipt reconciliation before another attempt.</li><li>Administrators can verify payment, refund and payout receipts against their provider records.</li></ul>
	<h2>Access</h2>
	<ul><li>Protected backend operations check the authenticated account, role and relevant access conditions. Paid features check subscription dates and verified payment ownership.</li><li>Sensitive administrative decisions are recorded in the audit log.</li></ul>
	<h2>Edge</h2>
	<ul><li>Security headers and operation-specific rate limits help protect the application. Payment and authentication secrets remain in server-side deployment configuration.</li></ul>
	<h2>Report a vulnerability</h2>
	<p>Email <a href="mailto:support@ewinproject.org">support@ewinproject.org</a>. We acknowledge within 48 hours.</p>
</Prose>
