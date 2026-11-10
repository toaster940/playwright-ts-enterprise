import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from '../src/config/env.js';
import { recordingActions, renderRecording } from '../src/codegen/import-recording.js';
import { format, resolveConfig } from 'prettier';

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    name: { type: 'string' },
    guest: { type: 'boolean', default: false },
  },
});
if (!values.input || !values.name)
  throw new Error(
    'Usage: npm run codegen:import -- --input recordings/session.spec.ts --name task-flow [--guest]',
  );
const output = renderRecording(
  values.name,
  recordingActions(await readFile(resolve(values.input), 'utf8'), env.BASE_URL),
  values.guest,
);
await mkdir('features/generated', { recursive: true });
await mkdir('cucumber/recordings', { recursive: true });
const feature = resolve('features/generated', `${values.name}.feature`);
const steps = resolve('cucumber/recordings', `${values.name}.ts`);
// Exclusive creation prevents silently overwriting reviewed scenarios or steps.
const handles: string[] = [];
try {
  await writeFile(feature, output.feature, { flag: 'wx' });
  handles.push(feature);
  await writeFile(
    steps,
    await format(output.steps, { ...(await resolveConfig(process.cwd())), parser: 'typescript' }),
    { flag: 'wx' },
  );
} catch (error) {
  if (handles.length) {
    const { unlink } = await import('node:fs/promises');
    await unlink(feature);
  }
  throw error;
}
console.log(
  `Created ${feature}\nCreated ${steps}\nRun: npm run test:bdd -- --name "Replay ${values.name}"`,
);
