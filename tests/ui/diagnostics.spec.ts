import { test, expect } from '../fixtures.js';

test('Chromium PDF export', async ({ workspace, page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'PDF export is a Chromium API');
  await workspace.open();
  const pdf = await page.pdf({
    path: testInfo.outputPath('workspace.pdf'),
    format: 'A4',
    printBackground: true,
  });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  await testInfo.attach('workspace-pdf', { body: pdf, contentType: 'application/pdf' });
});
