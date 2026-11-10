import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { request, expect } from '@playwright/test';
import { env } from '../src/config/env.js';
import { ensureDemoService, rootDir } from '../src/support/demo-service.js';
import { codegenPlan } from '../src/codegen/plan.js';

const { values } = parseArgs({
  options: {
    name: { type: 'string', default: `recording-${Date.now()}` },
    guest: { type: 'boolean', default: false },
    device: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});
const plan = codegenPlan({
  root: rootDir,
  baseURL: env.BASE_URL,
  name: values.name!,
  guest: values.guest,
  device: values.device,
});
if (values['dry-run']) {
  console.log(
    JSON.stringify(
      {
        command: process.execPath,
        args: ['node_modules/@playwright/test/cli.js', ...plan.args],
        output: plan.output,
        startsDemo: true,
      },
      null,
      2,
    ),
  );
} else {
  let exists = false;
  try {
    await access(plan.output);
    exists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (exists) throw new Error(`Recording already exists: ${plan.output}. Choose another --name.`);
  await mkdir(dirname(plan.output), { recursive: true });
  const service = await ensureDemoService();
  const namespace = randomUUID();
  const api = await request.newContext({
    baseURL: env.BASE_URL,
    extraHTTPHeaders: { 'x-test-namespace': namespace },
  });
  try {
    if (!values.guest) {
      await expect(
        await api.post('/api/login', {
          data: { email: 'qa@example.com', password: 'Playwright123!' },
        }),
      ).toBeOK();
      const state = await api.storageState();
      state.origins.push({
        origin: new URL(env.BASE_URL).origin,
        localStorage: [{ name: 'namespace', value: namespace }],
      });
      await mkdir(dirname(plan.state), { recursive: true });
      await writeFile(plan.state, JSON.stringify(state), { mode: 0o600 });
    }
    console.log(
      `Recording to ${plan.output}\nUse Inspector assertion tools, then close the recorder to finish.\nImport: npm run codegen:import -- --input "${plan.output}" --name ${values.name}`,
    );
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', ...plan.args], {
      cwd: rootDir,
      stdio: 'inherit',
      windowsHide: true,
      shell: false,
      env: { ...process.env, OPENAI_API_KEY: '' },
    });
    const interrupt = () => child.kill('SIGTERM');
    process.once('SIGINT', interrupt);
    process.once('SIGTERM', interrupt);
    try {
      process.exitCode = await new Promise<number>((done, reject) => {
        child.once('error', reject);
        child.once('exit', (status) => done(status ?? 1));
      });
    } finally {
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', interrupt);
    }
  } finally {
    try {
      if (!values.guest) await api.delete('/api/namespace');
    } finally {
      await api.dispose();
      await service.stop();
    }
  }
}
