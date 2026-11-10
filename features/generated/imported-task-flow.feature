@ui @generated
Feature: Recording imported-task-flow
  # Generated technical steps: review and rename around business behavior.
  Scenario: Replay imported-task-flow
    Given I am signed in via the API
    When I replay recording "imported-task-flow" action 1
    When I replay recording "imported-task-flow" action 2
    When I replay recording "imported-task-flow" action 3
    Then I verify recording "imported-task-flow" action 4
    When I replay recording "imported-task-flow" action 5
    Then I verify recording "imported-task-flow" action 6
    Then I verify recording "imported-task-flow" action 7
