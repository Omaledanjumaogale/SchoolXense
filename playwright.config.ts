import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
	testDir: 'tests/e2e',
	webServer: { command: 'npm run preview -- --port 4173', port: 4173, reuseExistingServer: true, timeout: 120_000 },
	timeout: 45_000,
	use: { baseURL: 'http://localhost:4173' },
	projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }, { name: 'pixel5', use: devices['Pixel 5'] }]
});
