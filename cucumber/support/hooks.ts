import {
  Before,
  After,
  AfterStep,
  AfterAll,
  setWorldConstructor,
  setDefaultTimeout,
  Status,
} from '@cucumber/cucumber';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { QAWorld, stopWorkerBrowser } from './world.js';

setWorldConstructor(QAWorld);
setDefaultTimeout(30_000);
Before(
  { name: 'Isolated API context and scenario artifacts' },
  async function (this: QAWorld, { pickle }) {
    const slug = pickle.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 65);
    this.artifactDir = resolve('artifacts/cucumber/scenarios', `${slug}-${this.namespace}`);
    await mkdir(this.artifactDir, { recursive: true });
    await this.init();
    await this.attach(
      JSON.stringify({
        scenario: pickle.name,
        namespace: this.namespace,
        browser: this.parameters.browser,
      }),
      'application/json',
    );
  },
);
AfterStep(async function (this: QAWorld, { result }) {
  if (result.status === Status.FAILED && this.page && !this.page.isClosed()) {
    await this.attach(
      await this.page.screenshot({
        fullPage: true,
        path: resolve(this.artifactDir, 'failure.png'),
      }),
      'image/png',
    );
  }
});
After(
  { name: 'Trace, video and deterministic cleanup' },
  async function (this: QAWorld, { result }) {
    const failed = result?.status !== Status.PASSED;
    const video = this.page?.video();
    try {
      if (this.context) {
        const path = resolve(this.artifactDir, 'trace.zip');
        await this.context.tracing.stop(failed ? { path } : {});
        if (failed) await this.attach(`Trace: ${path}`, 'text/plain');
      }
    } finally {
      try {
        await this.close();
      } finally {
        if (video) {
          if (failed) await this.attach(`Video: ${await video.path()}`, 'text/plain');
          else await video.delete();
        }
      }
    }
  },
);
AfterAll({ name: 'Close this worker browser' }, stopWorkerBrowser);
