# Executable contract — Abstract Shaped Boards (Client / Mobile)
# Option A: boardShape is a visual + placement mask, NOT a physical wall.
# Extraction physics (unbounded raycast) unchanged. AI/image upload = deferred (Phase 2).
# Human gate: approve these @s scenarios before any production code is written.

Feature: Abstract shaped Arrow Untangle boards (client parsing, snapshot, rendering)

  Background:
    Given the client parses levels with JsonLevelStrategy into a LevelDefinition
    And boardShape is an optional CELL_MASK of finite lattice cells

  # ---------- Slice 1: shaped JSON parsing + board snapshot (S1, S2a, S3, S5b) ----------

  @s1
  Scenario: Parse a valid shaped JSON level
    Given a JSON level with arrows and a valid boardShape CELL_MASK whose cells contain every arrow cell
    When JsonLevelStrategy parses it
    Then the resulting LevelDefinition includes the boardShape with its cells
    And the LevelDirector builds a playable level from it

  @s2a
  Scenario: Parse a legacy level without a shape
    Given a JSON level with no boardShape field
    When JsonLevelStrategy parses it
    Then the LevelDefinition has no boardShape
    And the level still builds playable

  @s3
  Scenario Outline: Reject an invalid shaped JSON level with a controlled error
    Given a JSON level whose boardShape is invalid because <reason>
    When JsonLevelStrategy parses it
    Then it throws a controlled InvalidLevelDefinitionError

    Examples:
      | reason                                   |
      | it contains two identical cells          |
      | an arrow cell lies outside the mask      |
      | its type is not CELL_MASK                |
      | it has more than 600 cells               |
      | it is present but cells is empty         |

  @s5b
  Scenario: The board snapshot exposes the shape and union bounds
    Given a LevelDefinition with a boardShape whose mask extends beyond the arrow cells
    When mapBoardSnapshot maps it
    Then the BoardSnapshotDto includes the boardShape cells
    And bounds equal the union of the arrow cells and the shape cells

  # ---------- Slice 2: shaped board rendering (S5, S6, S2c) ----------

  @s5
  Scenario: Render only the mask cells as the dotted background
    Given a started level whose snapshot carries a boardShape mask
    When BoardView renders
    Then it draws dotted board cells only for the mask cells, not a full rectangle
    And each active arrow still has a tappable head target

  @s2c
  Scenario: Keep the rectangular fallback when no shape is present
    Given a started level whose snapshot has no boardShape
    When BoardView renders
    Then it keeps the current rectangular dotted lattice derived from arrow bounds

  @s6
  Scenario: Extraction is unaffected by the shape boundary
    Given an active arrow whose forward ray has no other active arrow ahead
    And the visible shape boundary lies ahead of the arrow head
    When the arrow head is tapped
    Then the arrow extracts
    And its exit animation still streams outside the visible shape boundary
