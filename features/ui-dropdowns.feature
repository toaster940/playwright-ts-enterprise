@ui @components @dropdown
Feature: Dropdown selection and autocomplete
  Background:
    Given I open the UI component lab

  Scenario Outline: Select an environment by its visible label
    When I choose environment "<environment>"
    Then the selected environment is "<environment>"
    Examples:
      | environment |
      | Development |
      | Staging     |
      | Production  |

  Scenario: Select multiple browsers with a data table
    When I select these browser options:
      | value    |
      | chromium |
      | webkit   |
    Then the selected browsers are "Chromium, WebKit"

  Scenario: Dependent dropdowns reset a stale region
    When I choose country "India" and region "Karnataka"
    And I change country to "United States"
    Then the region selection is reset

  Scenario: Choose from a searchable custom dropdown
    When I search "gra" and select reviewer "Grace Hopper"
    Then the selected reviewer is "Grace Hopper"

  Scenario: Choose a reviewer with keyboard navigation
    When I select reviewer "Ada" using the keyboard
    Then the selected reviewer is "Ada Lovelace"
