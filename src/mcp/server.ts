import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { definitions, executeTool, toolNames } from '../tools/registry.js';

const server = new McpServer({ name: 'quality-lab', version: '1.0.0' });
for (const name of toolNames) {
  const definition = definitions[name];
  server.registerTool(
    name,
    {
      description: definition.description,
      inputSchema: definition.schema,
      annotations: {
        readOnlyHint: name !== 'run_tests',
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (args: unknown) => {
      try {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(await executeTool(name, args)) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            { type: 'text' as const, text: error instanceof Error ? error.message : String(error) },
          ],
        };
      }
    },
  );
}
server.registerResource(
  'feature-catalog',
  'quality-lab://features',
  { mimeType: 'text/markdown' },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'text/markdown',
        text: 'Quality Lab: UI, API, auth state, fixtures, cross-browser/mobile, axe, screenshots, ARIA/AI refs, clocks, HAR, WebSockets, WebMCP, locks, CI sharding. Read docs/FEATURES.md for runnable examples.',
      },
    ],
  }),
);
server.registerPrompt(
  'investigate-failure',
  { description: 'Evidence-driven failure triage' },
  () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Read the latest summary, identify failed tests, run the relevant allowed suite, and report evidence. Do not weaken assertions, skip failures, or edit baselines.',
        },
      },
    ],
  }),
);
await server.connect(new StdioServerTransport());
// stdout belongs exclusively to MCP JSON-RPC. Diagnostics go to stderr.
console.error('Quality Lab MCP server ready');
