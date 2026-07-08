Feature: Show level names clearly in preview cards
  Every level preview card identifies the level by its product name, from the backend
  catalog or the offline fixtures, and stays readable on narrow devices.

  @s1
  Scenario: Show the level name on a card
    Given a level with a product name
    When the level card renders
    Then the card shows the level name

  @s2
  Scenario: Show a readable name from the local fixture fallback
    Given the level list is sourced from the offline fixtures
    When the level select screen renders
    Then each card shows the fixture level name

  @s3
  Scenario: Truncate a long name to one line without overlap
    Given a level whose name is very long
    When the level card renders on a narrow device
    Then the name is truncated to a single line

  @s4
  Scenario: Show the remote catalog name on a card
    Given the level list is sourced from the backend catalog
    When the view model maps the catalog summary
    Then the list item carries the backend level name
