import { Given, When, Then, type DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { ComponentsPage } from '../../src/pages/components-page.js';
import type { QAWorld } from '../support/world.js';

const lab = (world: QAWorld) => new ComponentsPage(world.page!);
Then('the reminder date is rejected', async function (this: QAWorld) {
  await expect(this.page!.getByLabel('Reminder date', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(this.page!.getByTestId('reminder-result')).toHaveText('No reminder saved');
});
Given('I open the UI component lab', async function (this: QAWorld) {
  await this.ui();
  await lab(this).open();
});
When('I choose environment {string}', async function (this: QAWorld, label: string) {
  await lab(this).selectEnvironment(label);
});
Then('the selected environment is {string}', async function (this: QAWorld, label: string) {
  await expect(this.page!.getByTestId('environment-result')).toHaveText(`Environment: ${label}`);
});
When('I select these browser options:', async function (this: QAWorld, table: DataTable) {
  await this.page!.getByRole('listbox', { name: 'Supported browsers' }).selectOption(
    table.rows().flat(),
  );
});
Then('the selected browsers are {string}', async function (this: QAWorld, text: string) {
  await expect(this.page!.getByTestId('browser-result')).toHaveText(text);
});
When(
  'I choose country {string} and region {string}',
  async function (this: QAWorld, country: string, region: string) {
    await this.page!.getByRole('combobox', { name: 'Country', exact: true }).selectOption({
      label: country,
    });
    await this.page!.getByRole('combobox', { name: 'State or region' }).selectOption({
      label: region,
    });
  },
);
When('I change country to {string}', async function (this: QAWorld, country: string) {
  await this.page!.getByRole('combobox', { name: 'Country', exact: true }).selectOption({
    label: country,
  });
});
Then('the region selection is reset', async function (this: QAWorld) {
  await expect(this.page!.getByRole('combobox', { name: 'State or region' })).toHaveValue('');
  await expect(this.page!.getByTestId('region-result')).toHaveText('No region selected');
});
When(
  'I search {string} and select reviewer {string}',
  async function (this: QAWorld, query: string, name: string) {
    await lab(this).chooseReviewer(query, name);
  },
);
When(
  'I select reviewer {string} using the keyboard',
  async function (this: QAWorld, query: string) {
    const field = lab(this).reviewer;
    await field.fill(query);
    await field.press('ArrowDown');
    await field.press('Enter');
  },
);
Then('the selected reviewer is {string}', async function (this: QAWorld, name: string) {
  await expect(this.page!.getByTestId('reviewer-result')).toHaveText(`Reviewer: ${name}`);
  await expect(lab(this).reviewer).toHaveAttribute('aria-expanded', 'false');
});
When('I save reminder date {string}', async function (this: QAWorld, date: string) {
  await this.page!.getByLabel('Reminder date', { exact: true }).fill(date);
  await this.page!.getByRole('button', { name: 'Save reminder' }).click();
});
Then('the saved reminder is {string}', async function (this: QAWorld, date: string) {
  await expect(this.page!.getByTestId('reminder-result')).toHaveText(`Reminder: ${date}`);
});
When(
  'I select meeting date {string} in the calendar',
  async function (this: QAWorld, date: string) {
    await lab(this).chooseMeetingDate(date);
  },
);
Then('the selected meeting date is {string}', async function (this: QAWorld, date: string) {
  await expect(this.page!.getByLabel('Meeting date', { exact: true })).toHaveValue(date);
});
When('I open the meeting calendar in November 2026', async function (this: QAWorld) {
  await lab(this).openCalendar();
  await lab(this).calendar.getByLabel('Calendar month').selectOption('10');
});
Then('the weekend date November 21 is unavailable', async function (this: QAWorld) {
  await expect(
    lab(this).calendar.getByRole('button', { name: 'November 21, 2026', exact: true }),
  ).toBeDisabled();
});
When('I choose the next Monday using calendar arrow keys', async function (this: QAWorld) {
  await lab(this).openCalendar();
  await this.page!.keyboard.press('ArrowRight');
  await this.page!.keyboard.press('ArrowRight');
  await this.page!.keyboard.press('Enter');
});
When(
  'I apply date range {string} to {string}',
  async function (this: QAWorld, start: string, end: string) {
    await lab(this).applyDateRange(start, end);
  },
);
Then('the date range is rejected', async function (this: QAWorld) {
  await expect(this.page!.locator('#range-error')).toBeVisible();
  await expect(this.page!.getByLabel('End date', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});
Then('the selected date range is {string}', async function (this: QAWorld, value: string) {
  await expect(this.page!.getByTestId('range-result')).toHaveText(value);
  await expect(this.page!.locator('#range-error')).toBeHidden();
});
When('I enable email updates and dark mode with express delivery', async function (this: QAWorld) {
  await this.page!.getByRole('checkbox', { name: 'Email updates' }).check();
  await this.page!.getByRole('switch', { name: 'Dark mode' }).click();
  await this.page!.getByRole('radio', { name: 'Express', exact: true }).check();
});
Then('those preferences are selected', async function (this: QAWorld) {
  await expect(this.page!.getByRole('checkbox', { name: 'Email updates' })).toBeChecked();
  await expect(this.page!.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(this.page!.getByTestId('delivery-result')).toHaveText('Delivery: Express');
});
When('I set priority to twenty with the keyboard', async function (this: QAWorld) {
  const slider = this.page!.getByRole('slider', { name: 'Priority', exact: true });
  await slider.focus();
  await slider.press('Home');
  await slider.press('ArrowRight');
  await slider.press('ArrowRight');
});
Then('the selected priority is twenty', async function (this: QAWorld) {
  await expect(this.page!.getByTestId('priority-result')).toHaveText('Priority: 20');
});
When('I increase seats from nine', async function (this: QAWorld) {
  const field = this.page!.getByRole('spinbutton', { name: 'Seats', exact: true });
  await field.fill('9');
  await field.press('Tab');
  await this.page!.getByRole('button', { name: 'Increase seats' }).click();
});
Then('the seat limit is reached', async function (this: QAWorld) {
  await expect(this.page!.getByRole('spinbutton', { name: 'Seats', exact: true })).toHaveValue(
    '10',
  );
  await expect(this.page!.getByRole('button', { name: 'Increase seats' })).toBeDisabled();
});
When('I switch to the Activity tab', async function (this: QAWorld) {
  await this.page!.getByRole('tab', { name: 'Activity', exact: true }).click();
});
Then('only the Activity panel is visible', async function (this: QAWorld) {
  await expect(this.page!.getByRole('tabpanel', { name: 'Activity', exact: true })).toBeVisible();
  await expect(this.page!.getByRole('tabpanel', { name: 'Overview', exact: true })).toBeHidden();
});
When('I expand the release notes', async function (this: QAWorld) {
  await this.page!.getByText('Release notes', { exact: true }).click();
});
Then('the release note content is visible', async function (this: QAWorld) {
  await expect(
    this.page!.getByText('Version 2 adds keyboard-friendly component examples.'),
  ).toBeVisible();
});
When('I save component preferences', async function (this: QAWorld) {
  await this.page!.getByRole('button', { name: 'Save preferences' }).click();
});
Then('a preference notification appears', async function (this: QAWorld) {
  await expect(this.page!.getByRole('status', { name: 'Notification', exact: true })).toContainText(
    'Preferences saved',
  );
});
When('I dismiss the notification', async function (this: QAWorld) {
  await this.page!.getByRole('button', { name: 'Dismiss notification' }).click();
});
Then('the notification is hidden', async function (this: QAWorld) {
  await expect(this.page!.getByRole('status', { name: 'Notification', exact: true })).toBeHidden();
});
When('I cancel archiving the project', async function (this: QAWorld) {
  await lab(this).archiveProject(false);
});
When('I confirm archiving the project', async function (this: QAWorld) {
  await lab(this).archiveProject(true);
});
Then('the project state is {string}', async function (this: QAWorld, state: string) {
  await expect(this.page!.getByTestId('project-state')).toHaveText(state);
});
When('I filter releases by {string}', async function (this: QAWorld, value: string) {
  await this.page!.getByRole('searchbox', { name: 'Filter releases' }).fill(value);
});
Then('the inventory contains only release {string}', async function (this: QAWorld, name: string) {
  await expect(lab(this).inventory.getByRole('row')).toHaveCount(2);
  await expect(lab(this).inventory.getByRole('cell', { name, exact: true })).toBeVisible();
});
When('I select the visible releases except Aster', async function (this: QAWorld) {
  await this.page!.getByRole('checkbox', { name: 'Select visible releases' }).check();
  await this.page!.getByRole('checkbox', { name: 'Select Aster', exact: true }).uncheck();
});
Then('the table selection is mixed with two selected releases', async function (this: QAWorld) {
  await expect(this.page!.getByRole('checkbox', { name: 'Select visible releases' })).toBeChecked({
    indeterminate: true,
  });
  await expect(this.page!.getByTestId('selected-rows')).toHaveText('2 releases selected');
});
When('I submit an empty registration', async function (this: QAWorld) {
  await this.page!.getByRole('button', { name: 'Submit registration' }).click();
});
Then('the required registration errors are shown', async function (this: QAWorld) {
  await expect(this.page!.locator('#registration-errors')).toHaveText(
    'Full name is required. Enter a valid email address. Accept the terms.',
  );
});
When('I complete the registration correctly', async function (this: QAWorld) {
  await this.page!.getByRole('textbox', { name: 'Full name', exact: true }).fill('QA Engineer');
  await this.page!.getByRole('textbox', { name: 'Contact email', exact: true }).fill(
    'qa@example.com',
  );
  await this.page!.getByRole('checkbox', { name: 'Accept terms' }).check();
  await this.page!.getByRole('button', { name: 'Submit registration' }).click();
});
Then('the registration is saved', async function (this: QAWorld) {
  await expect(this.page!.getByTestId('registration-result')).toHaveText(
    'Registration saved for QA Engineer',
  );
  await expect(this.page!.locator('#registration-errors')).toBeHidden();
});
