import { expect, type Page } from '@playwright/test';

export class WorkspacePage {
  constructor(readonly page: Page) {}
  get titleInput() {
    return this.page.getByRole('textbox', { name: 'Task title' });
  }
  get tasks() {
    return this.page.getByRole('list', { name: 'Task list' });
  }
  async open() {
    await this.page.goto('/');
    await expect(this.page.locator('#user')).toHaveText('QA Engineer');
  }
  async addTask(title: string) {
    await this.titleInput.fill(title);
    await this.page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(this.tasks.getByText(title, { exact: true })).toBeVisible();
  }
}
