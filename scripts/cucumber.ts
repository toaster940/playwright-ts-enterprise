import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ensureDemoService, rootDir } from '../src/support/demo-service.js';

type Step = { result?: { status?: string; duration?: number; error_message?: string } };
type Feature = {
  name: string;
  uri: string;
  elements?: { name: string; type: string; before?: Step[]; steps?: Step[]; after?: Step[] }[];
};
const args = process.argv.slice(2);
const discovery =
  args.includes('--dry-run') || args.includes('--help') || args.includes('--version');
const reportDir = resolve(
  rootDir,
  discovery ? 'artifacts/cucumber/discovery' : 'artifacts/cucumber',
);
await mkdir(reportDir, { recursive: true });
await rm(resolve(reportDir, 'results.json'), { force: true });
const service = discovery ? undefined : await ensureDemoService();
const start = Date.now();
try {
  const child = spawn(
    process.execPath,
    [
      '--import',
      'tsx',
      'node_modules/@cucumber/cucumber/bin/cucumber.js',
      '--config',
      'cucumber.mjs',
      ...args,
    ],
    {
      cwd: rootDir,
      stdio: 'inherit',
      windowsHide: true,
      shell: false,
      env: { ...process.env, BDD_REPORT_DIR: reportDir, OPENAI_API_KEY: '' },
    },
  );
  const interrupt = () => child.kill('SIGTERM');
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  let code: number;
  try {
    code = await new Promise<number>((done, reject) => {
      child.once('error', reject);
      child.once('exit', (status) => done(status ?? 1));
    });
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  if (!discovery) {
    let features: Feature[] = [];
    try {
      features = JSON.parse(await readFile(resolve(reportDir, 'results.json'), 'utf8'));
    } catch (error) {
      if (code === 0) throw error;
    }
    const tests = features.flatMap((feature) =>
      (feature.elements ?? [])
        .filter((element) => element.type === 'scenario')
        .map((element) => {
          const steps = [
            ...(element.before ?? []),
            ...(element.steps ?? []),
            ...(element.after ?? []),
          ];
          const statuses = steps.map((step) => step.result?.status);
          return {
            title: `${feature.name} > ${element.name}`,
            project: 'cucumber',
            status:
              statuses.every((status) => status === 'passed') && statuses.length
                ? 'passed'
                : statuses.every((status) => status === 'skipped')
                  ? 'skipped'
                  : 'failed',
            expectedStatus: 'passed',
            durationMs: steps.reduce((sum, step) => sum + (step.result?.duration ?? 0), 0) / 1e6,
            errors: steps.flatMap((step) =>
              step.result?.error_message ? [step.result.error_message.slice(0, 3000)] : [],
            ),
          };
        }),
    );
    if (!tests.length && code === 0) {
      console.error('No scenarios selected; failing to avoid an empty green run.');
      code = 1;
    }
    const summary = {
      status: code === 0 ? 'passed' : 'failed',
      durationMs: Date.now() - start,
      tests,
    };
    await writeFile(resolve(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));
    await writeFile(resolve(rootDir, 'artifacts/summary.json'), JSON.stringify(summary, null, 2));
  }
  process.exitCode = code;
} finally {
  await service?.stop();
}
