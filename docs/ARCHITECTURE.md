# Architecture and extension points

`Playwright runner → fixtures → page objects/API client → local demo server`

`MCP client / embedded agent → validated registry → Playwright subprocess → reports`

- **Configuration:** Zod validates environment variables early. Chromium and API run by default; Firefox, WebKit and mobile are explicit optional projects using the 1.64 project `default` setting.
- **Isolation:** each test gets a UUID namespace in request headers and browser localStorage. The task API stores data per namespace. The fixture cleans it up. Login state is obtained through a project dependency; request-context tests prove cookie isolation.
- **Page layer:** semantic roles and labels, business operations and meaningful assertions. No sleeps, brittle XPath or custom retry loops around clicks.
- **API layer:** status assertions plus Zod contracts, positive/negative CRUD cases, cookie APIs and polling. The browser tests can seed with the API and verify through both layers.
- **Diagnostics:** Playwright owns trace/video/screenshot retention. A custom reporter produces a bounded, agent-readable summary alongside standard reports. Retries are enabled only in CI; rerun logs and failures remain visible.
- **Agent boundary:** model chooses a fixed suite, never arbitrary commands. Tool schemas validate both MCP and Responses inputs. Reports are evidence, not instructions. No automatic source or snapshot rewriting is exposed.
- **CI:** static gates precede test shards; blob artifacts are merged. Visual comparison uses a Windows runner to match the checked-in baseline. Tests remain independent of external services.

To connect a real product, introduce environment-specific auth and data factories, use an environment-owned test account for each parallel worker where required, replace the demo task API with real contracts, and retain teardown. Add secret values to the CI secret store rather than files. Review your system's authorization and cleanup requirements before running against shared environments.

The demo server is a local teaching fixture. Its login credentials are public sample data, sessions are in memory, and namespace headers provide test isolation rather than tenant authorization. Its lifecycle follows the test runner; restarting discards state.
