import { When, Then } from '@cucumber/cucumber';
import type { Page } from '@playwright/test';
import type { QAWorld } from '../support/world.js';

async function replay(this: QAWorld, name: string, index: number) {
  if (!/^[a-z][a-z0-9-]{0,59}$/.test(name)) throw new Error('Invalid recording name');
  const { actions } = (await import(`../recordings/${name}.js`)) as {
    actions: ((page: Page) => Promise<void>)[];
  };
  const action = actions[index - 1];
  if (!action) throw new Error(`Recording ${name} has no action ${index}`);
  await action(await this.ui());
}
When('I replay recording {string} action {int}', replay);
Then('I verify recording {string} action {int}', replay);
