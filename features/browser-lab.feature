@ui @browser
Feature: Deterministic browser features
  Background:
    Given I am signed in via the API

  Scenario: Timers can be advanced without a real delay
    Given the browser clock is fixed
    And I open the task workspace
    When I fast-forward the timer
    Then the timer is complete

  @a11y
  Scenario: Quality gate exposes meaningful semantics
    Given I open the task workspace
    Then the quality gate has this accessible structure:
      """
      - region "Visual baseline":
        - heading "Quality gate" [level=2]
        - paragraph: UI + API + Accessibility
        - text: Ready to ship
      """
