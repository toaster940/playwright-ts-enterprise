import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import OpenAI from 'openai';
import { runAgent, type AgentEvent } from '../../src/agent/agent.js';

test('Responses tool loop executes validated tools and preserves model output', async () => {
  const requests: { input: { type?: string; call_id?: string }[] }[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push(JSON.parse(body));
    const output =
      requests.length === 1
        ? [
            {
              type: 'function_call',
              id: 'fc_1',
              call_id: 'call_1',
              name: 'read_summary',
              arguments: '{}',
            },
          ]
        : [
            {
              type: 'message',
              id: 'msg_1',
              role: 'assistant',
              status: 'completed',
              content: [
                {
                  type: 'output_text',
                  text: 'Read summary evidence; no new test execution claimed.',
                  annotations: [],
                },
              ],
            },
          ];
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        id: 'resp_1',
        object: 'response',
        created_at: 1,
        status: 'completed',
        output,
        model: 'test-model',
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const client = new OpenAI({
      apiKey: 'local-test-only',
      baseURL: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`,
      maxRetries: 0,
    });
    const events: AgentEvent[] = [];
    const answer = await runAgent('Summarize the latest report', {
      client,
      model: 'test-model',
      maxSteps: 3,
      onEvent: (event) => events.push(event),
    });
    assert.match(answer, /summary evidence/);
    assert.equal(events[0]?.name, 'read_summary');
    assert.ok(
      requests[1]?.input.some((item) => item.type === 'function_call' && item.call_id === 'call_1'),
    );
    assert.ok(
      requests[1]?.input.some(
        (item) => item.type === 'function_call_output' && item.call_id === 'call_1',
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
