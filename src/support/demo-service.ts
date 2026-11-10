import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

export const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export async function ensureDemoService() {
  const url = new URL(env.BASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || Number(url.port) !== env.PORT) {
    throw new Error('Managed demo requires a loopback BASE_URL with the same port as PORT.');
  }
  async function ready() {
    try {
      const response = await fetch(new URL('/api/health', url), {
        signal: AbortSignal.timeout(700),
      });
      return response.ok && (await response.json()).status === 'ok';
    } catch {
      return false;
    }
  }
  if (await ready()) return { owned: false, stop: async () => {} };
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/demo/server.ts'], {
    cwd: rootDir,
    windowsHide: true,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, OPENAI_API_KEY: '' },
  });
  let log = '';
  let failure: Error | undefined;
  child.on('error', (error) => {
    failure = error;
  });
  const collect = (data: Buffer) => {
    log = (log + data.toString()).slice(-8_000);
  };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise<void>((resolveStop) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolveStop();
      }, 3_000);
      child.once('close', () => {
        clearTimeout(timer);
        resolveStop();
      });
      child.kill('SIGTERM');
    });
  }
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (failure || child.exitCode !== null) {
      await stop();
      throw new Error(`Demo server failed: ${failure?.message ?? log}`);
    }
    if (await ready()) return { owned: true, stop };
    await delay(100);
  }
  await stop();
  throw new Error(`Demo server readiness timed out. ${log}`);
}
