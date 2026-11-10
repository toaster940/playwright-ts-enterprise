import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { QAWorld } from '../support/world.js';

Given('the catalog responds with {string}', async function (this: QAWorld, name: string) {
  const page = await this.ui();
  await page.route('**/api/catalog', (route) => route.fulfill({ json: [{ id: 7, name }] }));
});
When('I load the catalog', async function (this: QAWorld) {
  await this.page!.getByRole('button', { name: 'Load catalog' }).click();
});
Then('the catalog displays {string}', async function (this: QAWorld, name: string) {
  await expect(this.page!.locator('#catalog-result')).toHaveText(name);
});
Given('task creation is temporarily unavailable', async function (this: QAWorld) {
  const page = await this.ui();
  await page.route('**/api/tasks', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 503, json: { error: 'Please retry later' } })
      : route.continue(),
  );
});
When('I submit task {string}', async function (this: QAWorld, title: string) {
  await this.workspace!.titleInput.fill(title);
  await this.page!.getByRole('button', { name: 'Add task', exact: true }).click();
});
Then('the status message is {string}', async function (this: QAWorld, message: string) {
  await expect(this.page!.getByRole('status')).toHaveText(message);
});
Given('the browser clock is fixed', async function (this: QAWorld) {
  const page = await this.ui();
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
});
When('I fast-forward the timer', async function (this: QAWorld) {
  await this.page!.getByRole('button', { name: 'Start timer' }).click();
  await this.page!.clock.fastForward(30_001);
});
Then('the timer is complete', async function (this: QAWorld) {
  await expect(this.page!.locator('#timer-result')).toHaveText('Timer complete');
});
When('I set my display name to {string}', async function (this: QAWorld, name: string) {
  const page = this.page!;
  await page.getByRole('button', { name: 'Open settings' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Display name' }).fill(name);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
});
Then('my displayed name is {string}', async function (this: QAWorld, name: string) {
  await expect(this.page!.locator('#user')).toHaveText(name);
});
Then(
  'the quality gate has this accessible structure:',
  async function (this: QAWorld, snapshot: string) {
    const region = this.page!.getByRole('region', { name: 'Visual baseline' });
    // File-backed snapshot matchers require Playwright Test's runner. Cucumber
    // compares the same accessibility tree directly against its feature doc string.
    await expect.poll(() => region.ariaSnapshot()).toBe(snapshot.trim());
  },
);
