Feature: Mobile audio effects and background music

  @s1
  Scenario: Play move effect once for a valid extraction
    Given sound is enabled
    And a Gameplay screen is running a level with an extractable arrow
    When the player taps that arrow
    Then the move sound effect is played exactly once

  @s2
  Scenario: Play undo effect once for a successful undo
    Given sound is enabled
    And a Gameplay screen has one extracted arrow that can be undone
    When the player presses Undo
    Then the undo sound effect is played exactly once

  @s3
  Scenario: Play terminal effect once on victory or defeat
    Given sound is enabled
    And a Gameplay screen transitions to a terminal result
    When the terminal overlay becomes Victory or Defeat
    Then the matching terminal sound effect is played exactly once
    And repeated renders do not replay the same terminal sound effect

  @s4
  Scenario: Suppress all audio when muted
    Given sound is muted
    When a valid tap, undo, victory, defeat, Home mount, or Gameplay mount happens
    Then no sound effect is played
    And no background music starts
    And any active screen music is stopped

  @s5
  Scenario: Start and stop Home background music with screen lifecycle
    Given sound is enabled
    When Home mounts
    Then Home background music starts
    When Home unmounts
    Then Home background music is stopped and cleaned up

  @s6
  Scenario: Start and stop Gameplay background music with screen lifecycle
    Given sound is enabled
    When Gameplay mounts
    Then Gameplay background music starts
    When Gameplay unmounts
    Then Gameplay background music is stopped and cleaned up

  @s7
  Scenario: Document safe placeholder audio assets
    Given the audio assets are committed locally
    When their source or generation notes are inspected
    Then each asset is documented as safe to version
