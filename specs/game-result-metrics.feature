# Executable contract — Game result metrics out of the ViewModel (Client / Mobile)
# Ticket MAZ-160 / CA-007. Move elapsed-time + moves measurement and score
# calculation out of presentation into the application GameSession + a use case.
# No score-formula change. Human gate: the ticket is approved (Todo) and these @s
# scenarios are the contract for the slice.

Feature: Result metrics and scoring live in application, not in the ViewModel

  Background:
    Given a GameSession driven by an injectable Clock
    And the existing TimeScoringStrategy and ScoreContext in the domain

  # ---------- Application: session measures time and moves ----------

  @s1
  Scenario: The session reports zero elapsed time before a level starts
    Given a fresh GameSession
    When elapsedMs is read
    Then it is 0

  @s2
  Scenario: The session measures elapsed time from the injected clock while playing
    Given a started level with a controllable clock at t0
    When the clock advances and elapsedMs is read
    Then elapsedMs equals the advanced delta

  @s3
  Scenario: The session freezes elapsed time at the moment the level is won
    Given a started level with a controllable clock
    When the board is cleared and the clock advances further
    Then elapsedMs stays frozen at the time the level was won

  @s4
  Scenario: The session counts moves from the command history
    Given a started level
    When some arrows are extracted
    Then movesCount equals the number of recorded extractions

  # ---------- Application: snapshot carries plain metrics ----------

  @s5
  Scenario: The application snapshot exposes plain elapsedMs and movesCount
    Given a started level
    When a game snapshot is produced
    Then it contains elapsedMs and movesCount as plain numbers

  # ---------- Application: scoring is computed outside presentation ----------

  @s6
  Scenario: Resolving the outcome of a won level computes the score with the strategy
    Given a won level with a known elapsed time
    When the level outcome is resolved
    Then the outcome reports won true, the strategy score, the elapsed seconds, and the moves count

  @s7
  Scenario: Resolving the outcome of an unfinished or lost level yields a zero score
    Given a level that is not won
    When the level outcome is resolved
    Then the outcome reports won false and a zero score

  # ---------- Presentation: ViewModel only maps state ----------

  @s8
  Scenario: The ViewModel maps the snapshot to UI state without measuring metrics
    Given a GameViewModel bound to a facade
    When a level is played to victory
    Then the UI state shows the victory overlay
    And the ViewModel exposes no elapsedMs or movesCount metric source
