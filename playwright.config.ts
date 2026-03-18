import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,     // run serially so login sessions don't race
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      // Forward the API base URL into the Next.js dev server process
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    },
  },
});
