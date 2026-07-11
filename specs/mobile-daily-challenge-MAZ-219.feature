Feature: Mobile Daily Challenge entrypoint and consumption
  An authenticated player can open a Daily Challenge from Home, the app fetches
  the once-per-day puzzle from the backend, loads it into the existing gameplay
  flow, and shows clear loading, error and fallback states — with no knowledge of
  Gemini, prompts or secrets on the mobile side.

  @s1
  Scenario: Opening the Daily Challenge requests it from the backend
    Given the daily challenge repository is backed by the HTTP client
    When the repository fetches the daily challenge
    Then it issues a GET request to "/daily-challenge"

  @s2
  Scenario: A valid backend challenge maps to a playable level definition
    Given the backend returns a valid daily challenge payload with arrows, attempts and difficulty
    When the response is mapped
    Then a level definition is produced with the arrows, attempts and difficulty of the challenge
    And its id is the deterministic daily seed rather than a leaderboard uuid
    And an optional board shape and time limit are carried through only when present

  @s3
  Scenario: The view-model exposes loading then loaded on success
    Given the facade resolves a valid daily challenge
    When the view-model loads the challenge
    Then the view-model first reports a loading state
    And then reports a loaded state carrying the level definition and challenge metadata

  @s4
  Scenario: Backend failure surfaces a recoverable error without crashing
    Given the facade rejects because the backend is unavailable
    When the view-model loads the challenge
    Then the view-model reports an error state
    And the Daily Challenge screen shows a recoverable retry action instead of crashing

  @s5
  Scenario: A loaded challenge opens gameplay with the daily level
    Given the Daily Challenge screen has loaded a valid daily challenge
    When the player starts the challenge
    Then gameplay opens with the daily level definition

  @s6
  Scenario: No Gemini secrets exist on the mobile side
    Given the Daily Challenge mobile code and public env are inspected
    When searching for Gemini keys, prompts or secrets
    Then none are present in code, public env or logs
    And the client only references the backend "/daily-challenge" endpoint

  @s7
  Scenario: Home exposes a Daily Challenge entrypoint and stays a dumb view
    Given Home receives a daily challenge intent
    When the Home screen renders and the player presses the Daily Challenge entry
    Then the daily challenge intent is invoked once
    And Home introduces no session or infrastructure business rules

  @s8
  Scenario: A fallback-sourced challenge still loads and makes no leaderboard write
    Given the backend returns a valid daily challenge whose source is the deterministic fallback
    When the view-model loads the challenge
    Then the challenge is loaded and playable
    And the daily flow performs no leaderboard or progress submission
