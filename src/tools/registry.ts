import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cli = resolve(projectRoot, 'node_modules/@playwright/test/cli.js');
export const suiteSchema = z.enum(['smoke', 'api', 'ui', 'bdd']);
const suiteArgs = {
  smoke: ['--grep', '@smoke'],
  api: ['--project=api'],
  ui: ['--project=chromium'],
};
let running = false;
export const definitions = {
  list_tests: {
    description: 'List test cases for a fixed suite; does not execute tests.',
    schema: z.object({ suite: suiteSchema }).strict(),
  },
  run_tests: {
    description:
      'Run a fixed local UI, API or Cucumber suite; returns actual exit status and bounded output. Never changes tests.',
    schema: z.object({ suite: suiteSchema }).strict(),
  },
  read_summary: {
    description: 'Read the latest local test summary. Missing report is returned explicitly.',
    schema: z.object({}).strict(),
  },
} as const;
export type ToolName = keyof typeof definitions;
export const toolNames = Object.keys(definitions) as ToolName[];

async function command(args: string[], timeoutMs = 180_000, entry = [cli, 'test']) {
  return new Promise<{ exitCode: number | null; timedOut: boolean; output: string }>(
    (resolvePromise, reject) => {
      const child = spawn(process.execPath, [...entry, ...args], {
        cwd: projectRoot,
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          OPENAI_API_KEY: '',
          FORCE_COLOR: '0',
          PLAYWRIGHT_HTML_OPEN: 'never',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      let timedOut = false;
      const append = (chunk: Buffer) => {
        output = (output + chunk.toString()).slice(-24_000);
      };
      child.stdout.on('data', append);
      child.stderr.on('data', append);
      const timer = setTimeout(() => {
        timedOut = true;
        if (process.platform === 'win32' && child.pid) {
          spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
            windowsHide: true,
            stdio: 'ignore',
            shell: false,
          }).on('error', () => child.kill());
        } else child.kill('SIGTERM');
      }, timeoutMs);
      child.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once('close', (exitCode) => {
        clearTimeout(timer);
        resolvePromise({ exitCode, timedOut, output });
      });
    },
  );
}

export async function executeTool(name: string, raw: unknown): Promise<unknown> {
  if (!Object.hasOwn(definitions, name)) throw new Error(`Unknown tool: ${name}`);
  const tool = name as ToolName;
  const args = definitions[tool].schema.parse(raw);
  if (tool === 'read_summary') {
    try {
      const summary = JSON.parse(
        await readFile(resolve(projectRoot, 'artifacts/summary.json'), 'utf8'),
      );
      return { ...summary, tests: summary.tests.slice(-100) };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return { status: 'missing', message: 'Run tests first.' };
      throw error;
    }
  }
  if (running) throw new Error('A tool test command is already running. Retry after completion.');
  running = true;
  try {
    const { suite } = args as { suite: z.infer<typeof suiteSchema> };
    if (suite === 'bdd') {
      return await command(
        tool === 'list_tests' ? ['--dry-run', '--format', 'pretty'] : [],
        tool === 'list_tests' ? 30_000 : 180_000,
        ['--import', 'tsx', resolve(projectRoot, 'scripts/cucumber.ts')],
      );
    }
    return await command(
      [...suiteArgs[suite], ...(tool === 'list_tests' ? ['--list', '--reporter=list'] : [])],
      tool === 'list_tests' ? 30_000 : 180_000,
    );
  } finally {
    running = false;
  }
}
