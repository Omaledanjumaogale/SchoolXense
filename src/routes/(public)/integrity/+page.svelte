<script lang="ts">
	import Prose from '$ui/Prose.svelte';
	import { screen } from '$engines/integrity';
	import Icon from '$ui/Icon.svelte';
	let text = $state('Can you do my assignment on supply chains?');
	const v = $derived(screen(text));
</script>

<svelte:head><title>Integrity policy · SchoolXense</title></svelte:head>

<Prose eyebrow="Academic integrity" title="We help you learn it. We never do it for you." lead="SchoolXense never sells completed assignments, projects, theses, take-home tests or exam answers. This rule holds in every module." updated="2 Oct 2026">
	<h2>What tutors can do</h2>
	<ul><li>Explain concepts, work examples and check your working.</li><li>Give feedback on <strong>your own</strong> draft — comments and suggestions only; your text stays read-only to them.</li><li>Coach research methods, literature search and data analysis.</li><li>Run revision cohorts and mock exams.</li></ul>
	<h2>What is blocked</h2>
	<ul><li>Writing or completing any graded work on a learner's behalf.</li><li>Sitting a test or exam for someone, or sharing leaked material.</li><li>Paraphrasing to evade plagiarism checks.</li><li>Moving bookings off-platform to avoid these rules.</li></ul>
	<h2>How we enforce it</h2>
	<p>An integrity classifier (rules plus a Claude classification for borderline text) screens booking requests, messages and uploads. Learners see why something was blocked. Flags go to a human reviewer; tutors are removed after a confirmed breach. Library packs and Studio questions pass originality checks before going live. Hosted exams log proctor events for institutions.</p>
	<h2>Try the screen</h2>
	<div class="panel p-4 not-prose">
		<textarea class="field min-h-20" bind:value={text} aria-label="Test a request"></textarea>
		<p class="mt-3 flex items-center gap-2 font-semibold" style="color:var(--{v.allowed ? 'good' : 'bad'})"><Icon name={v.allowed ? 'check' : 'alert'} size={18} />{v.allowed ? 'Allowed — this is a learning request.' : `Blocked: ${v.reasons.join(', ')}`}</p>
		{#if v.contactShared}<p class="text-sm mt-1" style="color:var(--warn)">Contact details detected — kept on-platform for your protection.</p>{/if}
	</div>
</Prose>
