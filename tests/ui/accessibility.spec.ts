import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures.js';

test('WCAG 2.1 AA scan @a11y', async ({ workspace, page }, testInfo) => {
  await workspace.open();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await testInfo.attach('accessibility-results', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });
  expect(result.violations).toEqual([]);
});
test('ARIA snapshot checks semantic structure', async ({ workspace, page }) => {
  await workspace.open();
  await expect(page.getByRole('region', { name: 'Visual baseline' })).toMatchAriaSnapshot(`
    - region "Visual baseline":
      - heading "Quality gate" [level=2]
      - paragraph: UI + API + Accessibility
      - text: Ready to ship
  `);
});
test('AI accessibility snapshot and stable ref locators', async ({ workspace, page }) => {
  await workspace.open();
  const snapshot = await page.ariaSnapshot({ mode: 'ai' });
  expect(snapshot).toContain('Automation workspace');
  const ref = snapshot.match(/button "Open settings" \[ref=(e\d+)\]/)?.[1];
  expect(ref).toBeTruthy();
  await page.getByRef(ref!).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
