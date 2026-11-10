import { expect, type Page } from '@playwright/test';

// Imported from a reviewed codegen recording. Original assertions are preserved.
export const actions: ((page: Page) => Promise<void>)[] = [
  async (page) => {
    await page.goto('/');
  },
  async (page) => {
    await page.getByRole('textbox', { name: 'Task title' }).fill('Recorded release review');
  },
  async (page) => {
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
  },
  async (page) => {
    await expect(page.getByRole('checkbox', { name: 'Recorded release review' })).toBeVisible();
  },
  async (page) => {
    await page.getByRole('checkbox', { name: 'Recorded release review' }).check();
  },
  async (page) => {
    await expect(page.getByRole('status')).toHaveText('Task updated');
  },
  async (page) => {
    await expect(page.getByRole('checkbox', { name: 'Recorded release review' })).toBeChecked();
  },
];
