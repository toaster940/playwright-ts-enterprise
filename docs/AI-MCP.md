# Embedded agent and MCP

## Repository MCP server

`npm run mcp` starts a stdio server. It supports the actual MCP handshake, tool discovery/calls, one feature resource and one failure-triage prompt. stdout is exclusively JSON-RPC; startup diagnostics go to stderr.

| Tool           | Arguments              | Behavior                                                         |
| -------------- | ---------------------- | ---------------------------------------------------------------- |
| `list_tests`   | `{ "suite": "api" }`   | Lists real tests with a 30-second limit                          |
| `run_tests`    | `{ "suite": "smoke" }` | Runs tests with a 180-second limit and returns exit code/output  |
| `read_summary` | `{}`                   | Reads `artifacts/summary.json`, or explicitly reports it missing |

Valid suites: `smoke`, `api`, `ui`, `bdd`. The BDD option discovers and executes native Cucumber features. Unknown tools, extra properties and arbitrary shell strings are rejected. Subprocesses use argument arrays with `shell: false`; output is bounded. Concurrent test commands from the same server process are rejected. Separate server processes still require separate checkouts/output directories. The subprocess receives no `OPENAI_API_KEY`.

## Connecting a client

Open **this subfolder** as the VS Code workspace; `.vscode/mcp.json` supplies the repository, browser and official test-authoring servers. Each uses `scripts/launch.cjs`, which automatically selects the bundled Node 24 on this Windows host when system Node is older. The generic `mcp.config.example.json` needs only your absolute project path. The launcher resolves its own working directory and writes diagnostics only to stderr.

The official Playwright browser MCP supports navigation, accessible snapshots, clicks and browser inspection independently of repository test execution. Start `npm run app` before browsing the demo at `http://127.0.0.1:4173`. Its configured origin allowlist reduces accidental navigation; it is not a network security boundary and does not constrain redirects. Keep the server local and use synthetic data.

For official test-authoring agents, run `npm run agents:init` after upgrading Playwright. This installs the vendor-maintained planner/generator/healer prompt definitions and test MCP wiring. Use `tests/seed.spec.ts` and `specs/task-lifecycle.md` as input. Review generated changes and keep assertions meaningful; a skipped failing test is not a product fix.

## Live embedded agent

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` and `OPENAI_MODEL` to a model available to your API project.
3. Run `npm run agent -- "Run smoke tests and summarize the evidence"`.

`runAgent` sends strict function schemas via Responses, executes a validated tool call, feeds its output back, and repeats up to `AGENT_MAX_STEPS`. It preserves all supported model output items, including reasoning, in the next request. Network timeout is 45 seconds with one retry; tool execution also has a timeout. Every event is saved locally. A step-limit failure exits nonzero. An agent's final prose is advisory; test status comes from tool results and reports.

`npm run agent:demo` exercises the same tools in a fixed list → smoke run → summary sequence without calling an LLM. It exits nonzero if the suite fails. This mode proves the local plumbing; it does not validate live model reasoning or credentials.

`npm run test:integration` verifies real stdio JSON-RPC transport, MCP discovery/calls/resources/prompts, invalid-input rejection, and the SDK's Responses loop against a local fake model endpoint. It makes no paid model calls. `npm run test:smoke` verifies UI/API behavior; the MCP browser integration test also navigates a real browser.
