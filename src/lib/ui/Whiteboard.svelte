<script lang="ts">
	// Vector whiteboard. In production each room is a Durable Object running Yjs; strokes sync and snapshot to R2.
	import Icon from './Icon.svelte';
	let canvas = $state<HTMLCanvasElement>();
	let color = $state('#f59e0b');
	let width = $state(3);
	let strokes = $state<{ c: string; w: number; pts: [number, number][] }[]>([]);
	let drawing: { c: string; w: number; pts: [number, number][] } | null = null;
	function redraw() {
		const ctx = canvas?.getContext('2d');
		if (!ctx || !canvas) return;
		const dpr = devicePixelRatio || 1;
		const r = canvas.getBoundingClientRect();
		if (canvas.width !== r.width * dpr) { canvas.width = r.width * dpr; canvas.height = r.height * dpr; }
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, r.width, r.height);
		ctx.lineCap = 'round'; ctx.lineJoin = 'round';
		for (const s of [...strokes, ...(drawing ? [drawing] : [])]) {
			ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.beginPath();
			s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * r.width, y * r.height) : ctx.moveTo(x * r.width, y * r.height)));
			ctx.stroke();
		}
	}
	$effect(() => { strokes; redraw(); });
	const pt = (e: PointerEvent): [number, number] => { const r = canvas!.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
	function down(e: PointerEvent) { (e.target as Element).setPointerCapture(e.pointerId); drawing = { c: color, w: width, pts: [pt(e)] }; }
	function move(e: PointerEvent) { if (!drawing) return; drawing.pts.push(pt(e)); redraw(); }
	function up() { if (drawing) strokes = [...strokes, drawing]; drawing = null; }
</script>

<svelte:window onresize={redraw} />
<div class="flex flex-col gap-2 h-full">
	<div class="flex items-center gap-1.5 flex-wrap">
		{#each ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#e2e8f0', '#0f172a'] as c}<button class="w-7 h-7 rounded-full transition-transform hover:-translate-y-px" style="background:{c};box-shadow:0 0 0 2px var(--surface-solid),0 0 0 {color === c ? 4 : 3}px {color === c ? 'var(--brand)' : 'var(--line)'}" onclick={() => (color = c)} aria-label="Colour {c}"></button>{/each}
		<span class="w-px h-6 mx-1" style="background:var(--line)"></span>
		{#each [2, 4, 8] as w}<button class="ctl ctl-sm chip" data-active={width === w} onclick={() => (width = w)} aria-label="Stroke width {w}"><span class="rounded-full" style="width:{w + 2}px;height:{w + 2}px;background:currentColor"></span></button>{/each}
		<button class="ctl ctl-sm ml-auto" onclick={() => (strokes = strokes.slice(0, -1))} disabled={!strokes.length}><Icon name="arrow-left" size={14} />Undo</button>
		<button class="ctl ctl-sm" onclick={() => (strokes = [])}><Icon name="trash" size={14} />Clear</button>
	</div>
	<canvas bind:this={canvas} class="w-full flex-1 min-h-64 rounded-xl touch-none panel-sunk cursor-crosshair" style="background-image:radial-gradient(var(--line) 1px,transparent 1px);background-size:18px 18px" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} aria-label="Shared whiteboard"></canvas>
</div>
