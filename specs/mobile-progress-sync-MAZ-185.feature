Feature: Drain offline progress and stop losing failed victory writes
  As a player who finishes levels offline or with a flaky connection
  We want pending completions to drain when connectivity or the app returns
  So that progress reaches the backend and failed writes are retained, not dropped

  @s1
  Scenario: Draining sends pending progress to the backend
    Given the local progress is flagged pendingSync
    When drainPendingProgress runs for the user
    Then the remote sync is called
    And it reports that it drained
    And the stored progress is no longer pendingSync

  @s2
  Scenario: Draining is a no-op when nothing is pending
    Given the local progress is not pendingSync
    When drainPendingProgress runs for the user
    Then no remote sync is called
    And it reports that it did not drain

  @s3
  Scenario: A failed remote completion is retained, not dropped
    Given the remote completeLevel rejects
    When the user completes a level
    Then the local completion is stored with pendingSync true
    And the completion promise rejects

  @s4
  Scenario: Retained pending progress is retried on the next drain
    Given a completion was retained as pendingSync after a remote failure
    When drainPendingProgress runs later
    Then the retained completion is sent to the remote sync

  @s5
  Scenario: The sync coordinator drains immediately on start
    Given a drain callback and lifecycle triggers
    When startProgressSync starts
    Then the drain callback runs once immediately

  @s6
  Scenario: The sync coordinator drains on foreground and reconnect and stops after unsubscribe
    Given a started sync coordinator
    When the foreground trigger fires
    Then the drain callback runs again
    When the reconnect trigger fires
    Then the drain callback runs again
    When the coordinator is unsubscribed and a trigger fires
    Then the drain callback does not run again

  @s7
  Scenario: The hook drains for a signed-in session when connectivity returns
    Given a signed-in session and a mocked NetInfo connectivity source
    When the hook mounts and connectivity reports connected
    Then drainPendingProgress runs for the session
