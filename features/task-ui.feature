@ui @tasks
Feature: Manage tasks in the browser
  Background:
    Given I am signed in via the API
    And I open the task workspace

  @smoke
  Scenario: A task can be completed and deleted
    When I add task "Review release" in the UI
    Then task "Review release" is visible in the UI
    When I complete task "Review release" in the UI
    And I reload the workspace
    Then task "Review release" is completed in the UI
    When I delete task "Review release" in the UI
    Then the UI task list is empty

  Scenario Outline: Several titles can be added
    When I add task "<title>" in the UI
    Then task "<title>" is visible in the UI
    Examples:
      | title              |
      | Prepare release    |
      | Review API changes |

  Scenario: Settings display a changed name
    When I set my display name to "Release Engineer"
    Then my displayed name is "Release Engineer"
