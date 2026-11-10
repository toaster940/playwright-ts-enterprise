import { resolve } from 'node:path';
import { devices } from '@playwright/test';

export function codegenPlan(options: {
  root: string;
  baseURL: string;
  name: string;
  guest?: boolean;
  device?: string;
}) {
  if (!/^[a-z][a-z0-9-]{0,59}$/.test(options.name))
    throw new Error(
      'Recording name must be a lowercase slug beginning with a letter (max 60 characters)',
    );
  if (options.device && !devices[options.device])
    throw new Error(`Unknown Playwright device: ${options.device}`);
  const output = resolve(options.root, 'recordings', `${options.name}.spec.ts`);
  const state = resolve(options.root, 'playwright/.auth', `codegen-${options.name}.json`);
  const args = ['codegen', '--target=playwright-test', '--output', output];
  if (options.device) args.push('--device', options.device);
  if (!options.guest) args.push('--load-storage', state);
  args.push(options.baseURL);
  return { args, output, state };
}
