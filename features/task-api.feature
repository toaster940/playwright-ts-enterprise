@api @tasks
Feature: Task API lifecycle and contracts
  Background:
    Given I am signed in via the API

  @smoke
  Scenario: Create, complete and delete a task
    When I create task "BDD release" through the API
    Then the API contains 1 tasks
    When I complete that task through the API
    Then task "BDD release" is completed through the API
    When I delete that task through the API
    Then the API contains 0 tasks

  Scenario: Seed several tasks with a data table
    Given these tasks exist through the API:
      | title          |
      | Review release |
      | Publish notes  |
    Then the API contains 2 tasks

  Scenario: Create a task from a JSON doc string
    When I send this task payload:
      """json
      { "title": "Contract from a doc string" }
      """
    Then the response status is 201
    And the API contains 1 tasks

  Scenario Outline: Blank task titles are rejected
    When I create a task with an invalid title "<title>"
    Then the response status is 422
    Examples:
      | title |
      |       |

  Scenario: Whitespace-only titles are rejected
    When I send this task payload:
      """json
      { "title": "   " }
      """
    Then the response status is 422

  Scenario: Overlong task title is rejected
    When I create a task with a 121 character title
    Then the response status is 422

  Scenario: A missing task returns a clear status
    When I update a missing task
    Then the response status is 404
