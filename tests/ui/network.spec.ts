import { test, expect } from '../fixtures.js';
import { readFile } from 'node:fs/promises';

test('fulfill an API route', async ({ workspace, page }) => {
  await page.route('**/api/catalog', (route) =>
    route.fulfill({ json: [{ id: 7, name: 'Mocked catalog' }] }),
  );
  await workspace.open();
  await page.getByRole('button', { name: 'Load catalog' }).click();
  await expect(page.locator('#catalog-result')).toHaveText('Mocked catalog');
});
test('fetch and modify a real response', async ({ workspace, page }) => {
  await page.route('**/api/catalog', async (route) => {
    const response = await route.fetch();
    const items = await response.json();
    await route.fulfill({ response, json: [...items, { id: 2, name: 'Injected item' }] });
  });
  await workspace.open();
  const responsePromise = page.waitForResponse('**/api/catalog');
  await page.getByRole('button', { name: 'Load catalog' }).click();
  expect((await responsePromise).status()).toBe(200);
  await expect(page.locator('#catalog-result')).toContainText('Injected item');
});
test('server error is presented accessibly', async ({ workspace, page }) => {
  await page.route('**/api/tasks', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({ status: 503, json: { error: 'Please retry later' } });
    else await route.continue();
  });
  await workspace.open();
  await workspace.titleInput.fill('Error example');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByRole('status')).toHaveText('Please retry later');
});
test('HAR replay from a checked-in fixture', async ({ workspace, page }) => {
  await page.routeFromHAR('tests/data/catalog.har', { url: '**/api/catalog', notFound: 'abort' });
  await workspace.open();
  await page.getByRole('button', { name: 'Load catalog' }).click();
  await expect(page.locator('#catalog-result')).toHaveText('HAR catalog');
});
test('record and replay HAR using the actual base URL', async ({ browser, baseURL }, testInfo) => {
  const har = testInfo.outputPath('recording.har');
  const recorder = await browser.newContext({
    baseURL,
    recordHar: { path: har, urlFilter: '**/api/catalog', mode: 'minimal' },
  });
  const recordedPage = await recorder.newPage();
  await recordedPage.goto('/');
  await recordedPage.getByRole('button', { name: 'Load catalog' }).click();
  await expect(recordedPage.locator('#catalog-result')).toHaveText('Playwright course');
  await recorder.close();
  expect((await readFile(har, 'utf8')).length).toBeGreaterThan(100);
  const replay = await browser.newContext({ baseURL });
  try {
    await replay.routeFromHAR(har, { url: '**/api/catalog', notFound: 'abort' });
    const replayPage = await replay.newPage();
    await replayPage.goto('/');
    await replayPage.getByRole('button', { name: 'Load catalog' }).click();
    await expect(replayPage.locator('#catalog-result')).toHaveText('Playwright course');
  } finally {
    await replay.close();
  }
});
test('WebSocket message routing', async ({ workspace, page }) => {
  await page.routeWebSocket('**/ws', (socket) =>
    socket.onMessage((message) => {
      if (message === 'ping') socket.send('pong from mock');
    }),
  );
  await workspace.open();
  await page.getByRole('button', { name: 'Connect socket' }).click();
  await expect(page.locator('#socket-result')).toHaveText('pong from mock');
});
test('offline and online context transitions', async ({ workspace, context, page }) => {
  await workspace.open();
  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  await context.setOffline(false);
  await expect(async () =>
    expect((await page.request.get('/api/health')).ok()).toBe(true),
  ).toPass();
});
