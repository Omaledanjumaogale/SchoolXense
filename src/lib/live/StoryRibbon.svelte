<script lang="ts">
	import {page} from '$app/state';
	let {landing=false}:{landing?:boolean}=$props();
	const themes=[
		{title:'Choose your next chapter',color:'#fbbf78',base:'#21172d',links:[['Practice','/practice'],['Tutoring','/book'],['Studio','/studio']]},
		{title:'Make room for a breakthrough',color:'#a7f3d0',base:'#102f2d',links:[['Study plan','/plan'],['Practice','/practice'],['Find a tutor','/book']]},
		{title:'Let good work travel',color:'#fbcfe8',base:'#351b35',links:[['Studio','/studio'],['Teams','/teams'],['Tasks','/tasks']]},
		{title:'Give progress a place',color:'#bfdbfe',base:'#172943',links:[['Dashboard','/home'],['Wallet','/wallet'],['Settings','/settings']]}
	];
	const route=$derived(page.url.pathname.split('/')[1]??'');
	const group=$derived(landing?0:['home','practice','plan','book','sessions','review'].includes(route)?1:['studio','packs','teams','tasks','contracts'].includes(route)?2:3);
	const theme=$derived(themes[group]);
</script>
<nav class="ribbon" aria-label="Related SchoolXense workspaces" style:--ink={theme.color} style:--base={theme.base}>
	<svg viewBox="0 0 360 160" aria-hidden="true" class="ornament">
		{#if group===0}<path d="M20 135Q88 5 158 83T338 19M60 150Q140 42 210 113T352 55"/><path d="m275 68 18-44 18 44-18 16Z"/>
		{:else if group===1}<path d="M20 140Q100 135 143 75T322 22M47 152Q149 153 196 99T345 51"/><circle cx="250" cy="70" r="42"/>
		{:else if group===2}<path d="M52 137 166 32l103 103M166 32l157 27-54 76H52"/><circle cx="166" cy="32" r="13"/><circle cx="269" cy="135" r="10"/>
		{:else}<path d="M42 140h78V98h72V63h75V24h65M80 152l65-24 72-28 92-44"/><circle cx="309" cy="56" r="15"/>{/if}
	</svg>
	<div class="content"><p>{theme.title}</p><div class="flex flex-wrap gap-2">{#each theme.links as [label,href]}{#if page.url.pathname!==href}<a href={href}>{label} →</a>{/if}{/each}</div></div>
</nav>
<style>
	.ribbon{position:relative;isolation:isolate;overflow:hidden;padding:clamp(1rem,3vw,2rem);border-radius:1.3rem;background:var(--base);color:var(--ink);margin-block:1rem 1.5rem}
	.content{position:relative;display:grid;gap:.8rem}
	p{font-family:"Palatino Linotype",Georgia,serif;font-style:italic;font-size:clamp(1.7rem,4vw,3.3rem);line-height:1.1}
	a{display:inline-flex;align-items:center;min-height:44px;border:1px solid currentColor;border-radius:999px;padding:.45rem .9rem;background:var(--base);font-size:.875rem}
	a:hover,a:focus-visible{background:var(--ink);color:var(--base)}
	.ornament{position:absolute;z-index:-1;inset:auto 0 0 auto;width:min(58%,25rem);fill:none;stroke:currentColor;stroke-width:1.5;opacity:.42}
	@media(prefers-reduced-motion:no-preference){.ornament{transition:transform .35s ease}.ribbon:focus-within .ornament,.ribbon:hover .ornament{transform:translateX(-.65rem)}}
</style>
