import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
const cwd = fileURLToPath(new URL('../component-tests/', import.meta.url));
function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (process.argv.includes('--setup')) {
  if (!process.env.npm_execpath) throw new Error('Run through npm run components:setup');
  run([process.env.npm_execpath, 'ci']);
  run([
    resolve(cwd, 'node_modules/@playwright/experimental-ct-react/cli.js'),
    'install',
    'chromium',
  ]);
} else {
  run([resolve(cwd, 'node_modules/typescript/bin/tsc'), '--noEmit']);
  run([
    resolve(cwd, 'node_modules/@playwright/experimental-ct-react/cli.js'),
    'test',
    '-c',
    'playwright-ct.config.ts',
    ...process.argv.slice(2),
  ]);
}
