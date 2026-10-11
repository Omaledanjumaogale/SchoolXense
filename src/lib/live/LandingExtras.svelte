<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import Icon from '$ui/Icon.svelte';
	const testimonials = useQuery(api.portal.testimonials, {});
	const examples = [
		{ name: 'A learner’s perspective', role: 'Example story', quote: 'I want a clear picture of what I understand, what needs more work and which topic to practise next.', example: true },
		{ name: 'A parent’s perspective', role: 'Example story', quote: 'I want to support my child’s progress and approve paid learning support with confidence.', example: true },
		{ name: 'A tutor’s perspective', role: 'Example story', quote: 'I want to share what I know, work with motivated learners and see a clear record of my sessions and earnings.', example: true }
	];
	const stories = $derived(testimonials.data?.length ? testimonials.data : examples);
	import {HOME_FAQ as faqs} from '$lib/home-faq';
	let busy = $state(false), notice = $state(''), error = $state('');
	async function submit(event: SubmitEvent) {
		event.preventDefault(); busy = true; notice = ''; error = '';
		const form = event.currentTarget as HTMLFormElement;
		try { const response = await fetch('/api/enquiries', { method: 'POST', body: new FormData(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.message ?? 'Unable to submit your enquiry.'); notice = 'Your enquiry has been received. Our team will follow up with you.'; form.reset(); }
		catch (e) { error = e instanceof Error ? e.message : 'Please try again.'; }
		finally { busy = false; }
	}
</script>
<svelte:head>{@html '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))})+'</script>'}</svelte:head>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24" id="learning-community" aria-labelledby="community-title">
	<p class="eyebrow">Learning is better together</p><h2 id="community-title" class="text-3xl sm:text-4xl font-semibold mt-2">Real people. Shared ambitions.</h2>
	<p class="muted mt-4 max-w-2xl">Make room for focused study, useful conversations and people who help you keep going.</p>
	<div class="grid md:grid-cols-3 gap-4 mt-8">
		{#each [
			{ key: 'learning-together.webp', title: 'Learn in good company', text: 'Build understanding through practice and discussion.', alt: 'A group collaborating around a laptop', credit: 'Desola Lanre-Ologun', source: 'https://unsplash.com/photos/IgUR1iX0mqM' },
			{ key: 'collaboration.webp', title: 'Share what you know', text: 'Turn a shared challenge into a useful learning conversation.', alt: 'Colleagues working together at a table', credit: 'Annie Spratt', source: 'https://unsplash.com/photos/QckxruozjRg' },
			{ key: 'study-community.webp', title: 'Grow your community', text: 'Connect your individual goals with the people around you.', alt: 'People talking and collaborating around a table', credit: 'Brooke Cagle', source: 'https://unsplash.com/photos/g1Kr4Ozfoac' }
		] as photo}<figure class="panel overflow-hidden"><img src={`/api/images/landing/${photo.key}`} alt={photo.alt} width="1200" height="800" loading="lazy" decoding="async" class="w-full aspect-[3/2] object-cover" /><figcaption class="p-5"><h3 class="font-semibold text-lg">{photo.title}</h3><p class="muted text-sm mt-2">{photo.text}</p><a class="text-[10px] muted inline-block mt-4" href={photo.source} target="_blank" rel="noopener noreferrer">Photo: {photo.credit} / Unsplash</a></figcaption></figure>{/each}
	</div>
	<p class="text-xs muted mt-3">Illustrative photography. People pictured are not presented as SchoolXense customers.</p>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24" id="testimonials" aria-labelledby="stories-title">
	<p class="eyebrow">Learners, families and tutors</p><h2 id="stories-title" class="text-3xl sm:text-4xl font-semibold mt-2">Different goals. One supportive community.</h2>
	<div class="grid md:grid-cols-3 gap-4 mt-8">{#each stories as story}<article class="panel p-6 flex flex-col gap-4"><Icon name="message" size={24} /><blockquote class="text-lg leading-relaxed">“{story.quote}”</blockquote><div class="mt-auto"><p class="font-semibold">{story.name}</p><p class="text-xs muted mt-1">{story.role}</p>{#if story.example}<span class="badge badge-info mt-3">Example story · not a customer testimonial</span>{/if}</div></article>{/each}</div>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24 grid lg:grid-cols-[.7fr_1.3fr] gap-8" id="faq" aria-labelledby="faq-title">
	<div><p class="eyebrow">A few useful answers</p><h2 id="faq-title" class="text-3xl sm:text-4xl font-semibold mt-2">Before you get started</h2><a class="ctl mt-5" href="/faq">Read more FAQs<Icon name="arrow-right" size={16} /></a></div>
	<div class="grid gap-3">{#each faqs as [q, a]}<details class="panel p-5"><summary class="font-semibold cursor-pointer">{q}</summary><p class="muted mt-4 text-sm leading-relaxed">{a}</p></details>{/each}</div>
</section>

<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-24" id="enquiries" aria-labelledby="enquiry-title">
	<div class="panel p-6 sm:p-10 grid lg:grid-cols-2 gap-10"><div><p class="eyebrow">Let’s talk about your goals</p><h2 id="enquiry-title" class="text-3xl font-semibold mt-2">Bring your learning community to SchoolXense.</h2><p class="muted mt-4">Tell us what you need—whether you are a learner, tutor, school or sponsor. Your enquiry goes directly to the SchoolXense administration queue.</p><p class="text-xs muted mt-5">We use your contact details to respond to this enquiry. Read our <a class="link" href="/privacy">privacy notice</a>.</p></div>
	<form class="grid sm:grid-cols-2 gap-4" onsubmit={submit}>
		<div><label class="label" for="enquiry-name">Your name</label><input id="enquiry-name" name="name" class="field" autocomplete="name" minlength="2" maxlength="100" required /></div>
		<div><label class="label" for="enquiry-email">Email</label><input id="enquiry-email" name="email" class="field" type="email" autocomplete="email" maxlength="254" required /></div>
		<div class="sm:col-span-2"><label class="label" for="enquiry-org">School or organisation (optional)</label><input id="enquiry-org" name="organisation" class="field" autocomplete="organization" maxlength="150" /></div>
		<div class="sm:col-span-2"><label class="label" for="enquiry-topic">What can we help with?</label><select id="enquiry-topic" name="topic" class="field"><option>Learning support</option><option>School onboarding</option><option>Tutoring and creation</option><option>Sponsorship and partnership</option><option>General enquiry</option></select></div>
		<div class="sm:col-span-2"><label class="label" for="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" class="field min-h-32" minlength="10" maxlength="4000" required></textarea></div>
		<div class="hidden" aria-hidden="true"><label for="enquiry-website">Leave this blank</label><input id="enquiry-website" name="website" tabindex="-1" autocomplete="off" /></div>
		<label class="sm:col-span-2 flex gap-2 text-xs muted"><input type="checkbox" name="consent" value="yes" required /><span>I agree to be contacted about this enquiry.</span></label>
		{#if error}<p class="sm:col-span-2 text-sm" role="alert" style="color:var(--bad)">{error}</p>{/if}{#if notice}<p class="sm:col-span-2 text-sm" role="status" style="color:var(--good)">{notice}</p>{/if}
		<button class="ctl ctl-primary sm:col-span-2 !h-12" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}<Icon name="arrow-right" size={16} /></button>
	</form></div>
</section>
