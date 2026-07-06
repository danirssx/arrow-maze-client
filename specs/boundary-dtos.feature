# Executable contract — Flatten boundary DTOs, keep domain types out of presentation
# Ticket MAZ-164 / CA-011. The application boundary owns its DTO literal types;
# domain → DTO translation happens inside the application layer; presentation never
# imports @/domain. No serialized value changes. Human gate: the ticket is approved and
# these @s scenarios are the contract for the slice.

Feature: The application boundary owns flat DTOs and presentation holds no domain type

  Background:
    Given the domain frozen const maps GamePhase, LevelStatus, DefeatReason, GameEventType and Difficulty
    And the application DTOs that presentation imports

  # ---------- Application: snapshot DTO literals mapped from the domain ----------

  @s1
  Scenario: The snapshot mapper produces the boundary's own phase literal
    Given a started level whose context phase is PLAYING
    When a game snapshot is produced
    Then snapshot.phase is the DTO literal "PLAYING"

  @s2
  Scenario: The snapshot mapper maps a lost result to DTO status and reason literals
    Given a level result that is lost out of attempts
    When the result is mapped to the snapshot result DTO
    Then the result DTO status is "LOST" and reason is "OUT_OF_ATTEMPTS"

  @s3
  Scenario: Every domain phase and status value maps to an identical DTO literal
    Given each domain GamePhase, LevelStatus and DefeatReason value
    When it is converted with the boundary mapper
    Then the produced DTO literal has the same serialized value

  # ---------- Application: event DTO owns its discriminator ----------

  @s4
  Scenario: The event mapper emits the DTO event type discriminator
    Given a domain MoveExecuted event
    When it is mapped to a game event DTO
    Then the DTO type is the GameEventTypeDto literal "MOVE_EXECUTED" with plain coordinates

  @s5
  Scenario: The application dto barrel re-exports no domain type
    Given the application/dto module
    When its exports are inspected
    Then it exposes GameEventTypeDto and never re-exports a type from domain

  # ---------- Application: catalog port uses a DTO difficulty literal ----------

  @s6
  Scenario: The level catalog summary carries a plain difficulty literal
    Given a level catalog summary from the repository port
    When its difficulty is read
    Then it is a DifficultyDto literal string, not a domain value object

  # ---------- Presentation: ready-to-consume difficulty, no domain import ----------

  @s7
  Scenario: The level list view model exposes ready-to-consume difficulty fields
    Given the LevelSelectViewModel reading the catalog
    When it builds the level list items
    Then each item exposes difficultyStars between 1 and 3 and a difficultyLabel
    And the ViewModel imports nothing from the domain layer

  @s8
  Scenario: The level card renders the rating from difficultyStars
    Given a level list item with difficultyStars 3
    When the LevelCard renders
    Then it shows three filled stars without mapping a domain difficulty itself

  @s9
  Scenario: Presentation has no import from the domain layer
    Given the whole src/presentation tree
    When imports are linted
    Then no module imports from @/domain
