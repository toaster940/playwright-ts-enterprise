# Dropdowns, calendars and common UI components

Open **UI component lab** from the demo home page, or visit `http://127.0.0.1:4173/components.html` while the app is running. All examples are local and interactive. They use native HTML controls and small custom widgets so the test patterns can be adapted to your product's UI library.

## Run the examples

```powershell
.\run.ps1 test:ui:components             # 24 native tests on Chromium
.\run.ps1 test:ui:components:all         # desktop + mobile browser projects
.\run.ps1 test:bdd:components            # 24 Cucumber component scenarios
.\run.ps1 test:bdd:components:firefox
.\run.ps1 test:bdd:components:webkit
```

With Node.js 24 on PATH, use `npm run` with the same script names. Filter further with standard runner options:

```sh
npm run test:ui:components -- --grep "calendar"
npm run test:bdd -- --tags "@components and @calendar"
npm run test:bdd -- --tags "@components and @dropdown"
```

Both runners start the demo app automatically when necessary. The existing `test:all`, normal UI project and CI matrix discover the new native tests. Cucumber's existing browser profiles and CI matrix discover the new `.feature` files.

## Coverage

| Component                        | Meaningful behaviors covered                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Native single-select dropdown    | Select by value, label and index; unavailable options                                                                                          |
| Native multi-select              | Choose multiple values and clear the selection                                                                                                 |
| Dependent dropdowns              | Country updates region choices; stale selections reset                                                                                         |
| Searchable combobox              | Filter options, mouse selection, active option, keyboard selection, Escape and no matches                                                      |
| Native date input                | Fill ISO date, required/min/max validation and error recovery                                                                                  |
| Custom calendar dialog           | Select visible dates, month/year controls, year boundary, leap day, disabled weekends, keyboard navigation, cancellation and focus restoration |
| Date range                       | Reject reversed dates; correct and apply a valid range                                                                                         |
| Checkbox, radio group and switch | Checked state, exclusive selection and toggle state                                                                                            |
| Range slider                     | Keyboard-driven values and displayed feedback                                                                                                  |
| Numeric spinbutton               | Minimum/maximum limits and increment/decrement buttons                                                                                         |
| Tabs                             | Visible panel, selected tab, arrow keys and Home                                                                                               |
| Accordion                        | Expand/collapse through keyboard and mouse                                                                                                     |
| Toast notification               | Feedback, manual dismissal and virtual-clock expiration                                                                                        |
| Tooltip                          | Focus shows help; Escape hides it                                                                                                              |
| Menu and confirmation dialog     | Keyboard movement, Escape, cancellation and confirmation                                                                                       |
| Data table                       | Filtering, empty results, sorting, pagination, row selection, mixed checkbox state and selection across pages                                  |
| Registration form                | Required fields, invalid email, terms acceptance and recovery                                                                                  |
| Accessibility and layout         | Automated axe WCAG checks and horizontal-overflow checks across browser/mobile projects                                                        |

The calendar starts at **October 2026** and supports **2026–2028**. This fixed range makes its month/year/leap-day cases repeatable; it does not depend on the machine's current date. Weekends are intentionally unavailable. Date arithmetic uses UTC to avoid locale/timezone drift.

## Source map

- `src/demo/public/components.html`, `components.css`, `components.js`: working UI.
- `src/pages/components-page.ts`: reusable `ComponentsPage` operations and locators.
- `tests/fixtures.ts`: native `components` fixture.
- `tests/ui/components.spec.ts`: 24 Playwright TypeScript cases.
- `features/ui-dropdowns.feature`: dropdowns, autocomplete, Scenario Outline and multi-select DataTable.
- `features/ui-calendar.feature`: native/custom date selection and invalid ranges.
- `features/ui-components.feature`: other controls and validation.
- `cucumber/steps/components.steps.ts`: typed definitions reusing the same page object.

## Adapting these patterns

Use `locator.selectOption()` for real HTML `<select>` controls. For custom dropdowns, interact with their combobox and visible options, then assert selected value and expanded state. Do not replace user interaction with JavaScript assignments to the widget's internal state.

For a native date input, `fill('2026-11-18')` is portable across supported browsers. Native operating-system calendar popups are platform-specific; the custom calendar example demonstrates actual clickable calendar cells, accessible names, month/year navigation, disabled dates and keyboard behavior.

The page object chooses dates through the visible month/year selectors and date button, and verifies the resulting ISO value. Native tests additionally exercise calendar navigation and disabled-state protection directly. Date-range errors and registration errors are verified before correction, so the tests do not only cover happy paths.

Tests use roles, labels, auto-waiting assertions and real input events. The toast expiration uses Playwright's clock rather than fixed sleeps. Table and form scenarios get fresh browser contexts and do not depend on a previous test's choices.

These are automation teaching widgets with automated accessibility checks and specific keyboard tests. An axe scan is not a complete assistive-technology audit or a certification of every ARIA interaction.

## Record these controls

Run `codegen --name component-flow`, follow **Open UI component lab**, interact with the widgets, and add Inspector assertions. Standard dropdown selections, fills, clicks and supported assertions can be imported with `codegen:import`. The same conversion boundaries described in [Cucumber and codegen](CUCUMBER-CODEGEN.md) apply.

Official references: [Playwright input actions](https://playwright.dev/docs/input), [WAI-ARIA patterns](https://www.w3.org/WAI/ARIA/apg/patterns/), [date picker dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).

## Verified results

All 120 component/browser combinations have passing final results from the matrix and focused fix checks. Cucumber passed all 24 component scenarios on Chromium, Firefox and WebKit; the complete Chromium BDD suite passed 45 scenarios. [Verification history](VERIFICATION.md) records the initial failures, fixes, reruns and saved evidence.
