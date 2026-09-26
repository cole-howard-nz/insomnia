import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	// The dev server compiles routes on first hit and every account action is a real database write.
	timeout: 60_000,
	expect: { timeout: 10_000 },
	webServer: { command: 'npm run dev -- --port 4173', port: 4173, reuseExistingServer: true },
	use: { baseURL: 'http://localhost:4173', ...devices['Pixel 5'] }
});
