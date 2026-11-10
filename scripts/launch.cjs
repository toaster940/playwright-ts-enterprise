// This launcher intentionally remains compatible with old system Node installations.
const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { homedir } = require('node:os');
const { resolve, dirname, delimiter } = require('node:path');
const root = resolve(__dirname, '..');
let node = process.execPath;
if (Number(process.versions.node.split('.')[0]) < 24) {
  const bundled = resolve(
    homedir(),
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe',
  );
  if (!existsSync(bundled)) {
    process.stderr.write('Node.js 24 LTS is required. Install it and retry.\n');
    process.exit(1);
  }
  node = bundled;
}
const modes = {
  mcp: ['--import', 'tsx', 'src/mcp/server.ts'],
  browser: ['scripts/browser-mcp.mjs'],
  authoring: [
    'node_modules/@playwright/test/cli.js',
    'run-test-mcp-server',
    '--config',
    'playwright.config.ts',
  ],
};
if (!Object.hasOwn(modes, process.argv[2])) {
  process.stderr.write('Choose mcp, browser or authoring\n');
  process.exit(1);
}
const child = spawn(node, [...modes[process.argv[2]], ...process.argv.slice(3)], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
  shell: false,
  env: { ...process.env, PATH: dirname(node) + delimiter + process.env.PATH },
});
child.on('error', (error) => {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
