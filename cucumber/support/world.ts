import { World, type IWorldOptions } from '@cucumber/cucumber';
import {
  chromium,
  firefox,
  webkit,
  request,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { env } from '../../src/config/env.js';
import { TaskClient, type Task } from '../../src/api/task-client.js';
import { WorkspacePage } from '../../src/pages/workspace-page.js';

type Parameters = { browser: 'chromium' | 'firefox' | 'webkit'; headless: boolean };
let browser: Browser | undefined;
export async function stopWorkerBrowser() {
  await browser?.close();
  browser = undefined;
}

export class QAWorld extends World<Parameters> {
  readonly namespace = randomUUID();
  request!: APIRequestContext;
  api!: TaskClient;
  context?: BrowserContext;
  page?: Page;
  workspace?: WorkspacePage;
  response?: APIResponse;
  task?: Task;
  tasks: Task[] = [];
  artifactDir = '';
  authenticated = false;
  constructor(options: IWorldOptions<Parameters>) {
    super(options);
  }
  async init() {
    this.request = await request.newContext({
      baseURL: env.BASE_URL,
      extraHTTPHeaders: { 'x-test-namespace': this.namespace },
    });
    this.api = new TaskClient(this.request);
  }
  async signIn() {
    await expect(
      await this.request.post('/api/login', {
        data: { email: 'qa@example.com', password: 'Playwright123!' },
      }),
    ).toBeOK();
    this.authenticated = true;
    if (this.context) await this.context.addCookies((await this.request.storageState()).cookies);
  }
  async ui() {
    if (!this.page) {
      const engine = this.parameters.browser ?? 'chromium';
      if (!['chromium', 'firefox', 'webkit'].includes(engine))
        throw new Error(`Unsupported BDD browser: ${engine}`);
      browser ??= await { chromium, firefox, webkit }[engine].launch({
        headless: this.parameters.headless ?? true,
      });
      this.context = await browser.newContext({
        baseURL: env.BASE_URL,
        storageState: await this.request.storageState(),
        extraHTTPHeaders: { 'x-test-namespace': this.namespace },
        serviceWorkers: 'block',
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: 'light',
        recordVideo: { dir: this.artifactDir },
      });
      this.context.setDefaultTimeout(10_000);
      await this.context.addInitScript(
        (value) => localStorage.setItem('namespace', value),
        this.namespace,
      );
      await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      this.page = await this.context.newPage();
      this.workspace = new WorkspacePage(this.page);
    }
    return this.page;
  }
  async close() {
    const errors: unknown[] = [];
    try {
      if (this.authenticated) await expect(await this.request.delete('/api/namespace')).toBeOK();
    } catch (error) {
      errors.push(error);
    }
    try {
      await this.context?.close();
    } catch (error) {
      errors.push(error);
    }
    try {
      await this.request?.dispose();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length) throw new AggregateError(errors, 'Scenario teardown failed');
  }
}
