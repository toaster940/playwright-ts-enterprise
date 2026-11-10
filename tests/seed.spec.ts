import { test, expect } from './fixtures.js';

test('seed for planner and generator', async ({ workspace, page }) => {
  await workspace.open();
  await expect(page.getByRole('heading', { name: 'Automation workspace' })).toBeVisible();
});
