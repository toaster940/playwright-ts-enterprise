import { test, expect } from '../fixtures.js';

test.describe('shared-resource coordination', () => {
  test.describe.configure({ lock: 'quality-lab-example' });
  test(
    'test locks and annotations',
    { annotation: { type: 'release', description: 'Playwright 1.64 test locks' } },
    async ({ workspace, page }) => {
      await workspace.open();
      await expect(page).toHaveTitle('Quality Lab');
    },
  );
});

test('WebMCP page-defined tool discovery and invocation', async ({
  playwright,
  browserName,
  baseURL,
}) => {
  test.skip(browserName !== 'chromium', 'WebMCP is an experimental Chromium browser API');
  const browser = await playwright.chromium.launch({ args: ['--enable-features=WebMCP'] });
  try {
    const page = await browser.newPage();
    await page.goto(baseURL!);
    await expect
      .poll(async () => (await page.webmcp.tools()).map((tool) => tool.name))
      .toContain('quality_sum');
    const result = await page.webmcp.callTool('quality_sum', { a: 2, b: 40 });
    expect(result.content).toContainEqual({ type: 'text', text: '42' });
  } finally {
    await browser.close();
  }
});

test('virtual passkeys, signature counters and storage state', async ({
  context,
  page,
  baseURL,
}) => {
  await context.credentials.install();
  const credential = await context.credentials.create('localhost', { signCount: 7 });
  await page.goto('http://localhost:' + new URL(baseURL!).port);
  const id = await page.evaluate(async () => {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([1, 2, 3, 4]),
        rpId: 'localhost',
        userVerification: 'preferred',
      },
    });
    return result?.id;
  });
  expect(id).toBe(credential.id);
  expect((await context.credentials.get({ id: credential.id }))[0]?.signCount).toBe(8);
  const state = await context.storageState({ credentials: true });
  expect(JSON.stringify(state)).toContain(credential.id);
  await context.credentials.delete(credential.id);
  expect(await context.credentials.get()).toEqual([]);
});
