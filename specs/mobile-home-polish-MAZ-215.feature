Feature: Home account area and coin badge removal
  Home shows the current signed-in username and a clear logout action while
  removing unused coin UI from the mobile home screen.

  @s1
  Scenario: Authenticated Home shows username and clear logout action
    Given Home receives username "alice" and a logout intent
    When the Home screen renders
    Then the account area shows "alice" as the only identity copy
    And the logout action is visible as a clear account action

  @s2
  Scenario: Home logout action emits the injected intent
    Given Home receives username "alice" and a logout intent
    When the player presses the Home logout action
    Then the logout intent is invoked once

  @s3
  Scenario: Settings keeps logout available for authenticated users
    Given Settings receives username "alice" and a logout intent
    When the Settings screen renders
    Then the Settings logout action is visible
    When the player presses the Settings logout action
    Then the logout intent is invoked once

  @s4
  Scenario: Unauthenticated Home shows no fake account information
    Given Home receives no authenticated username
    When the Home screen renders
    Then no account username is shown
    And no Home logout action is shown

  @s5
  Scenario: Home renders no coin badge or coin visual reference
    Given Home renders for any session state
    When the Home screen is inspected
    Then there is no home coin badge
    And no coin amount is displayed
    And no visual coin reference appears

  @s6
  Scenario: Home remains a dumb MVVM View
    Given the Home presentation implementation is inspected
    When imports and responsibilities are reviewed
    Then Home depends only on presentation-safe primitives, callbacks and UI components
    And it introduces no auth/session business rules or infrastructure calls
