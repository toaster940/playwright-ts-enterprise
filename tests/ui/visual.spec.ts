import { test, expect } from '../fixtures.js';

test('visual comparison @visual', async ({ workspace, page, browserName }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'One canonical visual project; extend baselines for other engines',
  );
  expect(browserName).toBe('chromium');
  await workspace.open();
  await expect(page.locator('#visual-card')).toHaveScreenshot('quality-card.png', {
    animations: 'disabled',
  });
});
