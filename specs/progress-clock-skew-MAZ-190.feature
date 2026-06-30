Feature: Resolve progress sync on a permanent rejection
  When the backend permanently rejects a progress write, the client stops retrying
  and resolves the pending state so the player is never stuck on "pending sync"
  forever. Retryable failures still keep retrying.

  @s1
  Scenario: A permanently rejected completion resolves the pending state
    Given a player completes a level
    When the remote completion is rejected with a non-retryable error
    Then the level stays recorded locally
    And the progress is no longer pending sync

  @s2
  Scenario: A permanently rejected drain resolves the pending state
    Given a pending offline completion
    When the drain sync is rejected with a non-retryable error
    Then the progress is no longer pending sync
    And the drain does not retry the same payload again

  @s3
  Scenario: A retryable completion failure keeps pending for a later drain
    Given a player completes a level
    When the remote completion fails with a retryable network error
    Then the level stays recorded locally
    And the progress is still pending sync

  @s4
  Scenario: A retryable drain failure keeps pending for a later drain
    Given a pending offline completion
    When the drain sync fails with a retryable network error
    Then the progress is still pending sync
