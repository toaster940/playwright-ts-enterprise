# Cucumber and recorded-test ingestion

## Run feature files

This project uses **Cucumber.js 13.3.0** with Playwright's browser/API library. Feature files are executed by Cucumber's own runner, with TypeScript step definitions and a fresh World for each scenario. The existing Playwright Test suites remain available, including runner-specific visual comparisons and snapshots.

```powershell
.\run.ps1 test:bdd             # all features, two parallel workers, Chromium
.\run.ps1 test:bdd:smoke       # @smoke scenarios
.\run.ps1 test:bdd:api         # API-only scenarios; no browser is launched
.\run.ps1 test:bdd:ui          # UI and hybrid scenarios
.\run.ps1 test:bdd:firefox     # all features on Firefox
.\run.ps1 test:bdd:webkit      # all features on WebKit
.\run.ps1 test:bdd:headed      # one worker with a visible browser
.\run.ps1 test:bdd:dry         # resolve all steps without executing scenarios
```

With Node 24 on PATH, use `npm run` with the same script names. Arbitrary Cucumber CLI options are forwarded:

```sh
npm run test:bdd -- --tags "@smoke and @ui"
npm run test:bdd -- --name "Replay imported-task-flow"
npm run test:bdd -- --parallel 1 --retry 1
```

The wrapper starts the local demo server, waits for readiness and stops only the server it owns. A server already running at the configured local URL is reused. `PORT` and `BASE_URL` must agree. Avoid concurrent independent suite commands sharing this server/report directory; use separate checkouts and ports for independent runs. Cucumber's own parallel workers share the managed server safely through unique scenario namespaces.

## Structure

```text
features/                       Gherkin behavior specifications
  authentication.feature        Login and authorization, Scenario Outline
  task-api.feature              CRUD, contracts, data tables, JSON doc strings
  task-ui.feature               Browser lifecycle, settings, outline examples
  hybrid.feature                API seed → UI completion → API verification
  browser-lab.feature           Clock controls and accessible structure
  network.feature               Route mocking and service errors
  generated/                    Features created from codegen recordings
cucumber/
  support/world.ts              Scenario state, lazy browser, API/POM reuse
  support/hooks.ts              Setup, failure evidence and cleanup
  steps/*.steps.ts              Given / When / Then definitions
  recordings/                   Typed actions imported from recordings
cucumber.mjs                    ESM profiles, tags, parallelism and formatters
scripts/cucumber.ts             Managed service + Cucumber invocation + summary
```

The World reuses `TaskClient` and `WorkspacePage`. Scenarios get independent request contexts, cookies, browser contexts and UUID data. Browser instances are reused only within a worker; API-only scenarios do not start a browser. `Before` creates the scenario request context; `AfterStep` captures failed UI steps; `After` retains failure traces/videos and cleans up; `AfterAll` closes each worker browser. Steps use normal functions so Cucumber can bind `this` to the typed World.

Each feature demonstrates executable behavior, including tags, Background, Scenario Outline/Examples, data tables and doc strings. There are no pending placeholder steps. Failed and undefined scenarios produce nonzero exit codes. An empty selection also fails to prevent an accidental empty green run.

Reports go to `artifacts/cucumber/`: **HTML**, **JSON**, **JUnit XML**, **Cucumber message NDJSON**, and a compact **summary.json**. Failed UI scenarios retain `failure.png`, `trace.zip` and video under `scenarios/`; screenshots are embedded in the Cucumber report. Successful videos/traces are discarded. Discovery reports use a separate `discovery/` directory. `artifacts/summary.json` always reflects the most recently executed runner so MCP and the agent can read BDD results too.

Some Playwright matchers require the Playwright Test runner. In Cucumber, the accessibility doc string is compared against `locator.ariaSnapshot()` with polling; the native suite retains `toMatchAriaSnapshot()` and screenshot baseline assertions. Cucumber reports and hooks are configured in `cucumber.mjs`; it does not inherit `playwright.config.ts` settings automatically.

## UI component scenarios

`features/ui-dropdowns.feature`, `ui-calendar.feature` and `ui-components.feature` add 24 executable scenarios for native/custom selectors, date pickers and other common widgets. Run `test:bdd:components` or filter by `@components`, `@calendar` or `@dropdown`. The shared `ComponentsPage` is also used by the native tests. See [UI component examples](UI-COMPONENTS.md).

## Record with codegen

A basic `codegen` shortcut existed in the original project. It now has managed app startup, authenticated recording, file output, device support and an import command.

```powershell
.\run.ps1 codegen --name task-review
# Use the browser and Inspector. Add text/visibility/value assertions.
# Close the recorder when finished.

.\run.ps1 codegen:import --input recordings/task-review.spec.ts --name task-review
.\run.ps1 test:bdd --name "Replay task-review"
```

Recordings are saved under ignored `recordings/*.spec.ts`. By default, the wrapper logs into the demo API, saves isolated auth/localStorage under ignored `playwright/.auth/`, and starts Playwright's actual interactive recorder using `--target=playwright-test`. The recording's data is cleaned up when the managed session finishes. The source output is preserved after closing the recorder.

Other modes:

```powershell
.\run.ps1 codegen:guest --name login-flow
.\run.ps1 codegen --name mobile-flow --device "Pixel 7"
.\run.ps1 codegen:plan --name planned-flow   # inspect arguments without opening UI
```

`codegen:raw` forwards the complete official Playwright CLI for advanced options and external applications. Start your target app separately in this mode, for example `npm run app` then `npm run codegen:raw -- --browser=firefox http://127.0.0.1:4173`.

## How ingestion works

Playwright codegen emits Playwright code. This repository's AST importer turns its supported sequential actions and assertions into:

1. `features/generated/<name>.feature`, with one Gherkin step per action/assertion.
2. `cucumber/recordings/<name>.ts`, containing the original typed Playwright actions and assertions.
3. Existing generic definitions in `cucumber/steps/recording.steps.ts` execute those actions inside the normal isolated World.

The importer parses TypeScript without executing the source, preserves assertions, rewrites same-origin navigation relative to `BASE_URL`, and replaces recorded storage state with scenario-owned API login. Use `--guest` on the import command for a recording that deliberately performs its own login. It refuses to overwrite existing generated files and requires at least one assertion. Generated TypeScript is formatted automatically.

The checked-in example was imported using:

```sh
npm run codegen:import -- --input recordings/examples/task-lifecycle.spec.ts --name imported-task-flow
npm run test:bdd -- --name "Replay imported-task-flow"
```

Those generated outputs are already present and executable; choose another name when trying the import command again.

The converter supports common locator actions and assertions in **one standard `test(..., async ({ page }) => { ... })`**. Popup/download variables, loops, conditionals, custom JavaScript, multi-page fixtures and device/viewport `test.use()` configuration require manual refactoring. Unsupported constructs fail with a clear error; they are not silently dropped. Device recording itself works, but its device options should be retained in a deliberate scenario/profile rather than automatically discarded during import.

Generated steps describe the recorded mechanics. Review them and replace technical action names with business language and reusable page-object operations as the scenario matures. Recordings can contain entered values; keep real credentials and sensitive data out of source control.

## CI, MCP and agent

CI runs native Cucumber in a Chromium/Firefox/WebKit matrix and uploads separate reports. Both the enclosing repository and standalone subfolder workflows include the BDD job. These workflow updates have been checked locally but not run remotely.

The existing `list_tests` and `run_tests` MCP tools now accept `{ "suite": "bdd" }`. Discovery uses a real Cucumber dry run. Execution runs the actual feature files and produces the same summary shape used by the embedded agent. For example: `npm run agent -- "Run the bdd suite and summarize failures"` (live model credentials required).

## References

- [Cucumber.js configuration](https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md)
- [Cucumber hooks](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/hooks.md)
- [Cucumber World](https://github.com/cucumber/cucumber-js/blob/main/docs/support_files/world.md)
- [Official Playwright codegen](https://playwright.dev/docs/codegen)
