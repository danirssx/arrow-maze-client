Feature: Readable progress names, no dead victory route, leaner submit DTO, victory-submit test
  As a player and as the team
  We want progress to show level names, no confusing dead route or unused field,
  and a test for the win-submits-score path
  So that the UI is readable, the code is honest, and the key path is protected

  @s1
  Scenario: The level catalog exposes a human-readable name
    Given the level select view model
    When the level list is read
    Then each level item carries a non-empty name

  @s2
  Scenario: The progress screen shows the level name instead of the raw id
    Given completed progress and a level-id-to-name map
    When the progress screen renders
    Then the mapped level name is shown
    And the raw level id is not shown as the label

  @s3
  Scenario: The progress screen falls back to the id when no name is mapped
    Given completed progress and an empty level-id-to-name map
    When the progress screen renders
    Then the raw level id is shown as the label

  @s4
  Scenario: The submit DTO has no unused userId field
    Given the SubmitScoreRequestDto type
    When a submit request fixture is built
    Then it has no userId field

  @s5
  Scenario: Winning a level persists the completion with the right ids
    Given a signed-in session and the first manual level
    When the player taps the arrows in a valid extraction order until victory
    Then completeLevel is called once with the session ids and the UUID levelId

  @s6
  Scenario: Winning a level submits the score with the right ids
    Given a signed-in session and the first manual level
    When the player taps the arrows in a valid extraction order until victory
    Then submitScore is called once with the UUID levelId, the username, the token, and arrow-count moves
