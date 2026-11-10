import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures.js';

test.describe('Modern UI components', { tag: '@components' }, () => {
  test.beforeEach(async ({ components }) => {
    await components.open();
  });

  test('native dropdown selection by value, label and index', async ({ components, page }) => {
    await components.environment.selectOption('staging');
    await expect(page.getByTestId('environment-result')).toHaveText('Environment: Staging');
    await components.environment.selectOption({ label: 'Production' });
    await expect(components.environment).toHaveValue('production');
    await components.environment.selectOption({ index: 1 });
    await expect(page.getByTestId('environment-result')).toHaveText('Environment: Development');
    await expect(
      components.environment.getByRole('option', { name: 'Retired (unavailable)' }),
    ).toBeDisabled();
  });

  test('multi-select chooses and clears several options', async ({ page }) => {
    const select = page.getByRole('listbox', { name: 'Supported browsers' });
    await select.selectOption(['chromium', 'webkit']);
    await expect(select).toHaveValues(['chromium', 'webkit']);
    await expect(page.getByTestId('browser-result')).toHaveText('Chromium, WebKit');
    await select.selectOption([]);
    await expect(page.getByTestId('browser-result')).toHaveText('No browsers selected');
  });

  test('dependent dropdown resets stale selections', async ({ page }) => {
    const country = page.getByRole('combobox', { name: 'Country', exact: true });
    const region = page.getByRole('combobox', { name: 'State or region' });
    await expect(region).toBeDisabled();
    await country.selectOption('IN');
    await region.selectOption('KA');
    await expect(page.getByTestId('region-result')).toHaveText('Region: Karnataka');
    await country.selectOption('US');
    await expect(region).toHaveValue('');
    await expect(region.getByRole('option', { name: 'Karnataka' })).toHaveCount(0);
    await region.selectOption({ label: 'Texas' });
    await expect(page.getByTestId('region-result')).toHaveText('Region: Texas');
  });

  test('searchable custom dropdown selects by visible option', async ({ components, page }) => {
    await components.chooseReviewer('gra', 'Grace Hopper');
    await expect(components.reviewer).toHaveValue('Grace Hopper');
    await expect(components.reviewer).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('reviewer-result')).toHaveText('Reviewer: Grace Hopper');
  });

  test('combobox supports keyboard selection, Escape and empty results', async ({
    components,
    page,
  }) => {
    await components.reviewer.fill('Ada');
    await components.reviewer.press('ArrowDown');
    await expect(components.reviewer).toHaveAttribute('aria-activedescendant', 'reviewer-option-0');
    await components.reviewer.press('Enter');
    await expect(page.getByTestId('reviewer-result')).toHaveText('Reviewer: Ada Lovelace');
    await components.reviewer.fill('Grace');
    await components.reviewer.press('Escape');
    await expect(page.getByRole('listbox', { name: 'Reviewer suggestions' })).toBeHidden();
    await components.reviewer.fill('no-such-person');
    await expect(page.getByTestId('reviewer-result')).toHaveText('No reviewers found');
    await components.reviewer.fill('');
    await components.reviewer.press('ArrowUp');
    await components.reviewer.press('Enter');
    await expect(page.getByTestId('reviewer-result')).toHaveText('Reviewer: Margaret Hamilton');
  });

  test('native date field accepts an ISO date and saves it', async ({ page }) => {
    await page.getByLabel('Reminder date', { exact: true }).fill('2026-11-18');
    await page.getByRole('button', { name: 'Save reminder' }).click();
    await expect(page.getByTestId('reminder-result')).toHaveText('Reminder: 2026-11-18');
  });

  test('native date constraints block invalid submission and recover', async ({ page }) => {
    const field = page.getByLabel('Reminder date', { exact: true });
    await page.getByRole('button', { name: 'Save reminder' }).click();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await field.fill('2025-12-31');
    await page.getByRole('button', { name: 'Save reminder' }).click();
    await expect(page.getByTestId('reminder-result')).toHaveText('No reminder saved');
    await expect(page.locator('#reminder-error')).toBeVisible();
    await field.fill('2027-01-04');
    await page.getByRole('button', { name: 'Save reminder' }).click();
    await expect(page.getByTestId('reminder-result')).toHaveText('Reminder: 2027-01-04');
    await expect(page.locator('#reminder-error')).toBeHidden();
  });

  test('custom calendar selects a weekday and rejects weekend dates', async ({
    components,
    page,
  }) => {
    await components.openCalendar();
    await components.calendar.getByLabel('Calendar month').selectOption('10');
    await expect(
      components.calendar.getByRole('button', { name: 'November 21, 2026', exact: true }),
    ).toBeDisabled();
    await components.calendar
      .getByRole('button', { name: 'November 18, 2026', exact: true })
      .click();
    await expect(page.getByLabel('Meeting date', { exact: true })).toHaveValue('2026-11-18');
    await expect(components.calendar).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Choose meeting date', exact: true }),
    ).toBeFocused();
    await components.openCalendar();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Meeting date', { exact: true })).toHaveValue('2026-11-18');
  });

  test('calendar keyboard navigation skips weekends', async ({ components, page }) => {
    await components.openCalendar();
    await expect(
      components.calendar.getByRole('button', { name: 'October 1, 2026', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(
      components.calendar.getByRole('button', { name: 'October 5, 2026', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Meeting date', { exact: true })).toHaveValue('2026-10-05');
  });

  test('calendar month navigation crosses a year boundary', async ({ components, page }) => {
    await components.openCalendar();
    await components.calendar.getByLabel('Calendar month').selectOption('11');
    await components.calendar.getByRole('button', { name: 'Next month', exact: true }).click();
    await expect(components.calendar.getByRole('grid', { name: 'January 2027' })).toBeVisible();
    await components.calendar.getByRole('button', { name: 'January 4, 2027', exact: true }).click();
    await expect(page.getByLabel('Meeting date', { exact: true })).toHaveValue('2027-01-04');
  });

  test('calendar supports leap-day selection through month/year controls', async ({
    components,
  }) => {
    await components.chooseMeetingDate('2028-02-29');
  });

  test('date range validation rejects reversed dates and recovers', async ({
    components,
    page,
  }) => {
    await components.applyDateRange('2026-11-20', '2026-11-18');
    await expect(page.locator('#range-error')).toHaveText(
      'Choose both dates; the end date must be on or after the start date.',
    );
    await expect(page.getByLabel('End date', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await components.applyDateRange('2026-11-18', '2026-11-20');
    await expect(page.getByTestId('range-result')).toHaveText('2026-11-18 → 2026-11-20');
    await expect(page.locator('#range-error')).toBeHidden();
  });

  test('checkbox, radio group and switch update their actual states', async ({ page }) => {
    const updates = page.getByRole('checkbox', { name: 'Email updates' });
    await updates.check();
    await expect(updates).toBeChecked();
    await updates.uncheck();
    await expect(updates).not.toBeChecked();
    await page.getByRole('radio', { name: 'Express', exact: true }).check();
    await expect(page.getByRole('radio', { name: 'Standard', exact: true })).not.toBeChecked();
    await expect(page.getByTestId('delivery-result')).toHaveText('Delivery: Express');
    const toggle = page.getByRole('switch', { name: 'Dark mode' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('slider and tooltip work through keyboard input', async ({ page }) => {
    const slider = page.getByRole('slider', { name: 'Priority', exact: true });
    await slider.focus();
    await slider.press('Home');
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
    await expect(slider).toHaveValue('20');
    await expect(page.getByTestId('priority-result')).toHaveText('Priority: 20');
    const help = page.getByRole('button', { name: 'Help for priority' });
    await help.focus();
    await expect(page.getByRole('tooltip')).toHaveText(
      'Use arrow keys to change priority in steps of ten.',
    );
    await help.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
  });

  test('spinbutton enforces minimum and maximum values', async ({ page }) => {
    const seats = page.getByRole('spinbutton', { name: 'Seats', exact: true });
    await seats.fill('9');
    await seats.press('Tab');
    await page.getByRole('button', { name: 'Increase seats' }).click();
    await expect(seats).toHaveValue('10');
    await expect(page.getByRole('button', { name: 'Increase seats' })).toBeDisabled();
    await page.getByRole('button', { name: 'Decrease seats' }).click();
    await expect(seats).toHaveValue('9');
    await seats.fill('0');
    await seats.press('Tab');
    await expect(seats).toHaveValue('1');
    await expect(page.getByRole('button', { name: 'Decrease seats' })).toBeDisabled();
  });

  test('tabs support click and arrow-key navigation', async ({ page }) => {
    await page.getByRole('tab', { name: 'Activity', exact: true }).click();
    await expect(page.getByRole('tabpanel', { name: 'Activity', exact: true })).toContainText(
      'regression suite passed',
    );
    await expect(page.getByRole('tabpanel', { name: 'Overview', exact: true })).toBeHidden();
    await page.getByRole('tab', { name: 'Activity', exact: true }).press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Settings', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'Settings', exact: true }).press('Home');
    await expect(page.getByRole('tab', { name: 'Overview', exact: true })).toBeFocused();
  });

  test('accordion expands and collapses with the keyboard', async ({ page }) => {
    const summary = page.getByText('Release notes', { exact: true });
    await summary.focus();
    await summary.press('Enter');
    await expect(
      page.getByText('Version 2 adds keyboard-friendly component examples.'),
    ).toBeVisible();
    await summary.press('Enter');
    await expect(
      page.getByText('Version 2 adds keyboard-friendly component examples.'),
    ).toBeHidden();
  });

  test('toast is dismissible and auto-expires using the virtual clock', async ({ page }) => {
    await page.clock.install();
    await page.getByRole('button', { name: 'Save preferences' }).click();
    await expect(page.getByRole('status', { name: 'Notification', exact: true })).toContainText(
      'Preferences saved',
    );
    await page.clock.fastForward(5_001);
    await expect(page.getByRole('status', { name: 'Notification', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Save preferences' }).click();
    await page.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(page.getByRole('status', { name: 'Notification', exact: true })).toBeHidden();
  });

  test('menu actions require modal confirmation', async ({ components, page }) => {
    await components.archiveProject(false);
    await expect(page.getByTestId('project-state')).toHaveText('Active');
    await components.archiveProject(true);
    await expect(page.getByTestId('project-state')).toHaveText('Archived');
    await expect(page.getByRole('status', { name: 'Notification', exact: true })).toContainText(
      'Project archived',
    );
  });

  test('menu supports keyboard focus and Escape', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Project actions', exact: true });
    await trigger.focus();
    await trigger.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Rename project' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Archive project' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('data table filters, sorts and paginates', async ({ components, page }) => {
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.getByTestId('page-result')).toHaveText('Page 2 of 2');
    await expect(
      components.inventory.getByRole('cell', { name: 'Delta', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Sort by release' }).click();
    await expect(
      components.inventory.getByRole('columnheader', { name: 'Sort by release' }),
    ).toHaveAttribute('aria-sort', 'descending');
    await expect(components.inventory.locator('tbody tr td:nth-child(2)')).toHaveText([
      'Fir',
      'Elm',
      'Delta',
    ]);
    await page.getByRole('searchbox', { name: 'Filter releases' }).fill('Cedar');
    await expect(components.inventory.getByRole('row')).toHaveCount(2);
    await expect(
      components.inventory.getByRole('cell', { name: 'Cedar', exact: true }),
    ).toBeVisible();
    await page.getByRole('searchbox', { name: 'Filter releases' }).fill('not-a-release');
    await expect(components.inventory.getByText('No releases found')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  });

  test('table row selection preserves checked and mixed states across pages', async ({ page }) => {
    const all = page.getByRole('checkbox', { name: 'Select visible releases' });
    await all.check();
    await expect(page.getByTestId('selected-rows')).toHaveText('3 releases selected');
    await page.getByRole('checkbox', { name: 'Select Aster', exact: true }).uncheck();
    await expect(all).toBeChecked({ indeterminate: true });
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(all).not.toBeChecked();
    await page.getByRole('button', { name: 'Previous page', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Select Birch', exact: true })).toBeChecked();
    await expect(page.getByTestId('selected-rows')).toHaveText('2 releases selected');
  });

  test('form validation recovers after invalid input', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit registration' }).click();
    await expect(page.locator('#registration-errors')).toHaveText(
      'Full name is required. Enter a valid email address. Accept the terms.',
    );
    await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('QA Engineer');
    await page.getByRole('textbox', { name: 'Contact email', exact: true }).fill('not-an-email');
    await page.getByRole('checkbox', { name: 'Accept terms' }).check();
    await page.getByRole('button', { name: 'Submit registration' }).click();
    await expect(page.locator('#registration-errors')).toHaveText('Enter a valid email address.');
    await page.getByRole('textbox', { name: 'Contact email', exact: true }).fill('qa@example.com');
    await page.getByRole('button', { name: 'Submit registration' }).click();
    await expect(page.getByTestId('registration-result')).toHaveText(
      'Registration saved for QA Engineer',
    );
    await expect(page.locator('#registration-errors')).toBeHidden();
  });

  test('component lab is responsive and passes the WCAG scan @a11y', async ({ page }, testInfo) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    await testInfo.attach('component-accessibility', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    });
    expect(result.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
});
