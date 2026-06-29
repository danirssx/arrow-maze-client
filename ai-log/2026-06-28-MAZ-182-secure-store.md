# AI Usage Log: MAZ-182 (M9/C4) — Client: store JWT in expo-secure-store instead of AsyncStorage

## Task / Problem

The persisted `AuthSession` (which embeds the 7-day `accessToken`) was written to
**plaintext AsyncStorage** — `createSessionManager()` (`src/framework/config/session.ts`)
wired `SessionManager` over `AsyncStorageAdapter`, and `expo-secure-store` was not
even a dependency. For a mandatory-auth product the bearer token was recoverable
from device storage.

Goal: persist the session blob in the OS keychain/keystore via `expo-secure-store`
and migrate any existing AsyncStorage session on first read so users are not logged
out by the update. Infrastructure-only — no change to `SessionManager`,
`ISessionManager`, `ILocalStorage`, `AuthSession`, or any use case.

## Tool and Model

Claude Opus 4.8 via Claude Code CLI.

## Prompt Used

User requested starting MAZ-182 following the established team workflow (read both
`AGENTS.md`, root `MEMORY.md`, `Linear_MCP_Guideline.md`, the M9 memory; new
worktree; spec → Gherkin → TDD; ai-log + compile usage; commit/push/PR; update
Linear), noting it is a refactor so the related M9 tickets must be reviewed.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner (`.agents/spec-partner.md`) | Used | Wrote the spec after reading `SessionManager`, `session.ts`, `AsyncStorageAdapter`, `ILocalStorage`, `AuthSession`, `StorageError`, and the existing storage tests. Confirmed the 422-adjacent auth scope is owned by sibling tickets (179/180/181, still Backlog) so this slice stays infra-only. | `specs/mobile-secure-store-MAZ-182.spec.md` |
| Planner / Gherkin Author (`.agents/planner.md`) | Used | Distilled 7 Gherkin scenarios (`@s1..@s7`): save→secure+purge legacy, migrate-on-read, secure-first, null, remove-both, error→StorageError, clear-unsupported. | `specs/mobile-secure-store-MAZ-182.feature` |
| TDD Implementer (`.agents/tdd-implementer.md`) | Used | Red→Green per file: SecureStorageAdapter test (confirmed RED: module not found) → adapter; MigratingSessionStorage test (RED) → decorator; then wired `createSessionManager`. Added the expo-secure-store manual mock + jest.setup activation. | tests, code, `@s → test` map below |
| Judge (`.agents/judge.md`) | Referenced | Applied the `docs/reglas_clean_arch.md` checklist in-session: `expo-secure-store` confined to `src/infrastructure`; `ILocalStorage` port unchanged; composition root stays in framework; no domain/application/presentation change. No separate judge session run. | CA contract in `specs/mobile-secure-store-MAZ-182.spec.md` |
| Mutation Tester (`.agents/mutation.md`) | Used | Ran `stryker` scoped to the two new infra files (infra is outside the project's default mutate globs — `domain`/`application` only). First run 76% (1 real ConditionalExpression survivor on the migration null-guard + StringLiteral message survivors). Added a "no migration when empty" assertion + exact-message assertions; re-run 96%, `MigratingSessionStorage.ts` 100%. | scores below |

## Scenario Coverage (@s ↔ test)

| Scenario | Test | File |
|----------|------|------|
| @s1 — save writes secure + purges legacy | `should_write_to_secure_and_purge_legacy_when_saving` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| @s2 — migrate legacy session on first read | `should_migrate_legacy_session_to_secure_when_secure_is_empty` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| @s3 — secure-first, legacy untouched | `should_read_from_secure_and_not_touch_legacy_when_secure_has_value` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| @s4 — null when both empty | `should_return_null_and_not_migrate_when_neither_store_has_value` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| @s5 — remove clears both | `should_remove_key_from_both_stores_when_clearing_session` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| @s6 — SecureStore failure → StorageError | `should_throw_StorageError_when_{read,write,delete}_fails` | `tests/infrastructure/storage/SecureStorageAdapter.test.ts` |
| @s7 — clear unsupported | `should_throw_StorageError_when_called_because_secure_store_has_no_bulk_clear` | `tests/infrastructure/storage/SecureStorageAdapter.test.ts` |
| (edge) migration write fails → legacy kept | `should_keep_legacy_copy_when_secure_write_fails_during_migration` | `tests/infrastructure/storage/MigratingSessionStorage.test.ts` |
| (support) get/set/remove happy paths | `SecureStorageAdapter` get/set/remove tests | `tests/infrastructure/storage/SecureStorageAdapter.test.ts` |

## TDD Cycles

**Batch 1 — SecureStorageAdapter (RED → GREEN)**
- RED: `SecureStorageAdapter.test.ts` → module not found (and confirmed the
  expo-secure-store manual mock resolves).
- GREEN: `SecureStorageAdapter implements ILocalStorage` over
  `SecureStore.{getItemAsync,setItemAsync,deleteItemAsync}`, failures wrapped in
  `StorageError`, `clear()` throws (no bulk-clear API). 8/8.

**Batch 2 — MigratingSessionStorage decorator (RED → GREEN)**
- RED: `MigratingSessionStorage.test.ts` → module not found.
- GREEN: Decorator over (secure, legacy): secure-first read, one-time
  legacy→secure migration on miss (write secure → remove legacy, in that order so
  a failed write keeps the legacy copy), `setItem`/`removeItem` purge legacy,
  `clear()` wipes legacy. 24/24 storage tests.

**Batch 3 — wiring + mutation hardening**
- `createSessionManager()` now wires `MigratingSessionStorage(SecureStorageAdapter,
  AsyncStorageAdapter)`. Mutation surfaced a real survivor (`if (legacyValue ===
  null)` → `if (false)`); the null test didn't assert "no migration attempted".
  Added that assertion + exact error-message assertions. 96% / decorator 100%.

## Result Obtained

**New files:**
- `src/infrastructure/storage/SecureStorageAdapter.ts` — Adapter over expo-secure-store
- `src/infrastructure/storage/MigratingSessionStorage.ts` — Decorator (secure-primary + legacy migration)
- `__mocks__/expo-secure-store.js` — in-memory manual mock
- `specs/mobile-secure-store-MAZ-182.{spec.md,feature}` — CA spec + 7 scenarios
- `tests/infrastructure/storage/{SecureStorageAdapter,MigratingSessionStorage}.test.ts`

**Modified files:**
- `src/framework/config/session.ts` — composition root points at the secure, migrating storage
- `jest.setup.ts` — `jest.mock("expo-secure-store")` activates the manual mock globally
- `package.json` / `package-lock.json` — added `expo-secure-store@~15.0.8` (via `expo install`)
- `app.json` — `expo install` added the `expo-secure-store` config plugin (iOS keychain entitlement)

**Unchanged on purpose:** `SessionManager`, `ISessionManager`, `ILocalStorage`,
`AuthSession`, `LogoutUseCase`, `AsyncStorageAdapter`, `StorageError`.

## Verification

- `npm run verify` — GREEN: lint + typecheck + 61 suites / 309 tests.
- Scoped Stryker on the two new files: 96% (`MigratingSessionStorage.ts` 100%,
  `SecureStorageAdapter.ts` one cosmetic StringLiteral survivor — the `'__all__'`
  key arg of the `clear()` `StorageError`, message asserted but not the key field).
  Note: `src/infrastructure` is outside the project's default mutate globs
  (domain/application only), so this scoped run is supplementary, not the gate.

## Team Modifications Pending Human Review

1. **Whole session blob → SecureStore** (not a token/profile split). The blob is
   small (`userId`, `username`, `role`, `accessToken`) and the key
   `arrow_maze_session` is SecureStore-valid, so AC1 (token via SecureStore) holds
   with the smallest change and `SessionManager` untouched.
2. **`app.json` gained the `expo-secure-store` plugin** (added by `expo install`).
   A native rebuild is required for the keychain entitlement to apply on device.
3. **Migration is lazy, inside the storage decorator** — it runs on the first
   `get()` rather than a launch bootstrap (MAZ-179, not done yet). When MAZ-179
   adds a bootstrap gate, no change is needed here; migration already happens on
   the first session read.
4. **`SecureStorageAdapter.clear()` throws** (SecureStore has no bulk clear). Never
   reached by the session flow (logout uses `removeItem`).

## Lessons / Limitations

- `expo-secure-store` is a native module; it is verified against its contract via a
  Jest manual mock, not the real keychain. Device validation (real keychain + the
  AsyncStorage→SecureStore migration on a real upgrade) needs `expo run` and is out
  of scope here.
- The `__mocks__/*.js` manual mock needs `/* global jest */` (the existing svg/
  reanimated mocks dodge this by not referencing `jest`); without it eslint's
  `no-undef` fails the lint gate.
- Mutation caught a genuine gap: "returns null" alone didn't pin "doesn't attempt a
  spurious migration" — asserting the absence of the secure write killed the
  conditional mutant.
