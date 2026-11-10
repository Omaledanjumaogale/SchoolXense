<script lang="ts">
 import {onMount} from "svelte";
 let ready=$state(false);
 onMount(()=>{ready=true;});
	const slides = [
		{ title:'Find your focus.', tag:'01 / Practice', copy:'Start with one question. Find the topic that needs your attention and build from there.', link:'/practice', action:'Start practising', color:'#fbbf74' },
		{ title:'Make it click.', tag:'02 / Tutoring', copy:'Bring the question you’re stuck on. Work through it with a tutor at your pace.', link:'/book', action:'Find a tutor', color:'#fda4af' },
		{ title:'Pass it on.', tag:'03 / Studio', copy:'Turn what you understand into something useful for the next learner.', link:'/studio', action:'Explore Studio', color:'#86efac' }
	];
	let current = $state(0);
	function step(delta:number){current=(current+delta+slides.length)%slides.length;}
</script>
<section class="max-w-[1240px] mx-auto px-4 sm:px-6 mt-16" aria-label="SchoolXense promotional stories">
	{#key current}
		{@const slide=slides[current]}
		<article class="slide" style:--highlight={slide.color}>
			<img src={'/artwork/promo-'+(current+1)+'.webp'} alt="" width="1440" height="810" loading="lazy" decoding="async" />
			<div class="words">
				<p class="eyebrow">{slide.tag}</p>
				<h2>{slide.title}</h2>
				<p>{slide.copy}</p>
				<a class="ctl ctl-primary" href={slide.link}>{slide.action} →</a>
			</div>
		</article>
	{/key}
	<div class="flex flex-wrap items-center justify-between gap-3 mt-3" aria-label="Slide controls">
		<button disabled={!ready} type="button" class="ctl" onclick={()=>step(-1)} aria-label="Previous promotion">←</button>
		<div class="flex gap-2">{#each slides as slide,i}<button disabled={!ready} type="button" class="ctl ctl-sm" aria-label={'Show '+slide.tag} aria-pressed={current===i} onclick={()=>current=i}>{i+1}</button>{/each}</div>
		<button disabled={!ready} type="button" class="ctl" onclick={()=>step(1)} aria-label="Next promotion">→</button>
	</div>
	<p class="sr-only" aria-live="polite">{slides[current].tag}: {slides[current].title}</p>
</section>
<style>
	.slide{position:relative;isolation:isolate;overflow:hidden;border-radius:1.5rem;background:#101322;color:#fff;min-height:24rem;display:grid;align-items:end}
	img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:65% center;z-index:-2}
	.slide::before{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#090c18 3%,#090c18db 36%,#090c1820 90%)}
	.words{padding:clamp(1.25rem,5vw,4rem);max-width:34rem;display:grid;justify-items:start;gap:1rem}
	.eyebrow{color:var(--highlight)}
	h2{font-size:clamp(2.6rem,7vw,6rem);line-height:.95;font-weight:800;letter-spacing:-.05em}
	@media(max-width:640px){.slide{min-height:29rem}.slide::before{background:linear-gradient(0deg,#090c18 0%,#090c18eb 35%,transparent 76%)}img{object-position:65% top}}
	@media(prefers-reduced-motion:no-preference){.words{animation:arrive .38s ease-out both}@keyframes arrive{from{opacity:0;transform:translateY(.6rem)}to{opacity:1;transform:none}}}
</style>
