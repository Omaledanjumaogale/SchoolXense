<script lang="ts">
	import { untrack } from 'svelte';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import Icon from '$ui/Icon.svelte';
	let { initialExam = 'jamb', initialSubject = 'physics' }: { initialExam?: string; initialSubject?: string } = $props();
	let exam = $state(untrack(()=>initialExam)), subject = $state(untrack(()=>initialSubject)), mode = $state<'drill' | 'mock'>('drill');
	let attemptId = $state<Id<'attempts'> | null>(null), busy = $state(false), error = $state('');
	let result = $state<{ correct?: boolean | null; answer?: number; explanation?: string; pct?: number; grade?: string } | null>(null);
	const client = useConvexClient();
	const question = useQuery(api.practice.nextItem, () => attemptId && !result?.grade ? { attemptId } : 'skip');
	const attempts = useQuery(api.portal.workspace, { domain: 'practice' });
	let started = Date.now();
	async function run(work: () => Promise<void>) { busy = true; error = ''; try { await work(); } catch (e) { error = e instanceof Error ? e.message : 'Unable to save your answer.'; } finally { busy = false; } }
	async function start(event: SubmitEvent) { event.preventDefault(); await run(async () => { result = null; attemptId = await client.mutation(api.practice.start, { exam, subject, mode, clientId: crypto.randomUUID() }); started = Date.now(); }); }
	async function answer(chosen: number) { await run(async () => { if (!question.data || !attemptId) return; result = await client.mutation(api.practice.answer, { attemptId, questionId: question.data._id, chosen, ms: Math.max(0, Math.min(3600000, Date.now() - started)), clientId: crypto.randomUUID() }); started = Date.now(); }); }
	async function finish() { await run(async () => { if (attemptId) result = await client.mutation(api.practice.finish, { attemptId }); }); }
</script>
<section class="panel p-5 sm:p-7">
	<div class="flex gap-3 items-center"><Icon name="target" size={22} /><h2 class="text-xl font-semibold">Adaptive practice</h2></div>
	{#if error}<p role="alert" class="mt-4" style="color:var(--bad)">{error}</p>{/if}
	{#if !attemptId || result?.grade}
		{#if result?.grade}<div class="panel-sunk p-4 mt-4" role="status"><p class="num text-3xl font-semibold">{result.pct}% · {result.grade}</p><p class="muted text-sm">Your result and progress have been saved.</p></div>{/if}
		<form class="grid sm:grid-cols-3 gap-3 mt-5" onsubmit={start}>
			<div><label class="label" for="practice-exam">Exam</label><select id="practice-exam" class="field" bind:value={exam}><option value="jamb">JAMB</option><option value="waec">WAEC</option><option value="neco">NECO</option><option value="campus">Campus</option><option value="ican">ICAN</option></select></div>
			<div><label class="label" for="practice-subject">Subject</label><select id="practice-subject" class="field" bind:value={subject}>{#each ['physics', 'chemistry', 'mathematics', 'english', 'biology', 'mth101', 'gst101'] as item}<option value={item}>{item.toUpperCase()}</option>{/each}</select></div>
			<div><label class="label" for="practice-mode">Session</label><select id="practice-mode" class="field" bind:value={mode}><option value="drill">Daily drill</option><option value="mock">Timed mock</option></select></div>
			<button class="ctl ctl-primary sm:col-span-3" disabled={busy}>Start practice<Icon name="play" size={16} /></button>
		</form>
	{:else}
		{#if result?.explanation}<div class="panel-sunk p-4 mt-4" role="status"><p class="font-semibold">{result.correct ? 'Correct' : 'Keep learning'}</p><p class="mt-2 text-sm">{result.explanation}</p><button class="ctl ctl-sm mt-3" onclick={() => result = null}>Next question</button></div>
		{:else if question.data}<p class="eyebrow mt-5">{question.data.topic}</p><h3 class="text-xl font-semibold mt-3">{question.data.stem}</h3><div class="grid gap-2 mt-5">{#each question.data.options as option, i}<button class="ctl !h-auto !py-4 justify-start whitespace-normal text-left" disabled={busy} onclick={() => answer(i)}><span class="badge num">{String.fromCharCode(65 + i)}</span>{option}</button>{/each}</div>
		{:else if question.isLoading}<p class="muted mt-5">Loading your next question…</p>{:else}<p class="muted mt-5">No more reviewed questions in this session. Finish to save your result.</p>{/if}
		<button class="ctl mt-5" disabled={busy} onclick={finish}>Finish and save result</button>
	{/if}
</section>
<section class="panel p-5 mt-4"><h2 class="font-semibold">Recent practice</h2><ul class="grid gap-2 mt-4">{#each attempts.data?.attempts ?? [] as attempt}<li class="panel-sunk p-3 flex justify-between gap-3"><span>{attempt.exam.toUpperCase()} · {attempt.subject}</span><span class="num">{attempt.pct !== undefined ? `${attempt.pct}%` : 'In progress'}</span></li>{:else}<li class="muted">Your first session will appear here.</li>{/each}</ul></section>
