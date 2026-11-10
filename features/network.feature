@ui @network
Feature: Controlled network responses
  Background:
    Given I am signed in via the API

  Scenario: Catalog response can be mocked
    Given the catalog responds with "BDD catalog"
    And I open the task workspace
    When I load the catalog
    Then the catalog displays "BDD catalog"

  Scenario: Service errors are visible to users
    Given task creation is temporarily unavailable
    And I open the task workspace
    When I submit task "Retry me later"
    Then the status message is "Please retry later"
