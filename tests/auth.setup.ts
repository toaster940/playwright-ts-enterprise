import { test as setup, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

setup('authenticate with API and persist browser state', async ({ request }) => {
  await expect(
    await request.post('/api/login', {
      data: { email: 'qa@example.com', password: 'Playwright123!' },
    }),
  ).toBeOK();
  await mkdir('playwright/.auth', { recursive: true });
  await request.storageState({ path: 'playwright/.auth/user.json' });
});
