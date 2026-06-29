Feature: Leaderboard empty state and replay submit feedback

  The mobile client must show scoreless leaderboards as empty, not broken, and
  must stop hiding leaderboard submit outcomes after victory.

  @s1
  Scenario: Not-found leaderboard read renders empty state
    Given the leaderboard facade reports "NOT_FOUND" for a UUID level
    When the leaderboard view model loads that level
    Then the view state is Empty
    And the leaderboard screen renders the empty leaderboard state

  @s2
  Scenario: Non-not-found leaderboard read failure still renders error
    Given the leaderboard facade fails for a network or server reason
    When the leaderboard view model loads a UUID level
    Then the view state is Error
    And the leaderboard screen renders retry UI

  @s3
  Scenario: Non-UUID fallback level id does not request leaderboard
    Given the level id is "manual-001-first-knot"
    When the leaderboard view model loads the level
    Then no leaderboard request is made
    And the view state is Empty

  @s4
  Scenario: Successful victory submit shows synced feedback
    Given an authenticated player wins a UUID level
    And the leaderboard submit succeeds
    When the victory overlay renders after submit
    Then it shows that the score was synced or submitted
    And it does not claim the score was a new best

  @s5
  Scenario: Failed victory submit shows leaderboard sync warning
    Given an authenticated player wins a UUID level
    And the leaderboard submit fails
    When the victory overlay renders after submit
    Then it shows a visible leaderboard sync failure message
    And the home, replay, next-level, and leaderboard actions remain available

  @s6
  Scenario: Leaderboard submit failure does not fail progress completion
    Given an authenticated player wins a UUID level
    And progress completion succeeds
    And leaderboard submit fails
    When the victory side effects settle
    Then progress completion is still treated as complete
    And only leaderboard sync is reported as failed

  @s7
  Scenario: Skipped non-UUID submit is distinct from backend failure
    Given an authenticated player wins a non-UUID fallback level
    When the victory side effects run
    Then no leaderboard submit request is made
    And the victory overlay does not show a backend failure message
