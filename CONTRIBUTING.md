# Working on this project

Use Node.js 24 and `npm ci`. On this Windows host the supplied `run.ps1` also handles the bundled runtime.

- Add product UI cases under `tests/ui/` using `test` from `tests/fixtures.ts` and semantic locators. Use the `workspace` fixture when a test creates tasks; it wires the namespace and API teardown.
- Add API cases under `tests/api/` using the typed API client. Validate status codes, response contracts and meaningful negative cases.
- Keep tests independent. Use UUID data, API seeding, fixture teardown and Playwright's assertions rather than fixed sleeps.
- Keep secrets in ignored `.env` or your CI secret store. Use synthetic data; artifacts can contain page content and API responses.
- When a visual change is intended, review the diff, run `test:visual:update` on the canonical Windows Chromium project, and commit the baseline with the feature change.
- Run `npm run check`, `npm run test:all`, and `npm run test:components` for changes affecting all layers. Select narrower commands for localized changes. CI provides independent Linux and Windows checks.
- When upgrading dependencies, update exact versions and both lockfiles, install matching browsers, regenerate official agent definitions, and recheck MCP launchers. The experimental component package has an independent version lifecycle.

Failure triage: open the HTML report, inspect the first failing assertion and trace, verify test data/setup, and reproduce with `--project` and `--grep`. Preserve failed assertions. A transient browser process problem should be investigated separately from product behavior; CI retries record both attempts.

For BDD, add `.feature` files under `features/` and typed definitions under `cucumber/steps/`. Run `test:bdd:dry` to validate discovery, then execute the relevant profile. Use the existing World/page/API abstractions. Codegen imports require recorded assertions and must be reviewed before promotion; see `docs/CUCUMBER-CODEGEN.md`.
