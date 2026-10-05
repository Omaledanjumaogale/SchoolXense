<script lang="ts">
	import Icon from './Icon.svelte';
	let { size = 36, glyph, color = 'var(--brand)', label = 'SchoolXense' }: { size?: number; glyph?: string; color?: string; label?: string } = $props();
</script>

<span class="relative inline-grid place-items-center shrink-0" style="width:{size}px;height:{size}px" aria-label={label} role="img">
	<svg viewBox="0 0 40 40" width={size} height={size} class="absolute inset-0">
		<defs>
			<linearGradient id="hx-{size}-{glyph ?? 'b'}" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color={color} stop-opacity="1" />
				<stop offset="1" stop-color={color} stop-opacity="0.78" />
			</linearGradient>
		</defs>
		<path d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5z" fill="url(#hx-{size}-{glyph ?? 'b'})" stroke="rgba(0,0,0,.18)" stroke-width="1" />
		<path d="M20 3.6 34.2 11.8" stroke="rgba(255,255,255,.55)" stroke-width="1.2" fill="none" />
		{#if !glyph}
			<path d="M11 15.5c3-1.2 6-1.2 9 .8 3-2 6-2 9-.8v11c-3-1.2-6-1.2-9 .8-3-2-6-2-9-.8z" fill="#fff" fill-opacity=".95" />
			<path d="M20 16.3v11" stroke={color} stroke-width="1.4" />
		{/if}
	</svg>
	{#if glyph}<span class="relative text-white"><Icon name={glyph} size={size * 0.46} stroke={2} /></span>{/if}
</span>
