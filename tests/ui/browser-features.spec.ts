import { test, expect } from '../fixtures.js';

test('clock controls timers without waiting 30 seconds', async ({ workspace, page }) => {
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await workspace.open();
  await expect(page.getByLabel('Current date')).toHaveText('2026-01-01');
  await page.getByRole('button', { name: 'Start timer' }).click();
  await page.clock.fastForward(30_001);
  await expect(page.locator('#timer-result')).toHaveText('Timer complete');
});
test('file upload and downloaded content', async ({ workspace, page }) => {
  await workspace.open();
  await page.getByLabel('Upload text file').setInputFiles({
    name: 'sample.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Quality from a buffer'),
  });
  await expect(page.locator('#uploaded')).toHaveText('Quality from a buffer');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('tasks.csv');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toContain('title,completed');
});
test('native alert and confirmation dialogs', async ({ workspace, page }) => {
  await workspace.open();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Playwright dialog');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Show dialog' }).click();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Confirm action' }).click();
  await expect(page.getByRole('status')).toHaveText('Cancelled');
});
test('popup, frames and shadow DOM', async ({ workspace, page }) => {
  await workspace.open();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Open help' }).click();
  const popup = await popupPromise;
  await expect(popup.getByRole('heading', { name: 'Quality Lab help' })).toBeVisible();
  await popup.close();
  const frame = page.frameLocator('iframe[title="Help frame"]');
  await frame.getByRole('button', { name: 'Acknowledge help' }).click();
  await expect(frame.getByRole('button')).toHaveText('Help acknowledged');
  await expect(page.getByRole('button', { name: 'Shadow quality badge' })).toBeVisible();
  expect(await page.content({ includeShadow: true })).toContain('Shadow quality badge');
});
test('HTML drag and drop', async ({ workspace, page }) => {
  await workspace.open();
  await page.locator('#source').dragTo(page.getByRole('region', { name: 'Drop zone' }));
  await expect(page.getByRole('region', { name: 'Drop zone' })).toHaveText('Quality delivered');
});
test('geolocation permissions and emulation', async ({ workspace, context, page }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });
  await workspace.open();
  await page.getByRole('button', { name: 'Locate me' }).click();
  await expect(page.locator('#location-result')).toHaveText('12.9716,77.5946');
});
test('clipboard permissions on Chromium', async ({ workspace, context, page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permissions vary by browser');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await workspace.open();
  await page.getByRole('button', { name: 'Copy greeting' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Hello QA');
});
test('media preferences and responsive viewport', async ({ workspace, page }) => {
  await workspace.open();
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Automation workspace' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('browser APIs can be mocked before navigation', async ({ workspace, page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 16 });
  });
  await workspace.open();
  expect(await page.evaluate(() => navigator.hardwareConcurrency)).toBe(16);
});
test('multiple isolated user contexts', async ({ browser, baseURL, workspace }) => {
  await workspace.open();
  const guestContext = await browser.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  try {
    const guest = await guestContext.newPage();
    await guest.goto('/');
    await expect(guest.locator('#user')).toHaveText('Guest');
  } finally {
    await guestContext.close();
  }
});
