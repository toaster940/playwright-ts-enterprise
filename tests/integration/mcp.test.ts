import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { executeTool, projectRoot } from '../../src/tools/registry.js';

test(
  'MCP stdio handshake, tools, resources, prompts and real discovery',
  { timeout: 60_000 },
  async () => {
    const transport = new StdioClientTransport({
      command: 'node',
      args: [resolve(projectRoot, 'scripts/launch.cjs'), 'mcp'],
      cwd: projectRoot,
      stderr: 'pipe',
    });
    const client = new Client({ name: 'quality-lab-integration', version: '1.0.0' });
    try {
      await client.connect(transport);
      assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), [
        'list_tests',
        'read_summary',
        'run_tests',
      ]);
      const result = await client.callTool({ name: 'list_tests', arguments: { suite: 'api' } });
      assert.ok(!result.isError);
      assert.match(JSON.stringify(result.content), /CRUD lifecycle/);
      const bdd = await client.callTool({ name: 'list_tests', arguments: { suite: 'bdd' } });
      assert.ok(!bdd.isError);
      assert.match(JSON.stringify(bdd.content), /Replay imported-task-flow/);
      const execution = await client.callTool({ name: 'run_tests', arguments: { suite: 'api' } });
      assert.ok(!execution.isError, JSON.stringify(execution.content));
      const executionContent = execution.content as { type: string; text: string }[];
      const executionResult = JSON.parse(executionContent[0]!.text);
      assert.equal(executionResult.exitCode, 0, executionResult.output);
      assert.equal(executionResult.timedOut, false);
      assert.match(executionResult.output, /11 passed/);
      const invalid = await client.callTool({
        name: 'run_tests',
        arguments: { suite: 'arbitrary;command' },
      });
      assert.equal(invalid.isError, true);
      assert.equal((await client.listResources()).resources[0]?.uri, 'quality-lab://features');
      assert.match(
        JSON.stringify(await client.readResource({ uri: 'quality-lab://features' })),
        /WebMCP/,
      );
      assert.equal((await client.listPrompts()).prompts[0]?.name, 'investigate-failure');
    } finally {
      await client.close();
    }
  },
);
test('tool arguments reject unknown commands and shell injection', async () => {
  await assert.rejects(() => executeTool('shell', { command: 'echo bad' }), /Unknown tool/);
  await assert.rejects(() => executeTool('run_tests', { suite: 'api', command: 'echo bad' }));
  await assert.rejects(() => executeTool('run_tests', { suite: 'api; echo bad' }));
});
