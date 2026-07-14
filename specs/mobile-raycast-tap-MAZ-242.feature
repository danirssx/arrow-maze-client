Feature: 3D board raycast tap-picking (MAZ-242)
  As a player interacting with a 3D level,
  I want tapping an arrow in the 3D scene to trigger extraction,
  So that the 3D board feels as responsive as the 2D board.

  Background:
    Given BoardView3D is rendered with a set of active arrows
    And an onArrowTap spy is provided as prop

  @s1
  Scenario: tap on tube mesh fires onArrowTap with the correct id
    When the player taps the tube mesh of arrow "arrow-1"
    Then onArrowTap is called exactly once with "arrow-1"

  @s2
  Scenario: tap on cone head fires onArrowTap with the correct id
    When the player taps the cone head mesh of arrow "arrow-2"
    Then onArrowTap is called exactly once with "arrow-2"

  @s3
  Scenario: tap on lattice mesh is ignored
    When the player taps a lattice mesh that has no userData.arrowId
    Then onArrowTap is not called

  @s4
  Scenario: tap on empty canvas space is ignored
    When the player taps empty space (no mesh intersected)
    Then onArrowTap is not called

  @s5
  Scenario: no error when onArrowTap is not provided
    Given BoardView3D is rendered without an onArrowTap prop
    When the player taps any arrow mesh
    Then no exception is thrown
