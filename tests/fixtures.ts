import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { TaskClient } from '../src/api/task-client.js';
import { WorkspacePage } from '../src/pages/workspace-page.js';
import { ComponentsPage } from '../src/pages/components-page.js';

type Fixtures = {
  namespace: string;
  api: TaskClient;
  workspace: WorkspacePage;
  components: ComponentsPage;
};
export const test = base.extend<Fixtures>({
  components: async ({ page }, use) => {
    await use(new ComponentsPage(page));
  },
  // Playwright requires a destructured first parameter for fixture discovery.
  // eslint-disable-next-line no-empty-pattern
  namespace: async ({}, use) => {
    await use(randomUUID());
  },
  extraHTTPHeaders: async ({ namespace }, use) => {
    await use({ 'x-test-namespace': namespace });
  },
  api: async ({ request }, use) => {
    await expect(
      await request.post('/api/login', {
        data: { email: 'qa@example.com', password: 'Playwright123!' },
      }),
    ).toBeOK();
    try {
      await use(new TaskClient(request));
    } finally {
      await request.delete('/api/namespace');
    }
  },
  workspace: async ({ page, namespace, api: _api }, use) => {
    await page.addInitScript((value) => localStorage.setItem('namespace', value), namespace);
    await use(new WorkspacePage(page));
    await page.request.delete('/api/namespace');
  },
});
export { expect };
