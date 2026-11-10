@ui @components
Feature: Common interactive UI components
  Background:
    Given I open the UI component lab

  Scenario: Select checkbox, switch and radio preferences
    When I enable email updates and dark mode with express delivery
    Then those preferences are selected

  Scenario: Adjust a range slider with the keyboard
    When I set priority to twenty with the keyboard
    Then the selected priority is twenty

  Scenario: Numeric input enforces an upper limit
    When I increase seats from nine
    Then the seat limit is reached

  Scenario: Switch between tab panels
    When I switch to the Activity tab
    Then only the Activity panel is visible

  Scenario: Expand an accordion
    When I expand the release notes
    Then the release note content is visible

  Scenario: A notification can be dismissed
    When I save component preferences
    Then a preference notification appears
    When I dismiss the notification
    Then the notification is hidden

  Scenario: Menu actions require confirmation
    When I cancel archiving the project
    Then the project state is "Active"
    When I confirm archiving the project
    Then the project state is "Archived"

  Scenario: Filter a data table
    When I filter releases by "Cedar"
    Then the inventory contains only release "Cedar"

  Scenario: Partial table selection has a mixed state
    When I select the visible releases except Aster
    Then the table selection is mixed with two selected releases

  Scenario: Registration errors can be corrected
    When I submit an empty registration
    Then the required registration errors are shown
    When I complete the registration correctly
    Then the registration is saved
