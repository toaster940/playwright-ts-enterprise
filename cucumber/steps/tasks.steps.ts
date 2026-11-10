import { Given, When, Then, type DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { QAWorld } from '../support/world.js';

Given('I open the task workspace', async function (this: QAWorld) {
  await this.ui();
  await this.workspace!.open();
});
When('I add task {string} in the UI', async function (this: QAWorld, title: string) {
  await this.workspace!.addTask(title);
});
When('I complete task {string} in the UI', async function (this: QAWorld, title: string) {
  await this.page!.getByRole('checkbox', { name: title, exact: true }).check();
  await expect(this.page!.getByRole('status')).toHaveText('Task updated');
});
When('I delete task {string} in the UI', async function (this: QAWorld, title: string) {
  await this.page!.getByRole('button', { name: `Delete ${title}`, exact: true }).click();
});
When('I reload the workspace', async function (this: QAWorld) {
  await this.page!.reload();
});
Then('task {string} is visible in the UI', async function (this: QAWorld, title: string) {
  await expect(this.workspace!.tasks.getByText(title, { exact: true })).toBeVisible();
});
Then('task {string} is completed in the UI', async function (this: QAWorld, title: string) {
  await expect(this.page!.getByRole('checkbox', { name: title, exact: true })).toBeChecked();
});
Then('the UI task list is empty', async function (this: QAWorld) {
  await expect(this.workspace!.tasks.getByRole('listitem')).toHaveCount(0);
});
Given('these tasks exist through the API:', async function (this: QAWorld, table: DataTable) {
  for (const { title } of table.hashes()) this.tasks.push(await this.api.create(title!));
});
When('I create task {string} through the API', async function (this: QAWorld, title: string) {
  this.task = await this.api.create(title);
});
When('I complete that task through the API', async function (this: QAWorld) {
  this.task = await this.api.complete(this.task!.id);
});
When('I delete that task through the API', async function (this: QAWorld) {
  await this.api.delete(this.task!.id);
});
Then('the API contains {int} tasks', async function (this: QAWorld, count: number) {
  expect(await this.api.list()).toHaveLength(count);
});
Then('task {string} is completed through the API', async function (this: QAWorld, title: string) {
  await expect
    .poll(async () => (await this.api.list()).find((task) => task.title === title)?.completed)
    .toBe(true);
});
When('I send this task payload:', async function (this: QAWorld, payload: string) {
  this.response = await this.request.post('/api/tasks', { data: JSON.parse(payload) });
});
When(
  'I create a task with an invalid title {string}',
  async function (this: QAWorld, title: string) {
    this.response = await this.request.post('/api/tasks', { data: { title } });
  },
);
When('I create a task with a {int} character title', async function (this: QAWorld, count: number) {
  this.response = await this.request.post('/api/tasks', { data: { title: 'x'.repeat(count) } });
});
When('I update a missing task', async function (this: QAWorld) {
  this.response = await this.request.patch('/api/tasks/missing', { data: { completed: true } });
});
