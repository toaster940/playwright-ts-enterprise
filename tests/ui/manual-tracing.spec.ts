import { test, expect } from '../fixtures.js';

// trace is worker-scoped: keep manual tracing in a separate file and disable
// the runner's automatic tracing here to avoid starting two trace sessions.
test.use({ trace: 'off' });
test('manual trace chunks for an isolated context', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ baseURL });
  try {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    await context.tracing.startChunk({ title: 'Guest journey' });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveTitle('Quality Lab');
    const path = testInfo.outputPath('guest-trace.zip');
    await context.tracing.stopChunk({ path });
    await context.tracing.stop();
    await testInfo.attach('guest-trace', { path, contentType: 'application/zip' });
  } finally {
    await context.close();
  }
});
