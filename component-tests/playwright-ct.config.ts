import { defineConfig, devices } from '@playwright/experimental-ct-react';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../artifacts/component-report' }]],
  use: { ctPort: 3100, trace: 'retain-on-failure' },
  projects: [{ name: 'component-chromium', use: { ...devices['Desktop Chrome'] } }],
});
