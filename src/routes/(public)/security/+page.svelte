<script lang="ts">
	import Prose from '$ui/Prose.svelte';
</script>

<svelte:head><title>Security · SchoolXense</title></svelte:head>

<Prose eyebrow="Security" title="How we protect your account and your money." updated="2 Oct 2026">
	<h2>Money</h2>
	<ul><li>Flutterwave webhooks are checked against our secret hash, then every transaction is re-verified with Flutterwave by id before we credit anything.</li><li>Ledger writes are idempotent on the Flutterwave transaction id and double-entry: every movement is two or more rows that sum to zero.</li><li>Payouts go only to name-matched bank or mobile-money accounts; manual payouts above ₦500,000 need two staff approvals.</li><li>A daily job reconciles our ledger with Flutterwave settlement reports.</li><li>Funds between payment and release are held with a licensed partner; the ledger records ownership.</li></ul>
	<h2>Access</h2>
	<ul><li>Every backend function declares the role and tenant it needs through one access wrapper; tenant isolation is tested on every release.</li><li>Staff use SSO with hardware keys and least-privilege roles. Sensitive actions are written to an append-only audit log, exported weekly.</li></ul>
	<h2>Edge</h2>
	<ul><li>Cloudflare WAF managed rules, Turnstile on sign-up, login, checkout and AI endpoints, and per-IP and per-user rate limits.</li><li>Strict security headers: CSP with nonces, HSTS, frame-ancestors none. Secrets live only in Workers secrets.</li></ul>
	<h2>Report a vulnerability</h2>
	<p>Email <a href="mailto:security@schoolxense.ng">security@schoolxense.ng</a>. We acknowledge within 48 hours.</p>
</Prose>
