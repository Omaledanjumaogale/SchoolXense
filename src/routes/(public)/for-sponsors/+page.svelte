<script lang="ts">
	import Prose from '$ui/Prose.svelte';
	import { naira } from '$ui/format';
	let seats = $state(1000);
</script>

<svelte:head><title>For states & sponsors · SchoolXense</title></svelte:head>

<Prose eyebrow="Sponsored seats" title="Fund learning you can measure." lead="States, companies, alumni groups and NGOs sponsor Hive Plus for learners who can't pay — and get outcome reports by LGA and school.">
	<div class="panel p-5 not-prose">
		<label class="text-sm">Learners to sponsor: <span class="num font-semibold">{seats.toLocaleString()}</span><input type="range" min="100" max="20000" step="100" bind:value={seats} class="w-full accent-[var(--brand)]" /></label>
		<p class="num text-3xl font-semibold mt-3">{naira(seats * 400_000)}<span class="text-sm muted font-normal"> per exam season</span></p>
		<p class="text-sm muted mt-1">₦4,000 per learner · activation tracking · readiness change by LGA · quarterly impact audit</p>
		<a href="/for-schools#contact" class="ctl ctl-primary mt-4">Talk to our partnerships team</a>
	</div>
	<h2>What you get</h2>
	<ul><li>Seats funded and activated, practice hours and readiness change — live in a sponsor tenant.</li><li>An exportable outcome report for your board or ministry.</li><li>Your logo on the learner's dashboard (optional).</li></ul>
	<p>The Learner Impact Fund — 1% of most transactions on SchoolXense — also buys sponsored seats and publishes its spending every quarter.</p>
</Prose>
