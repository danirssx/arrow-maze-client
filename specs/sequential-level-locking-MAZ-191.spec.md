# Spec: Sequential level locking (MAZ-191 — client)

## Problem

Players can enter any level directly, including via deep link / manual navigation.
The product wants a sequential progression: level N+1 is locked until level N is
completed.

## Goal

Enforce sequential level progression in the mobile client, offline-first, without any
backend enforcement (backend integrity is explicitly out of scope for this ticket).

## Chosen design

- **Domain rule (pure):** a new `LevelUnlockPolicy` in `src/domain/progress`. A level
  is unlocked iff it is the first in catalog order, OR its immediate predecessor (by
  order) is completed, OR the level itself is already completed (so a replay is always
  allowed and an offline/legacy progress gap never permanently locks a beaten level).
  It decides from an ordered `{id, order}[]` + the set of completed level ids only.
- **ViewModel:** `LevelListItem` gains `locked: boolean`. `LevelSelectViewModel.getLevels`
  / `loadLevels` accept `completedLevelIds` and apply the policy (default `[]` → only the
  first level unlocked, i.e. a brand-new user).
- **List UI:** `LevelCard` renders a dimmed, non-pressable tile with a lock indicator
  when `locked`; `app/levels.tsx` reads the authenticated user's progress
  (offline-first via `ProgressFacade.load`) and feeds the completed ids to the VM.
- **Route guard:** `app/game.tsx` blocks a locked level reached by deep link/manual
  navigation — it loads progress, asks the policy `isUnlocked`, and if locked renders a
  locked-state screen (i18n) with a "Back to levels" action instead of the board.

The rule lives in the domain; the ViewModel and routes only orchestrate and render.

## Scope

- `src/domain/progress/LevelUnlockPolicy.ts` (+ index export).
- `src/presentation/view-models/LevelSelectViewModel.ts` (`locked` flag).
- `src/presentation/components/LevelCard.tsx` (locked visual + press block).
- `app/levels.tsx` (load progress → completed ids), `app/game.tsx` (route guard).
- `src/framework/i18n/locales/{en,es}.json` (locked copy).
- Domain + presentation + integration tests.

## Out of Scope

- Backend enforcement of progression (separate integrity ticket if approved).
- Monetization / coins / unlock purchases.
