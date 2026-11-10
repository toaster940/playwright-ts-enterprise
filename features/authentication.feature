@api @auth
Feature: API authentication
  @smoke
  Scenario: A valid login identifies the user
    Given I have a fresh unauthenticated session
    When I log in with email "qa@example.com" and password "Playwright123!"
    Then the response status is 200
    When I request my profile
    Then the profile belongs to "qa@example.com"

  Scenario: An anonymous user cannot read a profile
    Given I have a fresh unauthenticated session
    When I request my profile
    Then the response status is 401

  Scenario Outline: Incorrect credentials are rejected
    Given I have a fresh unauthenticated session
    When I log in with email "<email>" and password "<password>"
    Then the response status is 401
    And the response error is "Invalid credentials"
    Examples:
      | email             | password       |
      | wrong@example.com | Playwright123! |
      | qa@example.com    | wrong          |
