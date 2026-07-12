Feature: Visible gameplay timer

  @s1
  Scenario: Show elapsed match time in mm:ss while playing
    Given a gameplay screen is running a level
    When play time advances
    Then the HUD shows the elapsed time formatted as mm:ss
    And the shown value comes from the application snapshot

  @s2
  Scenario: Freeze the timer when the match ends
    Given a gameplay screen is running a level
    When the result becomes Victory or Defeat
    Then the displayed elapsed time stops advancing
    And the final elapsed time remains visible

  @s3
  Scenario: Reset the timer on restart
    Given a gameplay screen has an elapsed time greater than zero
    When the player restarts the level
    Then the displayed elapsed time resets to 00:00

  @s4
  Scenario: Stop ticking when gameplay is exited
    Given a gameplay screen is running a level
    When the screen unmounts
    Then the timer interval is cleared
    And no further elapsed-time refresh runs

  @s5
  Scenario: Format elapsed milliseconds as zero-padded mm:ss
    Given a number of elapsed milliseconds
    When it is formatted
    Then the result is zero-padded mm:ss
    And minutes above 59 are not wrapped
    And negative or non-finite input renders 00:00

  @s6
  Scenario: Ignore a tick before a level starts
    Given no level has been started
    When the elapsed-time refresh is requested
    Then the ViewModel publishes no new UI state

  @s7
  Scenario: Preserve the existing result contract
    Given a level is played to victory
    When the level outcome is read for submission
    Then the outcome still exposes score, time seconds, and moves count
    And no new persisted timer metric is added
