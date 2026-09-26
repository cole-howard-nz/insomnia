import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	webServer: { command: 'npm run dev -- --port 4173', port: 4173, reuseExistingServer: true },
	use: { baseURL: 'http://localhost:4173', ...devices['Pixel 5'] }
});
