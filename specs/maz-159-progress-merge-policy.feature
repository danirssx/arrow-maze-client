Feature: Client progress merge domain policy
  The mobile client keeps offline completed-level progress without placing the
  best-score rule in the application facade.

  @s1
  Scenario: Preserve an existing completion when the new completion has a worse score
    Given local progress already contains a completion for level "level-1" with score 500 and time 20 seconds
    When a completion for level "level-1" arrives with score 100 and time 10 seconds
    Then the merged progress keeps score 500 for level "level-1"

  @s2
  Scenario: Replace an existing completion when scores tie and the new completion is faster
    Given local progress already contains a completion for level "level-1" with score 500 and time 30 seconds
    When a completion for level "level-1" arrives with score 500 and time 10 seconds
    Then the merged progress keeps time 10 seconds for level "level-1"

  @s3
  Scenario: ProgressFacade delegates local completion merge to the domain policy
    Given local progress already contains a completion for level "level-1" with score 500 and time 20 seconds
    When ProgressFacade completes level "level-1" with score 100 and time 10 seconds
    Then the locally saved pending progress still keeps score 500 before remote refresh

  @s4
  Scenario: Client progress policy matches the backend best-result criterion
    Given the backend progress criterion is higher score first and faster time on equal score
    When the client progress policy compares two completed-level results
    Then it chooses the higher score before considering time
    And it chooses the faster time only when scores are equal
