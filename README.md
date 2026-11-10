# Playwright TypeScript Quality Lab

A runnable automation reference with a local web app, typed API tests, browser tests, Cucumber features, two MCP servers, and an embedded QA agent. Playwright **1.64.1**, TypeScript strict mode, Node.js **24 LTS**. No external test website or API key is required for normal tests.

Verification history and current results are recorded in [verification evidence](docs/VERIFICATION.md). See the [feature map](docs/FEATURES.md) and [UI component examples](docs/UI-COMPONENTS.md).

## Start here

From this directory on Windows:

```powershell
.\run.ps1 setup       # install locked dependencies and Chromium/Firefox/WebKit
.\run.ps1 test        # API + Chromium; starts/stops the local app automatically
.\run.ps1 test:all    # API + all desktop/mobile projects
.\run.ps1 report      # open HTML report
.\run.ps1 agent:demo  # scripted offline agent demo executing actual smoke tests
```

The launcher uses Node 24 if installed, or the Codex bundled runtime when the machine has an older Node. If PowerShell execution policy blocks the script, run `powershell -ExecutionPolicy Bypass -File .\run.ps1 test` for that process. It does not change your machine's execution policy.

With Node.js 24 LTS on your PATH, standard npm commands work on Windows, macOS and Linux:

```sh
npm ci
npx playwright install chromium firefox webkit
npm test
npm run check
npm run test:all
```

On Linux install browser OS libraries with `npx playwright install --with-deps chromium firefox webkit`. Screenshot baselines are platform-specific: this repository includes the verified Windows Chromium baseline. On another OS, review and create its baseline with `npm run test:visual:update` before the first full run. Linux CI runs functional tests and Windows CI runs the visual comparison.

## UI component examples

The demo home page links to a dedicated UI component lab. It includes native/custom dropdowns, date/calendar selection, date ranges, common controls, tabs, notifications, menus, validation and a data table. Run `test:ui:components` or `test:bdd:components`; see [component coverage and usage](docs/UI-COMPONENTS.md).

## Cucumber and codegen

Run `.\run.ps1 test:bdd` for Gherkin features and TypeScript step definitions. Record with `.\run.ps1 codegen --name task-review`, import with `.\run.ps1 codegen:import --input recordings/task-review.spec.ts --name task-review`, then run the generated feature. See [Cucumber and codegen guide](docs/CUCUMBER-CODEGEN.md) for profiles, tags, hooks, reports, examples and import boundaries.

## Commands

| Command (`npm run …` or `.\run.ps1 …`)                | Purpose                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `test`                                                | Default API + Chromium suite                                              |
| `test:all`                                            | API + Chromium, Firefox, WebKit, Pixel 7, iPhone 13                       |
| `test:api`, `test:ui`, `test:smoke`                   | Focused runs                                                              |
| `test:headed`, `test:debug`, `test:interactive`       | Headed, Inspector, UI mode                                                |
| `test:shuffle`                                        | Randomize order; use `npm test -- --shuffle 42` to reproduce              |
| `test:integration`                                    | MCP JSON-RPC handshake and mocked Responses tool loop                     |
| `typecheck`, `lint`, `format:check`, `check`          | Quality gates                                                             |
| `test:visual:update`                                  | Deliberately approve visual baselines after reviewing diffs               |
| `app`, `codegen`                                      | Start demo manually, or managed authenticated recorder                    |
| `report`, `trace`                                     | Report or `npm run trace -- path/to/trace.zip`                            |
| `mcp`, `mcp:browser`                                  | Repository tools or official browser MCP over stdio                       |
| `agent:demo`, `agent`                                 | Offline real-tool demo or live model agent                                |
| `agents:init`                                         | Generate official Playwright planner/generator/healer definitions         |
| `test:bdd`, `test:bdd:smoke`, `test:bdd:api`          | Cucumber features, tag profiles and API-only scenarios                    |
| `test:bdd:firefox`, `test:bdd:webkit`, `test:bdd:dry` | Cross-browser BDD or step-definition validation                           |
| `codegen:import`, `codegen:plan`, `codegen:raw`       | Import recordings into Cucumber, inspect arguments or use full native CLI |
| `test:ui:components`, `test:ui:components:all`        | Dropdown, date picker and common UI tests on one/all browser projects     |
| `test:bdd:components`                                 | Cucumber component scenarios (`@components`)                              |

Use `npm test -- --project=firefox`, `npm test -- --grep @a11y`, `npm test -- --last-failed`, `npm test -- --repeat-each=3` and `npm test -- --shard=1/2` for runner workflows. Pass extra flags through the launcher too: `.\run.ps1 test --project=firefox`.

## Structure and design

```text
src/
  demo/          Local Express app, browser lab, task API
  config/        Validated environment configuration
  pages/         Semantic page objects
  api/           Typed API client + Zod response contracts
  reporters/     Compact JSON summary for humans and agents
  tools/         Shared, validated test-tool registry
  mcp/           Custom MCP stdio server (SDK)
  agent/         Bounded Responses API tool loop + offline demo
features/        Cucumber Gherkin features and generated scenarios
cucumber/        Step definitions, World, hooks and imported recording actions
recordings/      Ignored raw recordings plus checked-in example inputs
tests/
  api/           Positive, negative, parallel and contract examples
  ui/            Browser features, network, accessibility, visuals, latest APIs
  integration/   Actual MCP client/server and local fake model tests
  data/          Checked-in HAR fixture
  __screenshots__/  Reviewed OS/project-specific visual baselines
docs/            Feature map, architecture and AI/MCP setup
specs/           Human-readable seed plan for generated tests
.github/         CI workflow and generated Playwright agents
```

Test data has a UUID namespace per test. Fixtures clean up through the API; tests can run in parallel or shuffled order. Authentication uses a setup dependency and ignored storage state; API tests authenticate their own request context. UI/API tests share a namespace for hybrid scenarios. The demo API requires authentication and is intended only for local examples; it is not a production authorization implementation.

HTML, JSON, JUnit and compact summary reports are produced on every run. Failed tests retain traces, videos and screenshots. CI adds blob reports and merges shards. Reports, auth state, credentials and `.env` are ignored. Do not run two test commands simultaneously against the same output directory.

## AI and MCP

See [AI & MCP setup](docs/AI-MCP.md). The offline demo is explicitly scripted, runs real tests, and needs no key. The live agent uses the OpenAI Responses API, supports tool-call feedback, validates arguments, preserves reasoning output, and writes `artifacts/agent-run.json`.

```powershell
Copy-Item .env.example .env
# Set OPENAI_API_KEY and a model available to your API project in .env.
.\run.ps1 agent "Run API tests and explain any failures"
```

Live AI needs an API key and incurs provider usage. It is not invoked by CI. Agent and MCP tools accept only `smoke`, `api`, `ui`, or `bdd` suites. They do not edit source or execute model-generated shell commands. Tool output can be sent to the configured model; use synthetic data in this reference project.

## CI, Docker and adapting the project

The workflow in `.github/workflows/playwright.yml` is ready when **this directory is the repository root**. The enclosing QA-AUTOMATION repository also has a workflow pointing at this subfolder. CI runs lint/type/format/integration gates, browser/mobile tests across two shards, Windows visual comparison, then merges reports. No remote CI execution is claimed by local verification.

```sh
docker build -t quality-lab .
docker run --rm --ipc=host quality-lab
```

Docker runs functional tests with the matching official Playwright image. Docker execution requires Docker and has not been exercised on this Windows host.

Copy `.env.example` to `.env` to change the local port: change **both** `PORT` and `BASE_URL`. The checked-in HAR is bound to the default port; the recording/replay example uses the configured URL. The supplied tests deliberately target the local demo app. To test your real product, replace page objects, endpoints, auth and data fixtures; setting `BASE_URL` alone does not adapt these examples.

See [feature coverage and boundaries](docs/FEATURES.md) and [architecture](docs/ARCHITECTURE.md). This is broad, executable coverage of current web-testing workflows, not every method or specialized Playwright integration.

## Official references

- [Playwright release notes](https://playwright.dev/docs/release-notes)
- [Playwright Test agents](https://playwright.dev/docs/test-agents)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
