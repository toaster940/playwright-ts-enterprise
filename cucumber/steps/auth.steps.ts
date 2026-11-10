import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { QAWorld } from '../support/world.js';

Given('I am signed in via the API', async function (this: QAWorld) {
  await this.signIn();
});
Given('I have a fresh unauthenticated session', function (this: QAWorld) {
  expect(this.authenticated).toBe(false);
});
When(
  'I log in with email {string} and password {string}',
  async function (this: QAWorld, email: string, password: string) {
    this.response = await this.request.post('/api/login', { data: { email, password } });
    if (this.response.ok()) this.authenticated = true;
  },
);
When('I request my profile', async function (this: QAWorld) {
  this.response = await this.request.get('/api/me');
});
Then('the profile belongs to {string}', async function (this: QAWorld, email: string) {
  expect(await this.response!.json()).toMatchObject({ email });
});
Then('the response status is {int}', function (this: QAWorld, status: number) {
  expect(this.response, 'Send an API request before checking its status').toBeDefined();
  expect(this.response!.status()).toBe(status);
});
Then('the response error is {string}', async function (this: QAWorld, error: string) {
  expect(await this.response!.json()).toMatchObject({ error });
});
