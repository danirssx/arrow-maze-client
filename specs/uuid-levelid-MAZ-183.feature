Feature: A valid UUID levelId always reaches the leaderboard and progress network calls
  As an Arrow Maze player
  I want the level id sent to the backend to always be a real UUID
  So that winning a level records my score and progress instead of silently 422-ing

  Background:
    Given the backend requires a v4 UUID levelId and rejects anything else with 422

  @s1
  Scenario: The offline fallback catalog exposes only UUID level ids
    Given the offline manual level catalog
    When the level list items and their definitions are read
    Then every level id is a valid v4 UUID
    And no level id is a slug like "manual-001-first-knot"

  @s2
  Scenario: isUuid recognizes v4 UUIDs and rejects everything else
    Given the isUuid validator
    Then it returns true for "550e8400-e29b-41d4-a716-446655440010"
    And it returns false for "manual-001-first-knot"
    And it returns false for an empty string
    And it returns false for a non-v4 UUID

  @s3
  Scenario: Leaderboard score submit is skipped when the levelId is not a UUID
    Given a LeaderboardFacade over a spy repository
    When submitScore is called with a non-UUID levelId
    Then the repository submitScore is never called

  @s4
  Scenario: Leaderboard score submit is delegated when the levelId is a UUID
    Given a LeaderboardFacade over a spy repository
    When submitScore is called with a valid UUID levelId
    Then the repository submitScore is called once with that input and token

  @s5
  Scenario: Leaderboard read shows the empty state without a request when the levelId is not a UUID
    Given a LeaderboardViewModel over a spy facade
    When load is called with a non-UUID levelId
    Then the facade getTopScores is never called
    And the view state is Empty

  @s6
  Scenario: Leaderboard read fetches through the facade when the levelId is a UUID
    Given a LeaderboardViewModel over a spy facade returning entries
    When load is called with a valid UUID levelId
    Then the facade getTopScores is called with that levelId
    And the view state is Loaded

  @s7
  Scenario: Progress completion is skipped when the levelId is not a UUID
    Given a ProgressFacade over spy local and remote repositories
    When completeLevel is called with a non-UUID levelId
    Then the local save is never called
    And the remote completeLevel is never called

  @s8
  Scenario: Progress completion persists and syncs when the levelId is a UUID
    Given a ProgressFacade over spy local and remote repositories
    When completeLevel is called with a valid UUID levelId
    Then the local save is called
    And the remote completeLevel is called with that completion
