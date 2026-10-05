<script lang="ts">
	import Icon from './Icon.svelte';
	import HexMark from './HexMark.svelte';
	let rx = $state(8), ry = $state(-14);
	let reduce = $state(false);
	$effect(() => { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; });
	function move(e: PointerEvent) {
		if (reduce) return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
		ry = -14 + px * 10; rx = 8 - py * 8;
	}
	function leave() { rx = 8; ry = -14; }
</script>

<div class="stage-3d relative w-full aspect-[5/4] max-w-[560px] mx-auto select-none" onpointermove={move} onpointerleave={leave} role="presentation" aria-hidden="true">
	<div class="tilt absolute inset-0" style="transform:rotateX({rx}deg) rotateY({ry}deg)">
		<!-- hive floor -->
		<div class="absolute inset-[6%] decor" style="transform:translateZ(-60px)">
			<svg viewBox="0 0 400 320" class="w-full h-full opacity-60">
				<defs><pattern id="hexgrid" width="34" height="58.9" patternUnits="userSpaceOnUse" patternTransform="scale(1)"><path d="M17 0 34 9.8v19.6L17 39.3 0 29.4V9.8zM17 39.3v19.6" fill="none" stroke="var(--line-strong)" stroke-width="1" /></pattern>
				<radialGradient id="fade"><stop offset="0.3" stop-color="#fff" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient><mask id="m"><rect width="400" height="320" fill="url(#fade)" /></mask></defs>
				<rect width="400" height="320" fill="url(#hexgrid)" mask="url(#m)" />
			</svg>
		</div>
		<!-- question card -->
		<div class="panel absolute left-[4%] top-[10%] w-[62%] p-4" style="transform:translateZ(30px);background:var(--surface-solid)">
			<div class="flex items-center justify-between text-xs"><span class="font-semibold" style="color:var(--color-navy-600)">JAMB Physics</span><span class="num muted flex items-center gap-1"><Icon name="clock" size={12} />00:42 · 7/20</span></div>
			<div class="meter mt-2"><span style="width:35%"></span></div>
			<p class="mt-3 text-[13px] font-medium leading-snug">A wave of frequency 50 Hz travels at 340 m/s. Its wavelength is</p>
			<div class="mt-2.5 grid gap-1.5 text-[12px]">
				{#each [['A', '0.15 m', false], ['B', '6.8 m', true], ['C', '17,000 m', false], ['D', '0.68 m', false]] as [k, v, on]}
					<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-md" style="border:1px solid {on ? 'var(--good)' : 'var(--line)'};background:{on ? 'var(--good-soft)' : 'var(--surface-sunk)'}"><span class="num font-semibold w-4">{k}</span>{v}{#if on}<Icon name="check" size={13} class="ml-auto" />{/if}</div>
				{/each}
			</div>
			<p class="mt-2 text-[11px] font-medium" style="color:var(--good)">✓ v = fλ → λ = v/f</p>
		</div>
		<!-- readiness -->
		<div class="panel absolute right-[2%] top-[4%] w-[40%] p-3.5" style="transform:translateZ(70px);background:var(--surface-solid)">
			<p class="eyebrow !text-[9px]">JAMB readiness</p>
			<p class="num text-xl font-semibold mt-1">241–262 <span class="text-xs font-semibold" style="color:var(--good)">▲9</span></p>
			<div class="relative h-2 mt-2 rounded-full panel-sunk"><div class="absolute h-full rounded-full" style="left:52%;width:14%;background:linear-gradient(90deg,var(--accent),var(--brand))"></div></div>
			<p class="text-[10px] muted mt-1.5">Range · 82% confidence</p>
		</div>
		<!-- wallet -->
		<div class="panel absolute right-[4%] top-[42%] w-[42%] p-3.5" style="transform:translateZ(95px);background:var(--surface-solid)">
			<div class="flex items-center justify-between"><p class="eyebrow !text-[9px]">Tutor wallet</p><HexMark size={20} /></div>
			<p class="num text-xl font-semibold mt-1">₦18,400</p>
			<div class="mt-2 grid gap-1 text-[10px]">
				<div class="flex items-center gap-2"><span class="w-12 muted">Sessions</span><span class="flex-1 h-1.5 rounded-full" style="background:var(--brand)"></span></div>
				<div class="flex items-center gap-2"><span class="w-12 muted">Studio</span><span class="h-1.5 rounded-full w-[35%]" style="background:#7c3aed"></span></div>
				<div class="flex items-center gap-2"><span class="w-12 muted">Referral</span><span class="h-1.5 rounded-full w-[18%]" style="background:#0891b2"></span></div>
			</div>
		</div>
		<!-- escrow chip -->
		<div class="panel absolute left-[10%] bottom-[8%] px-3.5 py-2.5 flex items-center gap-2.5" style="transform:translateZ(110px);background:var(--surface-solid);box-shadow:inset 0 1px 0 var(--edge-top),var(--shadow-lift),var(--brand-glow)">
			<span class="grid place-items-center w-8 h-8 rounded-lg" style="background:var(--brand-soft);color:var(--brand)"><Icon name="lock" size={16} /></span>
			<div class="text-[11px] leading-tight"><p class="font-semibold">₦1,875 held in escrow</p><p class="muted">Releases 48h after the session</p></div>
		</div>
		<!-- team chip -->
		<div class="panel absolute right-[10%] bottom-[2%] px-3 py-2 flex items-center gap-2" style="transform:translateZ(55px);background:var(--surface-solid)">
			<div class="flex -space-x-1.5">{#each [28, 160, 250, 95] as h}<span class="w-6 h-6 rounded-full" style="background:hsl({h} 65% 52%);box-shadow:0 0 0 2px var(--surface-solid)"></span>{/each}</div>
			<span class="text-[11px] font-semibold">Team split 30/25/25/20</span>
		</div>
	</div>
</div>
