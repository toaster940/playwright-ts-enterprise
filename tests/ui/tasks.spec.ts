import { test, expect } from '../fixtures.js';

test('create, complete, delete through UI @smoke', { tag: '@ui' }, async ({ workspace, page }) => {
  await workspace.open();
  await test.step('Create task', () => workspace.addTask('Review release'));
  await page.getByRole('checkbox', { name: 'Review release' }).check();
  await expect(page.getByRole('status')).toHaveText('Task updated');
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Review release' })).toBeChecked();
  await page.getByRole('button', { name: 'Delete Review release' }).click();
  await expect(workspace.tasks.getByRole('listitem')).toHaveCount(0);
});
test('API seed → UI verification → API assertion', async ({ workspace, api, page }) => {
  const task = await api.create('Seeded by API');
  await workspace.open();
  await page.getByRole('checkbox', { name: task.title }).check();
  await expect.poll(async () => (await api.list())[0]?.completed).toBe(true);
});
test('keyboard input and resilient semantic locators', async ({ workspace, page }) => {
  await workspace.open();
  await workspace.titleInput.fill('Keyboard task');
  await workspace.titleInput.press('Enter');
  const row = workspace.tasks.getByRole('listitem').filter({ hasText: 'Keyboard task' });
  await expect(row.getByRole('checkbox')).not.toBeChecked();
  await expect(row.getByRole('button')).toHaveAccessibleName('Delete Keyboard task');
  await expect(workspace.titleInput).toHaveValue('');
  await test.info().attach('task-contract', {
    body: JSON.stringify({ title: 'Keyboard task' }),
    contentType: 'application/json',
  });
  expect((await page.request.get('/api/me')).ok()).toBe(true);
});
test('new locator.within and modal dialog', async ({ workspace, page }) => {
  await workspace.open();
  await page.getByRole('button', { name: 'Open settings' }).click();
  const dialog = page.getByRole('dialog');
  await page.getByRole('textbox', { name: 'Display name' }).within(dialog).fill('Release Engineer');
  await page.getByRole('button', { name: 'Save', exact: true }).within(dialog).click();
  await expect(page.locator('#user')).toHaveText('Release Engineer');
});
test('locator handlers dismiss unpredictable overlays', async ({ workspace, page }) => {
  await workspace.open();
  await page.addLocatorHandler(page.getByText('Newsletter', { exact: true }), async () => {
    await page.getByRole('button', { name: 'Dismiss' }).click();
  });
  await page.getByRole('button', { name: 'Show overlay' }).click();
  await workspace.addTask('Overlay handled');
});
