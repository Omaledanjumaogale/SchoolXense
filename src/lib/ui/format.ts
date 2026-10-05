export { naira } from '$engines/hiveShare';
export const pct = (n: number) => `${Math.round(n)}%`;
export const ago = (t: number) => {
	const s = Math.round((Date.now() - t) / 1000);
	if (s < 0) { const f = -s; if (f < 3600) return `in ${Math.round(f / 60)}m`; if (f < 86400) return `in ${Math.round(f / 3600)}h`; return `in ${Math.round(f / 86400)}d`; }
	if (s < 60) return 'just now';
	if (s < 3600) return `${Math.round(s / 60)}m ago`;
	if (s < 86400) return `${Math.round(s / 3600)}h ago`;
	return `${Math.round(s / 86400)}d ago`;
};
export const date = (t: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(t).toLocaleDateString('en-NG', opts);
export const datetime = (t: number) => new Date(t).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const initials = (name: string) => name.replace(/^(Dr|Mrs|Mr|Ms|Baba)\s+/, '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const firstName = (name: string) => name.replace(/^(Dr|Mrs|Mr|Ms|Baba)\.?\s+/, '').split(/\s+/)[0];
