import { test, expect } from '@playwright/test';

test('service worker provides a safe offline page without caching account or API responses', async ({ page, context }) => {
	await page.goto('/faq');
	await page.evaluate(async () => { await navigator.serviceWorker.ready; });
	await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
	await page.goto('/login');
	await page.evaluate(async () => { await fetch('/api/auth/get-session'); });
	const cached = await page.evaluate(async () => {
		const keys = await caches.keys();
		return (await Promise.all(keys.map(async key => (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)))).flat();
	});
	expect(cached).toContain('/offline');
	expect(cached.some(path => path.startsWith('/api/') || path === '/login')).toBe(false);
	await context.setOffline(true);
	await page.goto('/faq');
	await expect(page.getByRole('heading', { name: 'You’re offline', exact: true })).toBeVisible();
	await context.setOffline(false);
	await page.goto('/faq');
	await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('You’re offline');
});

test('install control handles the browser install event and hides after installation', async ({ page }) => {
	await page.goto('/');
	await page.evaluate(async () => { await navigator.serviceWorker.ready; });
	await page.evaluate(() => {
		const event = new Event('beforeinstallprompt', { cancelable: true });
		Object.assign(event, { prompt: async () => { document.documentElement.dataset.installPromptCalled = 'true'; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
		window.dispatchEvent(event);
	});
	await page.getByRole('button', { name: 'Install app', exact: true }).click();
	await expect(page.locator('html')).toHaveAttribute('data-install-prompt-called', 'true');
	await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
	await expect(page.getByRole('button', { name: 'Install app', exact: true })).toHaveCount(0);
});
