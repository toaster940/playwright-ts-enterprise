import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { codegenPlan } from '../../src/codegen/plan.js';
import { recordingActions, renderRecording } from '../../src/codegen/import-recording.js';
import { projectRoot } from '../../src/tools/registry.js';

test('codegen plan preserves paths with spaces, device and explicit authentication', () => {
  const plan = codegenPlan({
    root: resolve('project with spaces'),
    baseURL: 'http://127.0.0.1:4173',
    name: 'task-flow',
    device: 'Pixel 7',
  });
  assert.ok(plan.args.includes(plan.output));
  assert.ok(plan.args.includes(plan.state));
  assert.ok(plan.args.includes('Pixel 7'));
  assert.ok(
    !codegenPlan({
      root: projectRoot,
      baseURL: 'http://127.0.0.1:4173',
      name: 'guest',
      guest: true,
    }).args.includes('--load-storage'),
  );
  assert.throws(() =>
    codegenPlan({ root: projectRoot, baseURL: 'http://127.0.0.1:4173', name: '../escape' }),
  );
});
test('recording ingestion preserves actions/assertions and adapts base URL', async () => {
  const input = await readFile(
    resolve(projectRoot, 'recordings/examples/task-lifecycle.spec.ts'),
    'utf8',
  );
  const actions = recordingActions(input, 'http://127.0.0.1:4173');
  assert.equal(actions.length, 7);
  assert.equal(actions.filter((action) => action.assertion).length, 3);
  assert.match(actions[0]!.code, /page.goto\(["']\/["']\)/);
  const rendered = renderRecording('imported-proof', actions);
  assert.match(rendered.feature, /Given I am signed in via the API/);
  assert.match(rendered.feature, /Then I verify recording "imported-proof" action 7/);
  assert.match(rendered.steps, /toBeChecked/);
});
test('ingestion rejects missing assertions and unsupported control flow', () => {
  const wrap = (body: string) =>
    `import { test, expect } from '@playwright/test'; test('x', async ({page}) => { ${body} });`;
  assert.throws(
    () => recordingActions(wrap("await page.goto('/');"), 'http://127.0.0.1:4173'),
    /assertion/,
  );
  assert.throws(
    () =>
      recordingActions(
        wrap('const popup = await page.waitForEvent("popup");'),
        'http://127.0.0.1:4173',
      ),
    /sequential/,
  );
  assert.throws(
    () => recordingActions(wrap('await page.evaluate(() => 42);'), 'http://127.0.0.1:4173'),
    /Unsupported/,
  );
  assert.throws(
    () =>
      recordingActions(
        wrap('await page.goto("https://example.com"); await expect(page).toHaveTitle("x");'),
        'http://127.0.0.1:4173',
      ),
    /outside BASE_URL/,
  );
});
