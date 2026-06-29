Feature: Refresh the access token on a 401 before logging out
  As an Arrow Maze player whose short-lived access token expired
  I want the app to silently refresh and retry the request
  So that I stay logged in instead of being bounced to the login screen every few minutes

  @s1
  Scenario: The persisted session carries the refresh token
    Given a successful login response that includes a refresh token
    When the session is built and persisted
    Then the stored session contains the refresh token alongside the access token

  @s2
  Scenario: Refreshing rotates the session tokens and returns the new access token
    Given a stored session with a refresh token
    When the refresh runs and the backend returns a new access + refresh token
    Then the session is updated with the new access and refresh tokens
    And the new access token is returned

  @s3
  Scenario: Refreshing is a no-op when there is no refresh token
    Given no stored session (or one without a refresh token)
    When the refresh runs
    Then it returns null without calling the backend

  @s4
  Scenario: Refreshing returns null when the backend rejects the refresh token
    Given a stored session with a refresh token the backend has revoked
    When the refresh runs and the backend call fails
    Then it returns null
    And the stored session is left unchanged

  @s5
  Scenario: A 401 on an authed request refreshes and retries once with the new token
    Given an http client whose refresh yields a new access token
    When an authed request fails with 401
    Then the request is retried once with the new Authorization header
    And the session is not invalidated

  @s6
  Scenario: When the refresh fails the session is invalidated
    Given an http client whose refresh yields null
    When an authed request fails with 401
    Then the request is not retried
    And the session-invalidation handler is called

  @s7
  Scenario: A retried request that fails again does not refresh a second time
    Given an http client whose refresh yields a new access token
    When the retried request also fails with 401
    Then no second refresh is attempted
    And the session-invalidation handler is called

  @s8
  Scenario: Logout revokes the refresh token on the backend then clears the session
    Given a stored session with a refresh token
    When the user logs out
    Then the backend logout is called with that refresh token
    And the local session is cleared
