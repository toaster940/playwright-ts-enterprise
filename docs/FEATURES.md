# Executable feature map

Versions are pinned in package.json/package-lock.json. Newest examples are verified against installed Playwright 1.64.1 APIs.

| Capability                                                                                                          | Working example                                                |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Strict TypeScript, validated environment                                                                            | `tsconfig.json`, `src/config/env.ts`                           |
| Test-scoped fixtures, cleanup, parallel data                                                                        | `tests/fixtures.ts`                                            |
| Setup dependencies and stored API login                                                                             | `tests/auth.setup.ts`, `playwright.config.ts`                  |
| Page objects, role/label locators, steps, attachments                                                               | `tests/ui/tasks.spec.ts`                                       |
| UI CRUD, persistence and keyboard navigation                                                                        | `tests/ui/tasks.spec.ts`                                       |
| API CRUD, response schemas, invalid data, auth, 404, malformed JSON                                                 | `tests/api/tasks.spec.ts`                                      |
| Concurrent API requests, polling, context isolation                                                                 | `tests/api/tasks.spec.ts`                                      |
| New API request cookie methods                                                                                      | `tests/api/tasks.spec.ts`                                      |
| Hybrid API seed → UI → API verification                                                                             | `tests/ui/tasks.spec.ts`                                       |
| Chromium/Firefox/WebKit + Pixel/iPhone emulation                                                                    | `npm run test:all`                                             |
| 1.64 optional default projects, random ordering                                                                     | config, `npm run test:shuffle`                                 |
| 1.64 `locator.within()` and modal dialogs                                                                           | `tests/ui/tasks.spec.ts`                                       |
| Locator overlay handlers                                                                                            | `tests/ui/tasks.spec.ts`                                       |
| Route fulfill, fetch/modify, errors                                                                                 | `tests/ui/network.spec.ts`                                     |
| HAR fixture replay and recording/replay                                                                             | `tests/ui/network.spec.ts`                                     |
| WebSocket routing                                                                                                   | `tests/ui/network.spec.ts`                                     |
| Offline/online contexts, `expect.toPass()`                                                                          | `tests/ui/network.spec.ts`                                     |
| Virtual clock, timer fast-forward, fixed date                                                                       | `tests/ui/browser-features.spec.ts`                            |
| In-memory file upload + real download inspection                                                                    | `tests/ui/browser-features.spec.ts`                            |
| JavaScript dialogs, popups, iframe locators                                                                         | `tests/ui/browser-features.spec.ts`                            |
| Open shadow DOM locators + 1.64 shadow serialization                                                                | `tests/ui/browser-features.spec.ts`                            |
| HTML drag/drop                                                                                                      | `tests/ui/browser-features.spec.ts`                            |
| Geolocation, browser permissions, clipboard                                                                         | `tests/ui/browser-features.spec.ts`                            |
| Responsive viewport, dark/reduced-motion media                                                                      | `tests/ui/browser-features.spec.ts`                            |
| Browser API init scripts, multi-user contexts                                                                       | `tests/ui/browser-features.spec.ts`                            |
| Axe WCAG 2.1 AA, report attachment                                                                                  | `tests/ui/accessibility.spec.ts`                               |
| ARIA snapshots and accessible-name assertions                                                                       | accessibility and task tests                                   |
| 1.64 AI snapshots + `page.getByRef()`                                                                               | `tests/ui/accessibility.spec.ts`                               |
| Visual comparison with checked-in Windows baseline                                                                  | `tests/ui/visual.spec.ts`                                      |
| 1.64 test locks                                                                                                     | `tests/ui/latest.spec.ts`                                      |
| 1.64 experimental WebMCP tool registration and call                                                                 | `tests/ui/latest.spec.ts`, `src/demo/public/app.js`            |
| Virtual WebAuthn/passkeys + signature counter/state                                                                 | `tests/ui/latest.spec.ts`                                      |
| IndexedDB storage-state capture and restore                                                                         | `tests/ui/storage.spec.ts`                                     |
| Chromium PDF and tracing chunks                                                                                     | `tests/ui/diagnostics.spec.ts`                                 |
| HTML, JSON, JUnit, blob, custom reporters                                                                           | config and `src/reporters/summary.ts`                          |
| Failure screenshot/video/trace, newer fps setting                                                                   | config                                                         |
| Tags, annotations, CI retries, fail-on-only                                                                         | task tests and config                                          |
| Shards and merged reports                                                                                           | `.github/workflows/playwright.yml`                             |
| Inspector, UI mode, codegen, trace viewer                                                                           | package scripts                                                |
| Custom MCP tools, resource, prompt                                                                                  | `src/mcp/server.ts`, integration test                          |
| Official browser MCP with real navigation smoke                                                                     | `tests/integration/browser-mcp.test.ts`                        |
| Embedded Responses tool loop + fake-model test                                                                      | `src/agent/`, `tests/integration/agent.test.ts`                |
| Offline agent tool demo                                                                                             | `npm run agent:demo`                                           |
| Official planner/generator/healer definitions                                                                       | `.github/agents/`, generated by `agents:init`                  |
| Isolated React component testing                                                                                    | `component-tests/` (own experimental runner version)           |
| Cucumber feature files, typed steps, World, hooks, tags, outlines, data tables and doc strings                      | `features/`, `cucumber/`, `npm run test:bdd`                   |
| Cucumber Chromium/Firefox/WebKit profiles and reports                                                               | `cucumber.mjs`, CI Cucumber matrix                             |
| Managed authenticated codegen with output and device support                                                        | `scripts/codegen.ts`                                           |
| Codegen-to-Cucumber AST import with preserved assertions                                                            | `scripts/import-codegen.ts`, `features/generated/`             |
| BDD discovery/execution via MCP and embedded agent                                                                  | `suite: "bdd"` in the shared tool registry                     |
| Native/custom dropdowns, multi-select, dependent fields and autocomplete                                            | `tests/ui/components.spec.ts`, `features/ui-dropdowns.feature` |
| Native date, custom calendar, disabled dates, leap day, date-range validation                                       | `src/pages/components-page.ts`, `features/ui-calendar.feature` |
| Tabs, accordions, switches, radio/checkbox, slider, spinbutton, tooltip, notifications, menu/modal, table and forms | `features/ui-components.feature`, `docs/UI-COMPONENTS.md`      |

## Boundaries

This is a broad working web/API automation reference, not exhaustive coverage of every Playwright API. Mobile projects emulate browsers, not physical Android/iOS devices. Clipboard and PDF examples are Chromium-only; WebMCP explicitly enables its experimental Chromium flag. Screenshot checks use one canonical desktop project. Platform-specific skips explain their reason.

Electron, Android-device automation, WebView2, browser extensions, proxy infrastructure, native device farms, remote grid vendors and enterprise SSO require their own applications or infrastructure and are not provisioned here. The official browser MCP origin filter is not a security sandbox. React component testing remains an experimental, independently published package and uses a separate lockfile/configuration.

Live provider reasoning requires user-supplied credentials and is not part of deterministic local verification. No self-healing hides test failures or silently updates expectations.
