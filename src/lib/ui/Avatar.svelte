<script lang="ts">
	import { initials } from './format';
	let { name, hue = 30, size = 36, ring = false }: { name: string; hue?: number; size?: number; ring?: boolean } = $props();
</script>

<span
	class="inline-grid place-items-center rounded-full font-semibold text-white shrink-0 select-none"
	style="width:{size}px;height:{size}px;font-size:{size * 0.38}px;background:linear-gradient(160deg,hsl({hue} 70% 58%),hsl({(hue + 30) % 360} 65% 40%));box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -1px 0 rgba(0,0,0,.25),0 1px 3px rgba(0,0,0,.2){ring ? ',0 0 0 2px var(--surface-solid),0 0 0 4px var(--brand)' : ''}"
	title={name}>{initials(name)}</span
>
