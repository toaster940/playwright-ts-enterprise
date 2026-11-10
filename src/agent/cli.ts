import OpenAI from 'openai';
import { mkdir, writeFile } from 'node:fs/promises';
import { env } from '../config/env.js';
import { runAgent, runOfflineDemo, type AgentEvent } from './agent.js';

const events: AgentEvent[] = [];
const onEvent = (event: AgentEvent) => {
  events.push(event);
  console.log(JSON.stringify(event, null, 2));
};
try {
  if (process.argv.includes('--demo')) {
    console.log(
      'Offline scripted tool demo: no model request or API key. Executes real smoke tests.',
    );
    const demoEvents = await runOfflineDemo(onEvent);
    const run = demoEvents.find((event) => event.name === 'run_tests')?.result as {
      exitCode: number;
      timedOut: boolean;
    };
    if (run.exitCode !== 0 || run.timedOut) process.exitCode = 1;
  } else {
    if (!env.OPENAI_API_KEY)
      throw new Error('Set OPENAI_API_KEY in .env, or run npm run agent:demo without credentials.');
    const goal =
      process.argv.slice(2).join(' ') || 'Run the smoke tests and summarize the evidence.';
    await runAgent(goal, {
      client: new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 1 }),
      model: env.OPENAI_MODEL,
      maxSteps: env.AGENT_MAX_STEPS,
      onEvent,
    });
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/agent-run.json', JSON.stringify(events, null, 2));
}
