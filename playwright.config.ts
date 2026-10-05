import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
	testDir: 'tests/e2e',
	webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', url:'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 120_000 },
	timeout: 45_000,
	use: { baseURL: 'http://127.0.0.1:4173' },
	projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }, { name: 'pixel5', use: devices['Pixel 5'] }]
});
