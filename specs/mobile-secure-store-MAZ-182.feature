Feature: Persist the auth session in secure storage with a one-time migration
  As a player whose bearer token must not sit in plaintext device storage
  We want the session stored via expo-secure-store and old sessions migrated
  So that the JWT is protected and existing users stay logged in after the update

  @s1
  Scenario: Saving a session writes to SecureStore and purges the legacy copy
    Given a migrating session storage over a secure store and a legacy store
    When a value is saved for the session key
    Then the value is written to the secure store
    And the legacy store copy for that key is removed

  @s2
  Scenario: A pre-existing AsyncStorage session is migrated on first read
    Given the secure store is empty and the legacy store holds the session
    When the session value is read
    Then the value is written to the secure store
    And the legacy store copy is removed
    And the read returns the migrated value

  @s3
  Scenario: A session already in SecureStore is read without touching legacy
    Given the secure store holds the session value
    When the session value is read
    Then the value is returned from the secure store
    And the legacy store is not read

  @s4
  Scenario: No session in either store returns null
    Given both the secure store and the legacy store are empty
    When the session value is read
    Then null is returned

  @s5
  Scenario: Removing the session clears both stores
    Given a migrating session storage over a secure store and a legacy store
    When the session key is removed
    Then the secure store removes the key
    And the legacy store removes the key

  @s6
  Scenario: SecureStore failures surface as StorageError
    Given the secure store getItemAsync rejects
    When the adapter reads the key
    Then a StorageError is thrown

  @s7
  Scenario: SecureStore has no bulk clear
    Given the secure storage adapter
    When clear is called
    Then a StorageError is thrown
