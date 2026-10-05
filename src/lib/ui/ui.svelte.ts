import { browser } from '$app/environment';
import { hive } from '$hive/store.svelte';
import { DEMO_MODE } from '$lib/config';

type Toast = { id: number; title: string; body?: string; tone: 'good' | 'warn' | 'bad' | 'info' };

class UI {
	mounted = $state(false);
	theme = $state<'light' | 'dark'>('light');
	saver = $state(false);
	paletteOpen = $state(false);
	navOpen = $state(false);
	online = $state(true);
	toasts = $state<Toast[]>([]);
	private n = 0;

	init() {
		if (!browser) return;
		this.theme = (document.documentElement.dataset.theme as 'light' | 'dark') ?? 'light';
		this.saver = document.documentElement.dataset.saver === 'true';
		this.online = navigator.onLine;
		addEventListener('online', () => (this.online = true));
		addEventListener('offline', () => (this.online = false));
		this.mounted = true;
	}
	/** Session user — null until mounted, so SSR and hydration agree. */
	get me() { return DEMO_MODE && this.mounted ? hive.me : null; }
	setTheme(t: 'light' | 'dark') {
		this.theme = t;
		document.documentElement.dataset.theme = t;
		try { localStorage.setItem('hive.theme', t); } catch {}
	}
	toggleTheme() { this.setTheme(this.theme === 'dark' ? 'light' : 'dark'); }
	toggleSaver() {
		this.saver = !this.saver;
		document.documentElement.dataset.saver = String(this.saver);
		try { localStorage.setItem('hive.saver', String(this.saver)); } catch {}
	}
	toast(title: string, tone: Toast['tone'] = 'info', body?: string) {
		const id = ++this.n;
		this.toasts.push({ id, title, body, tone });
		setTimeout(() => this.dismiss(id), tone === 'bad' ? 7000 : 4200);
	}
	dismiss(id: number) { this.toasts = this.toasts.filter((t) => t.id !== id); }
	/** Run a store mutation and surface HiveError messages as toasts. */
	run<T>(fn: () => T, success?: string): T | undefined {
		try {
			const r = fn();
			if (success) this.toast(success, 'good');
			return r;
		} catch (e) {
			this.toast((e as Error).message, 'bad');
			return undefined;
		}
	}
}

export const ui = new UI();
