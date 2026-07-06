Feature: Readable level names and friendly sync status on Progress
  The Progress screen shows level names instead of UUIDs, a readable fallback when a
  name is unavailable, and explains the sync state in product language.

  @s1
  Scenario: Show the level name for a known level
    Given completed progress for a level whose name is known
    When the Progress screen renders the row
    Then the row shows the level name
    And the row does not show the raw UUID

  @s2
  Scenario: Show a readable fallback when the level name is unavailable
    Given completed progress for a level whose name cannot be resolved
    When the Progress screen renders the row
    Then the row shows a readable fallback label
    And the row does not show the raw UUID as the primary label

  @s3
  Scenario: Explain a pending local sync in product language
    Given local progress has not synced yet
    When the Progress screen renders
    Then the status explains that progress is saved on the device and will sync soon

  @s4
  Scenario: Hide the pending status after a successful sync
    Given progress has synced successfully
    When the Progress screen renders
    Then the pending status is not shown
