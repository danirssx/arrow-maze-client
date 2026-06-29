Feature: A 401 on an authed request clears the session and redirects to login
  As an Arrow Maze player whose token has expired or been revoked
  I want the app to log me out and send me to login on a 401
  So that I never stay "logged in" with a stale token while authed calls silently fail

  @s1
  Scenario: A 401 on a request that carried an Authorization header invalidates the session
    Given an AxiosHttpClientAdapter built with an onUnauthorized handler
    When the response interceptor receives a 401 error whose request had an Authorization header
    Then the onUnauthorized handler is called

  @s2
  Scenario: A 401 on a request without an Authorization header does not invalidate the session
    Given an AxiosHttpClientAdapter built with an onUnauthorized handler
    When the response interceptor receives a 401 error whose request had no Authorization header
    Then the onUnauthorized handler is not called

  @s3
  Scenario: A non-401 error never invalidates the session
    Given an AxiosHttpClientAdapter built with an onUnauthorized handler
    When the response interceptor receives a 500 error whose request had an Authorization header
    Then the onUnauthorized handler is not called

  @s4
  Scenario: The interceptor re-rejects the error so callers still receive it
    Given an AxiosHttpClientAdapter built with an onUnauthorized handler
    When the response interceptor receives any error
    Then the same error is re-thrown to the caller

  @s5
  Scenario: Session-invalidation notifications reach subscribers until they unsubscribe
    Given a subscriber registered on the session-invalidation channel
    When a session invalidation is notified
    Then the subscriber is called
    And after it unsubscribes a further notification does not call it

  @s6
  Scenario: The AuthGate clears the session and redirects to login on invalidation
    Given an authenticated user inside the AuthGate on a protected route
    When a session invalidation is notified
    Then the stored session is cleared
    And the user is redirected to "/login"
