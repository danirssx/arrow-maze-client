# MAZ-159 - Progress merge domain policy

## Purpose

Move the client progress merge/best-score rule out of `ProgressFacade` and into
the pure domain layer.

## In Scope

- Add a client domain model/policy for completed-level progress comparisons.
- Keep the business rule equivalent to backend progress:
  higher score wins; if scores tie, lower `timeSeconds` wins.
- Keep `ProgressFacade` as an application orchestrator for local and remote
  repositories.

## Out Of Scope

- Backend endpoint changes.
- Offline-first workflow redesign.
- Presentation or ViewModel behavior changes.

## Clean Architecture Contract

Applicable rules from `docs/reglas_clean_arch.md`:

- Regla de dependencia.
- Independencia del dominio.
- Application solo orquesta.
- DTOs simples en fronteras.
- Invariantes/reglas de negocio en dominio.

Layer impact:

- Domain: add progress model/policy.
- Application: map DTOs to domain and delegate merge.
- Infrastructure: no planned changes.
- Framework: no planned changes.
- Presentation: no planned changes.

Forbidden moves:

- Domain importing application, infrastructure, framework, React Native, Expo,
  storage, HTTP, or presentation.
- Application reimplementing score/time comparison logic.
- DTOs exposing domain entities to presentation.

## Acceptance Criteria

- S1: Given an existing completion with a better score, when a worse completion
  arrives, then the existing completion is preserved.
- S2: Given equal scores and a faster new completion, when completions are
  merged, then the faster completion replaces the older one.
- S3: Given `ProgressFacade`, when it completes a level, then it delegates
  completion merge to domain and contains no score/time comparison rule.
- S4: Given backend progress behavior, when client policy is inspected, then the
  criterion remains equivalent: higher score wins, tie by faster time.

## Decisions

- Use a domain policy because the rule determines the best business result for a
  completed level; application should only orchestrate repositories.
- Keep `CompletedLevelData` as an application DTO and map it at the facade
  boundary to avoid importing application types into domain.
