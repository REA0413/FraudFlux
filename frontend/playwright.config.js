import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Increased timeout slightly for network latency to Vercel/Render
  timeout: 30000,
  use: {
    // Set your live Vercel URL as the base URL
    baseURL: 'https://fraudflux.vercel.app',
    trace: 'on-first-retry',
    // Capture screenshot on test failure for easy debugging
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});