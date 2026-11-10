import type { Reporter, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdir, writeFile } from 'node:fs/promises';
import { stripVTControlCharacters } from 'node:util';

export default class SummaryReporter implements Reporter {
  private tests: {
    title: string;
    project: string;
    status: string;
    expectedStatus: string;
    durationMs: number;
    errors: string[];
  }[] = [];
  onTestEnd(test: TestCase, result: TestResult) {
    this.tests.push({
      title: test.titlePath().join(' > '),
      project: test.parent.project()?.name ?? '',
      status: result.status,
      expectedStatus: test.expectedStatus,
      durationMs: result.duration,
      errors: result.errors.map((error) =>
        stripVTControlCharacters(error.message ?? '').slice(0, 3000),
      ),
    });
  }
  async onEnd(result: FullResult) {
    await mkdir('artifacts', { recursive: true });
    await writeFile(
      'artifacts/summary.json',
      JSON.stringify(
        { status: result.status, durationMs: result.duration, tests: this.tests },
        null,
        2,
      ),
    );
  }
}
