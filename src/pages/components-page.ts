import { expect, type Page } from '@playwright/test';

export class ComponentsPage {
  constructor(readonly page: Page) {}
  get environment() {
    return this.page.getByRole('combobox', { name: 'Release environment' });
  }
  get reviewer() {
    return this.page.getByRole('combobox', { name: 'Assign reviewer' });
  }
  get calendar() {
    return this.page.getByRole('dialog', { name: 'Choose meeting date', exact: true });
  }
  get inventory() {
    return this.page.getByRole('table', { name: 'Release inventory' });
  }
  async open() {
    await this.page.goto('/components.html');
    await expect(
      this.page.getByRole('heading', { name: 'UI component lab', exact: true }),
    ).toBeVisible();
    // This state also confirms the module finished initializing its controls.
    await expect(this.inventory.getByRole('row')).toHaveCount(4);
  }
  async selectEnvironment(label: string) {
    await this.environment.selectOption({ label });
  }
  async chooseReviewer(query: string, name: string) {
    await this.reviewer.fill(query);
    await this.page.getByRole('option', { name, exact: true }).click();
  }
  async openCalendar() {
    await this.page.getByRole('button', { name: 'Choose meeting date', exact: true }).click();
  }
  async chooseMeetingDate(value: string) {
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
      throw new Error(`Invalid ISO date: ${value}`);
    await this.openCalendar();
    await this.calendar.getByLabel('Calendar year').selectOption(String(date.getUTCFullYear()));
    await this.calendar.getByLabel('Calendar month').selectOption(String(date.getUTCMonth()));
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
    await this.calendar.getByRole('button', { name: label, exact: true }).click();
    await expect(this.page.getByRole('textbox', { name: 'Meeting date', exact: true })).toHaveValue(
      value,
    );
  }
  async applyDateRange(start: string, end: string) {
    await this.page.getByLabel('Start date', { exact: true }).fill(start);
    await this.page.getByLabel('End date', { exact: true }).fill(end);
    await this.page.getByRole('button', { name: 'Apply date range' }).click();
  }
  async archiveProject(confirm: boolean) {
    await this.page.getByRole('button', { name: 'Project actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Archive project', exact: true }).click();
    const dialog = this.page.getByRole('alertdialog', { name: 'Archive project?' });
    await dialog
      .getByRole('button', { name: confirm ? 'Confirm archive' : 'Cancel archive', exact: true })
      .click();
  }
}
