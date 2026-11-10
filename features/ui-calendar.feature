@ui @components @calendar
Feature: Date inputs and calendar selection
  Background:
    Given I open the UI component lab

  Scenario: Native date input rejects out-of-range dates and accepts corrections
    When I save reminder date "2025-12-31"
    Then the reminder date is rejected
    When I save reminder date "2026-11-18"
    Then the saved reminder is "2026-11-18"

  Scenario Outline: Choose a working day through calendar controls
    When I select meeting date "<date>" in the calendar
    Then the selected meeting date is "<date>"
    Examples:
      | date       |
      | 2026-11-18 |
      | 2027-01-04 |
      | 2028-02-29 |

  Scenario: Unavailable weekend dates cannot be chosen
    When I open the meeting calendar in November 2026
    Then the weekend date November 21 is unavailable

  Scenario: Keyboard selection skips the weekend
    When I choose the next Monday using calendar arrow keys
    Then the selected meeting date is "2026-10-05"

  Scenario: Reversed date ranges can be corrected
    When I apply date range "2026-11-20" to "2026-11-18"
    Then the date range is rejected
    When I apply date range "2026-11-18" to "2026-11-20"
    Then the selected date range is "2026-11-18 → 2026-11-20"
