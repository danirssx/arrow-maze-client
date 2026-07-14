Feature: Mobile BoardView3D GL scene
  MAZ-240 adds a production 3D board renderer shell for volumetric Arrow Untangle levels.

  @s1
  Scenario: Preserve depth in volumetric board snapshots
    Given a level definition marked as 3D
    When the application maps it to a board snapshot
    Then every arrow cell keeps its z coordinate
    And the snapshot exposes minZ and maxZ depth bounds

  @s2
  Scenario: Keep planar board snapshots backward compatible
    Given a 2D level definition with no depth cells
    When the application maps it to a board snapshot
    Then the arrow coordinates omit z
    And the bounds omit depth fields

  @s3
  Scenario: Build pure 3D render descriptors from board DTOs
    Given active arrow DTOs with row, column, z and world-axis directions
    When presentation builds 3D tube descriptors
    Then coordinates are centered inside the board volume
    And directions resolve to the six world axes
    And extracted arrows are omitted from the active descriptors

  @s4
  Scenario: Mount the static 3D GL board shell
    Given a game UI state with 3D bounds
    When BoardView3D renders
    Then it mounts a GL canvas shell for the static scene

  @s5
  Scenario: Defer interaction and renderer switching
    Given the MAZ-240 renderer shell
    When it is added to the presentation layer
    Then GameScreen renderer switching remains unchanged
    And orbit, zoom, tap picking, and exit animation remain outside this ticket
