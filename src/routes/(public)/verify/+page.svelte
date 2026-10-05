<script lang="ts">
	import { goto } from '$app/navigation';
	import Prose from '$ui/Prose.svelte';
	let code = $state('');
</script>

<svelte:head><title>Verify a certificate · SchoolXense</title></svelte:head>

<Prose eyebrow="Hive Record" title="Verify a certificate or record" lead="Enter the code printed on a SchoolXense certificate, or open a Hive Record share link.">
	<form class="panel p-4 flex gap-2 not-prose" onsubmit={(e) => { e.preventDefault(); goto(`/verify/${encodeURIComponent(code.trim())}`); }}>
		<input class="field num uppercase" bind:value={code} aria-label="Certificate code" required maxlength="40" />
		<button class="ctl ctl-primary">Verify</button>
	</form>
</Prose>
