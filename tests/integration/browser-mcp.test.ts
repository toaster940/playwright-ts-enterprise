import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { projectRoot } from '../../src/tools/registry.js';

test('official browser MCP navigates a real Chromium page', { timeout: 60_000 }, async () => {
  const http = createServer((_req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end(
      '<html lang="en"><title>MCP local proof</title><body><h1>Browser MCP connected</h1></body></html>',
    );
  });
  await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  const client = new Client({ name: 'browser-integration', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: 'node',
    args: [resolve(projectRoot, 'scripts/launch.cjs'), 'browser', '--allowed-origins', origin],
    cwd: projectRoot,
    stderr: 'pipe',
  });
  try {
    await client.connect(transport);
    const tools = (await client.listTools()).tools;
    assert.ok(tools.some((tool) => tool.name === 'browser_navigate'));
    const result = await client.callTool({ name: 'browser_navigate', arguments: { url: origin } });
    assert.ok(!result.isError, JSON.stringify(result.content));
    assert.match(JSON.stringify(result.content), /MCP local proof/);
    const content = result.content as { type: string; text?: string }[];
    const snapshot = content
      .map((item) => item.text ?? '')
      .join('\n')
      .match(/\[Snapshot\]\(([^)]+)\)/)?.[1];
    assert.ok(snapshot, 'Browser MCP returns a DOM snapshot artifact');
    const snapshotFile = resolve(projectRoot, snapshot);
    assert.ok(snapshotFile.startsWith(resolve(projectRoot, 'artifacts') + sep));
    assert.match(await readFile(snapshotFile, 'utf8'), /Browser MCP connected/);
    await client.callTool({ name: 'browser_close', arguments: {} });
  } finally {
    await client.close();
    await new Promise<void>((resolve, reject) =>
      http.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
