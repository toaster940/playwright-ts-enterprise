@ui @api @hybrid
Feature: Tasks work across browser and API
  @smoke
  Scenario: API-seeded tasks can be completed in the UI
    Given I am signed in via the API
    And these tasks exist through the API:
      | title             |
      | Seeded for hybrid |
    And I open the task workspace
    Then task "Seeded for hybrid" is visible in the UI
    When I complete task "Seeded for hybrid" in the UI
    Then task "Seeded for hybrid" is completed through the API
