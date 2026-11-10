import { expect, test } from '@playwright/test';
test('promotional chapters use distinct artwork with manual controls and reduced motion', async ({page}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	const slider = page.getByRole('region',{name:'SchoolXense promotional stories'});
	const next = slider.getByRole('button',{name:'Next promotion'});
	const sources = new Set<string>();
	for (const title of ['Find your focus.', 'Make it click.', 'Pass it on.']) {
		const heading=slider.getByRole('heading',{name:title});
		await expect(heading).toBeVisible();
		await expect(heading.locator('..')).toHaveCSS('animation-name','none');
		const img=slider.locator('img');
		await img.scrollIntoViewIfNeeded();
		await expect.poll(()=>img.evaluate(el=>el.naturalWidth)).toBeGreaterThan(100);
		sources.add((await img.getAttribute('src'))!);
		await next.click();
	}
	await expect(slider.getByRole('heading',{name:'Find your focus.'})).toBeVisible();
	for (const img of await page.locator('#learning-community img').all()) sources.add((await img.getAttribute('src'))!);
	expect(sources.size).toBe(6);
	await expect(page.getByRole('navigation',{name:'Related SchoolXense workspaces'}).getByRole('link',{name:'Tutoring'})).toHaveAttribute('href','/book');
});
