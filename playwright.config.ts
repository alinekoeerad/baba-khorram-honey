import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright E2E configuration (Stabilization Phase)
 * - Multi-project: Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
 * - 180s webServer timeout
 * - reuseExistingServer outside CI
 * - Absolute globalSetup path resolving on Windows, macOS, Linux
 * - Supports system browser channels (e.g. msedge, chrome) when CDN is geo-blocked
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: path.resolve(__dirname, 'tests/e2e/global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.SITE_URL || 'http://localhost:3000',
    channel: process.env.PLAYWRIGHT_CHANNEL, // Allow fallback to local 'chrome' or 'msedge'
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari (iPhone 12)',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // At least 180 seconds per stabilization requirement
  },
});
