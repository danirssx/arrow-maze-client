# Defense Notes — Daniella Cruz (Dev C)

Preparation notes for the oral defense. Focus on Daniella's assigned work block:
**Backend**: Leaderboard bounded context (AM-033–AM-035) + Player Progress bounded context (AM-036–AM-041)
**Client**: Mobile infrastructure adapters + auth + progress/leaderboard repos + settings/audio (AM-042–AM-047)

---

## Backend — Leaderboard (AM-033 to AM-035)

### What I built

The Leaderboard bounded context: domain model, application use cases, PostgreSQL adapter, and HTTP endpoints.

### Key decisions to explain

**Why does `Leaderboard.addEntry()` keep only the best score per userId?**
Leaderboard integrity — a user should appear once, with their personal best. Allowing duplicates would inflate rankings.

**Why JSONB for leaderboard entries instead of a separate rows table?**
The aggregate is always read and written as a whole (load leaderboard → add entry → save). JSONB keeps it atomic and avoids a JOIN. The tradeoff is that you can't query individual entries with SQL easily, but we don't need to.

**Where does the transaction boundary sit?**
`SubmitScoreUseCase` is wrapped in `TransactionDecorator` at the composition root (framework layer). The use case itself knows nothing about transactions — that's the AOP Decorator pattern at work.

**How does `UseCaseLoggingDecorator` avoid leaking tokens?**
It uses `sanitizeLogContext` which strips any field whose key matches `password`, `token`, `secret`, `credential`, or `authorization`. The test `should_not_log_input_values_when_use_case_runs` verifies this.

### Patterns to reference

| Pattern | Where |
| --- | --- |
| Aggregate Root | `Leaderboard` — controls all mutations to entries |
| Value Object | `LeaderboardEntry`, `LevelScore`, `Rank`, `EntryId` |
| Repository | `PgLeaderboardRepository` |
| Adapter | `PgLeaderboardRepository` implements `ILeaderboardRepository` |
| AOP Decorator | `UseCaseLoggingDecorator` wraps use cases without modifying them |
| Unit of Work | `PgUnitOfWork` — BEGIN/COMMIT/ROLLBACK without use case knowing |
| Domain Event | `LeaderboardUpdatedEvent` emitted on `addEntry` |

---

## Backend — Player Progress (AM-036 to AM-041)

### What I built

The Player Progress bounded context: domain aggregate with merge policy for offline sync, application use cases including `SyncProgressUseCase`, PostgreSQL adapter, and HTTP endpoints.

### Key decisions to explain

**What is `ProgressMergePolicy` and why is it in the domain layer?**
It defines the rule for resolving a conflict between the client's offline progress and the server's stored progress: union of all completed levels, keeping the best score per levelId when both sides have data for the same level. It's in the domain because "best score wins" is a business rule, not a storage concern.

**Why does `PlayerProgress.recordCompletion()` check for the best score?**
Idempotency. If a player completes a level twice (e.g., offline and online), we keep the better performance, not the duplicate.

**How does `SyncProgressUseCase` work?**
1. Receives the client's local progress payload.
2. Loads the server's aggregate from `IProgressRepository`.
3. Applies `ProgressMergePolicy.merge(serverProgress, clientProgress)`.
4. Saves the merged result back to the database.
5. Returns the merged result to the client.

**What does the `version` column in the `player_progress` table do?**
Optimistic concurrency — it increments on each save and the sync endpoint can detect stale writes without row-level locks.

### Patterns to reference

| Pattern | Where |
| --- | --- |
| Aggregate Root | `PlayerProgress` |
| Value Object | `CompletedLevel`, `ProgressId` |
| Merge Policy (Strategy-like) | `ProgressMergePolicy` |
| Repository | `PgProgressRepository` |
| Adapter | `PgProgressRepository` implements `IProgressRepository` |
| AOP Decorator | `UseCaseLoggingDecorator`, `TransactionDecorator` |

---

## Client — Mobile Infrastructure Adapters (AM-042)

### What I built

HTTP client port + Axios adapter, local storage port + AsyncStorage adapter, and AOP wrappers for mobile use cases.

### Key decisions to explain

**Why a port (`IHttpClient`) instead of using Axios directly in use cases?**
Dependency Inversion Principle. Use cases depend on an abstraction, not a framework. This means you can swap Axios for fetch, mock it in tests, or replace it entirely without touching business logic.

**What was the `exactOptionalPropertyTypes` issue with Axios?**
TypeScript's `exactOptionalPropertyTypes: true` flag disallows assigning `undefined` to optional properties. `AxiosRequestConfig` has optional `headers` and `params`. The fix was to build the config object conditionally:
```typescript
const axiosConfig: AxiosRequestConfig = {};
if (config?.headers !== undefined) axiosConfig.headers = config.headers;
if (config?.params !== undefined) axiosConfig.params = config.params;
```

**Why does `LoggingUseCaseWrapper` never log the input?**
Inputs can contain access tokens, passwords, or personal data. The DoD explicitly requires no tokens in logs. The test `should_not_log_input_values_to_prevent_token_leakage` verifies this.

---

## Client — Auth (AM-043)

### What I built

Auth ports, DTOs, mapper, HTTP repository, session manager, and auth use cases.

### Key decisions to explain

**Why Singleton for `SessionManager`?**
There should be exactly one session at a time in the app. Singleton enforces this and prevents multiple instances from disagreeing about the current session state.

**Why `static resetInstance()` on `SessionManager`?**
Testability. Each test suite calls `resetInstance()` in `beforeEach` to start with a clean state. Without it, singleton state from one test leaks into the next.

**Why does `AuthMapper.toSession()` exist instead of mapping inline?**
Mapper pattern keeps DTO→domain translation in one place. If the backend changes the response shape, only the mapper changes.

---

## Client — Progress and Leaderboard (AM-044)

### What I built

Offline-first local progress repository, remote progress sync, leaderboard HTTP repository, and Facade layer.

### Key decisions to explain

**What is `pendingSync: true` for?**
Offline-first flag. When the user completes a level offline, `saveOffline()` stores it locally with `pendingSync: true`. When connectivity is restored, `ProgressFacade.sync()` calls the backend and clears the flag.

**Why did you need to create `IRemoteProgressRepository` as a port?**
ESLint's `import/no-restricted-paths` rule caught that `ProgressFacade` (application layer) was importing `HttpProgressRepository` (infrastructure layer) directly. Clean Architecture requires application to depend on abstractions. The fix was to define an `IRemoteProgressRepository` interface in `src/application/ports/` and have `HttpProgressRepository` implement it.

**Why use the Facade pattern for `ProgressFacade` and `LeaderboardFacade`?**
ViewModels should not interact with `IHttpClient` or `ILocalStorage` directly. Facades encapsulate the coordination logic (load from cache, fallback to remote, save, sync) behind a simple interface.

---

## Client — Settings, Audio, i18n (AM-046)

### What I built

Language settings, mute toggle, AudioFacade, ExpoAudioAdapter, shared UI components (LoadingState, ErrorState, EmptyState), and SettingsScreen.

### Key decisions to explain

**Why Singleton for `AudioFacade`?**
Same rationale as `SessionManager` — there is one audio context for the whole app. You don't want two independent `AudioFacade` instances with different mute states.

**How does mute work?**
`AudioFacade._muted` flag. `AudioFacade.play(sound)` is a no-op when `_muted = true`. The mute state is never checked by the ViewModel or the sound adapter — only by the facade.

**Why does `ExpoAudioAdapter` not know about the mute flag?**
Single Responsibility. The adapter's only job is to play a sound. The mute decision is a business rule owned by the facade.

---

## General Topics for Any Question

### Why Clean Architecture for a mobile game?

It separates game rules (domain) from device-specific concerns (Expo, AsyncStorage, Axios). You can unit-test the entire game engine without a simulator. If Expo is deprecated, only the adapters change.

### How did you ensure no secrets leak?

1. `LoggingUseCaseWrapper` never logs inputs (test proves it).
2. `sanitizeLogContext` strips sensitive fields from error logs.
3. Contract test fixtures use placeholder tokens (`contract-test-token-placeholder`).
4. `.env` is never committed (`.gitignore`).
5. No API keys appear in any source file, doc, or AI usage log.

### What is the most important pattern you used?

**Dependency Inversion / Ports and Adapters.** Every time the application layer depends on an interface instead of a concrete class, it becomes testable, swappable, and boundary-safe. The Axios adapter, AsyncStorage adapter, and PostgreSQL repositories all exist because of this principle.

### What would you do differently?

Add stricter linting (especially `import/no-restricted-paths`) at project setup — not after three sprints of code. The architecture violation in AM-044 was caught by the linter, but it would have been better to catch it at PR #1.

---

_Prepared for AM-048 final delivery — 2026-06-18_
