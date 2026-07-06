Feature: Sequential level locking
  Levels unlock one at a time: a level is playable only after its predecessor is
  completed. A new user can only play level 1; later levels are visibly locked and a
  deep link to a locked level is blocked.

  @s1
  Scenario: A new user can only play the first level
    Given a user with no completed levels
    When the level list renders
    Then the first level is unlocked
    And every later level is locked

  @s2
  Scenario: Completing a level unlocks the next one
    Given a user who has completed level 1
    When the level list refreshes
    Then level 2 is unlocked
    And level 3 is still locked

  @s3
  Scenario: A locked card cannot be selected
    Given the level list shows a locked level
    When the player taps the locked card
    Then no navigation to that level happens

  @s4
  Scenario: A deep link to a locked level is blocked
    Given a user whose progress does not unlock level 2
    When the game route opens level 2 directly
    Then the app blocks play and shows a locked-state message
    And offers a way back to the level list

  @s5
  Scenario: Offline progress unlocks the next level locally
    Given local progress records level 1 as completed while offline
    When the level list computes locked state
    Then level 2 is unlocked from the local completed ids
