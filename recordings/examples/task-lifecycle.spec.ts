import { test, expect } from '@playwright/test';

// A small codegen-style input for the executable import example.
// Normal recordings are written under ignored recordings/*.spec.ts.
test('recorded task lifecycle', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  await page.getByRole('textbox', { name: 'Task title' }).fill('Recorded release review');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Recorded release review' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Recorded release review' }).check();
  await expect(page.getByRole('status')).toHaveText('Task updated');
  await expect(page.getByRole('checkbox', { name: 'Recorded release review' })).toBeChecked();
});
