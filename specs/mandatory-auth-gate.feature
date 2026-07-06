Feature: Mandatory auth gate
  Mobile routes that expose game data must require a persisted session before
  rendering protected content.

  @s1
  Scenario: Redirect unauthenticated users away from protected routes
    Given no persisted session exists
    When the app opens a protected route
    Then the auth gate redirects to "/login"
    And protected content is not rendered

  @s2
  Scenario: Render the app when a persisted session exists
    Given a persisted session exists
    When the app opens a protected route
    Then the auth gate renders protected content
    And it does not redirect to "/login"

  @s3
  Scenario: Clear the session and return to login on logout
    Given an authenticated user is inside the app
    When the user logs out
    Then the session is cleared
    And the auth gate redirects to "/login"

  @s4
  Scenario: Show identity and logout in the app UI
    Given an authenticated user named "alice"
    When Home or Settings renders
    Then the screen shows "alice"
    And the screen exposes a logout action

  @s5
  Scenario: Gameplay does not run victory submission as a guest
    Given the game route is protected by the auth gate
    When the game screen renders after bootstrap
    Then gameplay receives a non-null session for completion submission
