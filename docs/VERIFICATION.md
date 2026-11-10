# Local verification

Verified on **29 October 2026**, Windows, Node.js **24.22.1**, Playwright **1.64.1**.

`./run.ps1 test:all`: **164 passed, 13 intentional browser-specific skips, zero failures**. No retries were enabled.

| Project       | Passed | Skipped |
| ------------- | -----: | ------: |
| setup         |      1 |       0 |
| api           |     11 |       0 |
| chromium      |     33 |       0 |
| firefox       |     29 |       4 |
| webkit        |     29 |       4 |
| mobile-chrome |     32 |       1 |
| mobile-safari |     29 |       4 |

- TypeScript strict checks, ESLint with zero warnings, and Prettier checks passed.
- React component tests: **2 passed**, including real mounting, props, callback, update and unmount.
- Integration tests: **4 passed**, including both MCP transports, real browser navigation and snapshot artifact, real API-suite execution through MCP, invalid tool inputs, and the Responses tool loop against a local fake model.
- Offline embedded-agent demo: discovered smoke tests, executed **3 passing tests**, and read the actual summary; exit code **0**.
- Both package manifests use exact dependency versions matching their lockfiles. Browser binaries are installed on this host.

The full-matrix HTML report is preserved at `artifacts/verification/full-matrix-report/index.html`, with JSON/JUnit evidence in the same directory. `npm run report` opens a copy of this full-matrix report. The final smoke/agent checks were run after the matrix; its report and summary were restored afterward so the default report shows the comprehensive run. Agent events are preserved in `artifacts/verification/offline-agent-run.json`. Artifacts remain ignored by Git.

Skips cover Chromium-only clipboard/PDF/WebMCP examples and noncanonical visual projects. All examples execute on a supported project. Mobile projects are browser emulation. The Windows Chromium screenshot was inspected and compared without updating it during the final run.

Live OpenAI requests were not made because no API key was supplied. The client/tool feedback loop was tested locally without a paid provider call. Remote GitHub Actions and Docker execution were not run on this host. See `FEATURES.md` for specialized integrations outside the supplied scope.

## Cucumber and codegen follow-up

- Cucumber.js **13.3.0** is pinned and integrated with the existing Playwright page/API classes.
- **21 scenarios and 137 steps passed on each of Chromium, Firefox and WebKit** (63 scenario executions total), including the imported codegen scenario.
- The complete integration suite now has **7 passing checks**, covering recording plans, AST conversion, unsupported-input rejection, model feedback and both MCP servers. MCP discovery resolves the actual BDD scenarios.
- Shared MCP/agent tool execution with `suite: "bdd"` ran all **21 scenarios successfully** and returned their passing summary.
- The original native UI/API smoke suite passed **3 tests** after installing Cucumber.
- The actual interactive Playwright recorder was launched, wrote `recordings/codegen-verification.spec.ts`, and was closed after verifying its TypeScript output and authenticated storage configuration. The checked-in example exercises conversion and recorded assertions end to end.
- Failure screenshot, trace and video retention were exercised during a failed Cucumber assertion before that runner-specific assertion was corrected; subsequent runs passed.
- Fresh managed-server startup, changed BASE_URL and owned-server cleanup were checked on port **4174**, by replaying the imported scenario.
- Per-browser BDD evidence is saved in `artifacts/verification/bdd-chromium`, `bdd-firefox` and `bdd-webkit`; tool-execution evidence is in `bdd-tool-run.json`. The latest Cucumber report is `artifacts/cucumber/report.html`.
- TypeScript and ESLint checks passed. The CI Cucumber matrix is configured; remote CI has not been executed here.

See [Cucumber and codegen usage](CUCUMBER-CODEGEN.md) for commands and the importer's supported subset.

## UI component follow-up

- Added **24 native Playwright cases** and **24 Cucumber component scenarios**, plus a working component lab linked from the demo home page.
- All **120 unique component/browser combinations** (24 cases across Chromium, Firefox, WebKit, mobile Chrome and mobile Safari) have passing final results. This combines the initial matrix with focused reruns after correcting WebKit date-range enforcement and initial Arrow-Up autocomplete navigation.
- The broader initial selection contained 141 cases: 134 passed, 4 intentional visual-project skips and 3 failures. Two date-validation failures were corrected and verified across all five projects (16 passing focused checks including setup). The existing Firefox accessibility context-teardown timeout passed in isolation (2 checks including setup). The consolidated latest evidence is **137 passed / 4 intentional skips**, not a single new full-matrix run.
- Cucumber after the fixes: complete Chromium suite **45 scenarios / 268 steps passed**; Firefox and WebKit component selections each **24 scenarios / 131 steps passed**.
- Native and component-lab axe scans, responsive layout checks and the existing Chromium visual baseline were verified. A desktop screenshot of the lab was inspected.
- TypeScript, ESLint and Prettier checks passed. Existing CI discovery automatically includes the new tests and features; remote CI was not executed here.
- Evidence is under `artifacts/verification/ui-components/`, including `final-native-summary.json`, each source run, per-browser Cucumber results and `lab-desktop.png`.

See [UI component coverage and commands](UI-COMPONENTS.md).
