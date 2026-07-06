# Spec — <feature title> (Client / Mobile)

> Copy this file to `specs/<feature>.spec.md` and fill every section. The
> `## Clean Architecture contract` block is **mandatory** for any ticket that
> touches `src` and is the section the `judge` enforces (`.agents/judge.md`).
> The normative source for the architecture rules is `docs/reglas_clean_arch.md`
> (mirror of the workspace root `../reglas_clean_arch.md`), including the MVVM
> rules.

Date: <YYYY-MM-DD>
Ticket: `<MAZ-###>` (temporary id `<CA-###>` if any)
Source: `<plan or report>`
Status: <Backlog / Todo / approved>. The `@s` scenarios in
`specs/<feature>.feature` are the executable contract for this slice.

## Purpose

One precise paragraph: what behavior this slice adds or fixes, and why.

## In scope / Out of scope

- In scope: ...
- Out of scope: ...

## Behavior

What the system does, in precise prose. Domain invariants enumerated.

## Architecture placement (domain → application → presentation; inward-only deps)

Describe where each piece lives and the view-state the View consumes.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md` (check every rule the slice
must honor; the judge verifies each one PASS/FAIL with `file:line` evidence):

- [ ] Regla de dependencia (dependencies point inward only)
- [ ] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [ ] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [ ] Repositorios: interfaz adentro (port), implementación afuera (infrastructure)
- [ ] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [ ] Invariantes en VO/agregados (no en ViewModels/screens)
- [ ] MVVM: View dumb, ViewModel solo presentación, streams/view state, composition root en framework

Layer impact (state the concrete files/changes per layer, or `no previsto`):

- Domain:
- Application:
- Infrastructure/Adapters:
- Presentation (MVVM):
- Framework (composition root):

Forbidden moves (must stay unchecked / not introduced):

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain:
- Application:
- Presentation/UI:

Architecture acceptance criteria:

- Given the touched layers in this ticket, When imports are inspected, Then dependencies point inward only.
- Given boundaries are crossed, When DTOs are inspected, Then they are simple records/primitives.
- Given business invariants are involved, When implementation is inspected, Then they live in VO/agregados/domain services, not screens/ViewModels.

## Edge cases

Enumerate: empty/loading/error UI state, network failure, missing session, ...

## Acceptance criteria (Given/When/Then)

- S1: Given ... When ... Then ...
- S2: ...

## Decisions

Each decision with its reason and the discarded alternative.

## Risks / OPEN QUESTIONS

- ...
