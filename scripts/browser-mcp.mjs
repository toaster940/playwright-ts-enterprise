import { chromium } from '@playwright/test';
import { fileURLToPath, URL } from 'node:url';

// MCP publishes its own Playwright build. Reuse the installed stable Chromium binary
// explicitly so clients do not require a separate system Chrome or MCP browser download.
const cli = new URL('../node_modules/@playwright/mcp/cli.js', import.meta.url);
process.argv = [
  process.execPath,
  fileURLToPath(cli),
  '--headless',
  '--isolated',
  '--browser',
  'chrome',
  '--executable-path',
  chromium.executablePath(),
  '--allowed-origins',
  'http://127.0.0.1:4173',
  '--output-dir',
  'artifacts/mcp-browser',
  ...process.argv.slice(2),
];
await import(cli.href);
