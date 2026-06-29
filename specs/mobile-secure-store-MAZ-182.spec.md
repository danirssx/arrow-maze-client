# Spec — Store JWT in expo-secure-store instead of AsyncStorage (Client / Mobile)

Date: 2026-06-28
Ticket: `MAZ-182` (M9 — Mandatory Auth & Leaderboard/Progress Fixes; C4)
Source: M9 audit, "client-auth defect #4"
Status: approved. The `@s` scenarios in `specs/mobile-secure-store-MAZ-182.feature`
are the executable contract for this slice.

## Purpose

The persisted `AuthSession` (which embeds the 7-day `accessToken`) is written to
**plaintext AsyncStorage** (`src/framework/config/session.ts` wires
`SessionManager` over `AsyncStorageAdapter`). `expo-secure-store` is not even a
dependency, so for a mandatory-auth product the bearer token is recoverable from
device storage. This slice moves the session blob to the OS keychain/keystore via
`expo-secure-store`, and migrates any existing AsyncStorage session on first read
so users are not logged out by the update.

## In scope / Out of scope

- In scope:
  - Add `expo-secure-store`; new `SecureStorageAdapter` (infrastructure) over it.
  - A `MigratingSessionStorage` decorator (infrastructure) that reads secure-first
    and performs a one-time legacy → secure migration on first read, purging the
    plaintext copy.
  - Point `createSessionManager()` (framework composition root) at the secure,
    migrating storage.
  - `__mocks__/expo-secure-store.js` + tests for the adapter and the migration path.
- Out of scope:
  - The mandatory-login gate / launch bootstrap (MAZ-179), 401 handling (MAZ-180),
    axios Bearer interceptor (MAZ-181). No change to `SessionManager`,
    `ISessionManager`, `ILocalStorage`, `AuthSession`, or any use case.

## Behavior

`SessionManager` stores/reads the whole `AuthSession` JSON under the single key
`arrow_maze_session` through an injected `ILocalStorage`. This slice swaps that
storage for a secure, migrating one without touching `SessionManager`:

- `SecureStorageAdapter implements ILocalStorage` over `expo-secure-store`:
  - `getItem` → `SecureStore.getItemAsync`
  - `setItem` → `SecureStore.setItemAsync`
  - `removeItem` → `SecureStore.deleteItemAsync`
  - failures wrap into `StorageError`.
  - `clear` (bulk) is unsupported — SecureStore has no clear-all API; it throws a
    `StorageError`. The session flow never bulk-clears (logout uses `removeItem`).
- `MigratingSessionStorage implements ILocalStorage` (Decorator) wrapping
  `secure` (primary) + `legacy` (AsyncStorage):
  - `getItem(key)`: return secure value if present; otherwise read legacy — if
    legacy has it, **migrate** (write to secure, remove from legacy) and return it;
    else `null`.
  - `setItem(key, value)`: write secure, then remove any legacy copy (no plaintext
    left behind).
  - `removeItem(key)`: remove from both secure and legacy.
  - `clear()`: clear legacy (plaintext) only; secure entries are keyed and removed
    via `removeItem` (documented; never reached by the session flow).

Invariant: after any login or first post-update read, the token lives only in
SecureStore; the legacy AsyncStorage copy is gone.

## Architecture placement (domain → application → presentation; inward-only deps)

Infrastructure-only. The application port `ILocalStorage` is unchanged; two new
adapters implement it; the framework composition root picks the secure one. No
domain, application, or presentation code changes. `expo-secure-store` is imported
only inside `src/infrastructure/storage`.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [x] Repositorios: interfaz adentro (port `ILocalStorage`), implementación afuera (infrastructure)
- [x] DTOs simples en fronteras (no boundary DTO change)
- [x] Invariantes en VO/agregados (no new invariants in ViewModels/screens)
- [x] MVVM: composition root stays in framework (`createSessionManager`)

Layer impact:

- Domain: `no previsto`.
- Application: `no previsto` (port `ILocalStorage` unchanged).
- Infrastructure/Adapters: new `SecureStorageAdapter` + `MigratingSessionStorage`
  (both `implements ILocalStorage`); reuse existing `StorageError`.
- Presentation (MVVM): `no previsto`.
- Framework (composition root): `createSessionManager()` now wires
  `MigratingSessionStorage(SecureStorageAdapter, AsyncStorageAdapter)`.

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] `expo-secure-store` imported outside `src/infrastructure`

Required tests:

- Domain: none.
- Application: none.
- Infrastructure: `SecureStorageAdapter` (get/set/remove/error/clear-unsupported)
  and `MigratingSessionStorage` (secure-first, migrate-on-read, purge legacy on
  set/remove).

Architecture acceptance criteria:

- Given the touched layers, When imports are inspected, Then `expo-secure-store`
  appears only under `src/infrastructure` and deps point inward only.
- Given the boundary, When `ILocalStorage` is inspected, Then it is unchanged.
- Given persistence concerns, When implementation is inspected, Then no business
  rule moved into a ViewModel/screen.

## Edge cases

- Secure already has the session (no migration, no legacy read needed beyond miss).
- Legacy empty and secure empty → `null` (logged-out, no migration).
- Migration write fails → surfaces `StorageError`; legacy copy is not removed
  (no data loss) because the secure write throws before the legacy delete.
- Fresh login with a stale legacy copy → `setItem` writes secure and purges legacy.
- `clear()` bulk on SecureStore → unsupported (`StorageError`); not used by the
  session flow.

## Acceptance criteria (Given/When/Then)

- S1: Given a login (session save), When it persists, Then the value is written via
  SecureStore (`setItemAsync`) and any legacy AsyncStorage copy is removed.
- S2: Given a pre-existing AsyncStorage session and an empty SecureStore, When the
  session is read on launch, Then it is migrated (written to SecureStore, removed
  from AsyncStorage) and returned so the user stays logged in.
- S3: Given a session already in SecureStore, When it is read, Then it is returned
  from SecureStore without touching AsyncStorage.
- S4: Given neither store has a session, When it is read, Then `null` is returned.
- S5: Given a logout (removeItem), When it runs, Then the key is removed from both
  SecureStore and AsyncStorage.
- S6: Given `SecureStore` operations, When they fail, Then a `StorageError` is thrown.
- S7: Given `SecureStorageAdapter.clear()`, When called, Then it throws a
  `StorageError` (SecureStore has no bulk clear).

## Decisions

- **Store the whole `AuthSession` blob in SecureStore (not just the raw token).**
  The session already serializes as one small JSON value (`userId`, `username`,
  `role`, `accessToken`) under one key, well within SecureStore limits and a valid
  key (`arrow_maze_session`). This secures the token with the smallest change and
  keeps `SessionManager` untouched. Discarded: splitting token (secure) vs profile
  (AsyncStorage), which would complicate `SessionManager` for no real benefit at
  this payload size.
- **Migrate lazily inside a `MigratingSessionStorage` Decorator, on first read.**
  Decorator is an established GoF pattern in this project (documented in the file
  header per AGENTS §2). The migration triggers on the first `get()` without
  depending on a launch-bootstrap hook (MAZ-179 is a separate, not-yet-done
  ticket). Discarded: a one-shot migration function called from app bootstrap —
  there is no bootstrap seam yet, so it could silently never run.
- **`SecureStorageAdapter.clear()` throws instead of silently succeeding.**
  SecureStore has no clear-all; a silent no-op would hide retained data. The
  session flow only uses `removeItem`, so this is never reached in practice.

## Risks / OPEN QUESTIONS

- `expo-secure-store` is a native module; it is mocked in Jest (`__mocks__`),
  so behavior is verified against the contract, not the real keychain. Device
  validation (real keychain read/write + migration) needs `expo run` and is out of
  scope here.
- `expo install` added the `expo-secure-store` config plugin to `app.json`
  (required for the iOS keychain entitlement). Native rebuild required for the
  plugin to take effect on device.
