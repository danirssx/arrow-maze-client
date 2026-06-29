Feature: The HTTP client attaches the Bearer token centrally via a request interceptor
  As the mobile app
  I want one request interceptor to attach the session token to every authed call
  So that repositories and screens stop hand-rolling Authorization headers and threading the token

  @s1
  Scenario: The interceptor attaches the Bearer token when a session token exists
    Given an AxiosHttpClientAdapter built with a token provider that returns "jwt-token-1"
    When the request interceptor processes an outgoing request without an Authorization header
    Then the request carries the header Authorization "Bearer jwt-token-1"

  @s2
  Scenario: The interceptor sends no Authorization header when there is no session token
    Given an AxiosHttpClientAdapter built with a token provider that returns null
    When the request interceptor processes an outgoing request
    Then the request has no Authorization header

  @s3
  Scenario: The interceptor never overrides an explicit Authorization header
    Given an AxiosHttpClientAdapter built with a token provider that returns "jwt-token-1"
    When the request interceptor processes a request that already has Authorization "Bearer explicit"
    Then the request keeps Authorization "Bearer explicit"

  @s4
  Scenario: The leaderboard repository no longer hand-rolls the Authorization header
    Given an HttpLeaderboardRepository over a spy http client
    When submitScore is called with a submit input
    Then the client posts the input to "/leaderboard/scores"
    And the post config carries no Authorization header

  @s5
  Scenario: The progress repository no longer hand-rolls the Authorization header
    Given an HttpProgressRepository over a spy http client
    When completeLevel is called with a completion
    Then the client posts the completion to the level complete URL
    And the post config carries no Authorization header

  @s6
  Scenario: The leaderboard facade delegates submit without a token argument
    Given a LeaderboardFacade over a spy repository
    When submitScore is called with a UUID-level input
    Then the repository submitScore is called with only that input

  @s7
  Scenario: The progress facade completes a level without a token argument
    Given a ProgressFacade over spy local and remote repositories
    When completeLevel is called with a userId and a UUID-level completion
    Then the remote completeLevel is called with only that completion
