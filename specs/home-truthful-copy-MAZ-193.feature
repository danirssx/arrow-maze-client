Feature: Truthful Home navigation copy
  Every Home action's label names the destination it opens; misleading rewards / daily
  / follow copy for non-existent screens is removed.

  @s1
  Scenario: The Play call to action opens level select
    Given the Home screen renders
    When the player taps Play
    Then the level-select navigation is invoked

  @s2
  Scenario: The Leaderboard card opens the leaderboard
    Given the Home screen renders
    When the player taps the Leaderboard card
    Then the leaderboard navigation is invoked

  @s3
  Scenario: The Progress card opens progress
    Given the Home screen renders
    When the player taps the Progress card
    Then the progress navigation is invoked

  @s4
  Scenario: The Settings card opens settings
    Given the Home screen renders
    When the player taps the Settings card
    Then the settings navigation is invoked

  @s5
  Scenario: Misleading rewards / daily / follow copy is gone
    Given the Home screen renders
    Then the cards are labelled Leaderboard, Your progress and Settings
    And no "Win rewards", "Daily challenges" or "Follow the arrow" copy is shown
