# Spec - Visible gameplay timer (Client / Mobile)

Date: 2026-07-09
Ticket: `MAZ-220`
Source: Linear issue `MAZ-220` (M12-07) / `Sprint_Closeout_M12_Tickets_Draft.md`
Status: Contract for this slice. The `@s` scenarios in
`specs/gameplay-visible-timer-MAZ-220.feature` are the executable contract.

## Purpose

Show the player how long the current match has been running, as a purely visual
`mm:ss` readout, without touching scoring, persistence, or the result contract.

## In scope / Out of scope

- In scope: render elapsed match time in the gameplay HUD as `mm:ss`; keep the
  measurement testable from the ViewModel; stop advancing on victory, defeat, and
  screen exit; reset to zero on restart; reuse the existing elapsed-time metric.
- Out of scope: scoring changes, a new persisted timer metric, new timed levels,
  pause/resume UI, and any change to `LevelOutcomeDto` or the leaderboard/progress
  submit payloads.

## Behavior

The application layer already measures match time: `GameSession.elapsedMs()` reads
an injected domain `Clock`, and freezes the value the first time the level result
is terminal. That number is already published on `GameSnapshotDto.elapsedMs`.

This ticket therefore adds no new measurement. It surfaces the existing metric:

- The gameplay UI state carries `elapsedMs`, refreshed from the application
  snapshot on every gameplay action and on a periodic presentation tick.
- The view renders `elapsedMs` formatted as `mm:ss` (zero-padded, minutes not
  capped at 59 so a long match reads `61:07`).
- When the match reaches Victory or Defeat, `GameSession` freezes the elapsed
  value, the ticker stops, and the HUD keeps showing the final time.
- Restarting starts a new session clock, so the HUD returns to `00:00`.
- Leaving the gameplay screen unmounts the ticker; no timer work survives exit.

Reading a clock stays in the application/domain time port. The ViewModel never
calls `Date.now()`; it pulls the already-measured value from the `GameFacade`
snapshot. The periodic tick itself is a view lifecycle concern (a React effect),
not a game rule.

## Architecture placement (domain -> application -> presentation; inward-only deps)

- Domain: no change. `Clock` and level rules stay as they are.
- Application: no change. `GameSession.elapsedMs()` and `GameSnapshotDto.elapsedMs`
  already exist and keep their semantics (frozen on terminal result).
- Infrastructure/Adapters: no change.
- Presentation (MVVM): `GameUiState` gains a readonly `elapsedMs`; `GameViewModel`
  gains a `refreshElapsedTime()` intent that maps the snapshot value into UI state;
  a pure `formatElapsedTime` module renders `mm:ss`; a `useGameTimer` hook owns the
  interval lifecycle; `GameScreen` renders the value.
- Framework (composition root): no change.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [x] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [x] Invariantes en VO/agregados (no in ViewModels/screens)
- [x] MVVM: View dumb, ViewModel solo presentación, streams/view state, composition root en framework

Layer impact:

- Domain: none.
- Application: none.
- Infrastructure/Adapters: none.
- Presentation (MVVM): UI state field, ViewModel intent, pure formatter, view hook, HUD render.
- Framework (composition root): none.

Forbidden moves:

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels reading a clock, measuring time, or recomputing scoring/progress
- [ ] Changing `LevelOutcomeDto`, `SubmitScoreRequestDto`, or the progress payload
- [ ] DTOs to presentation re-exporting raw domain entities/types

Required tests:

- Domain: not required; no domain change.
- Application: not required; no application change. The existing
  `GameSessionMetrics` tests already pin frozen-on-terminal elapsed time.
- Presentation: pure formatter unit tests; ViewModel tests driving
  `refreshElapsedTime()` against a fake facade; screen test with fake timers that
  asserts the rendered `mm:ss` advances, freezes on a terminal overlay, and resets
  on restart.
- Contract: a regression test asserting the victory result contract
  (`LevelOutcomeDto` fields) is unchanged by this ticket.

Architecture acceptance criteria:

- Given the touched layers, When imports are inspected, Then presentation depends
  inward only and no domain/application file changes.
- Given the timer, When the ViewModel is inspected, Then it reads elapsed time from
  the application snapshot and never from a clock.
- Given the result submit path, When `LevelOutcomeDto` is inspected, Then its shape
  and values are unchanged.

## Edge cases

- `refreshElapsedTime()` before a level starts is a no-op (no snapshot exists).
- A tick that produces the same `elapsedMs` publishes no new UI state (no churn).
- A match longer than 59:59 keeps counting minutes (`61:07`), it does not wrap.
- Negative or non-finite input to the formatter renders `00:00`.
- The interval is cleared on unmount and when the match reaches a terminal result.

## Acceptance criteria (Given/When/Then)

- S1: Given a match is running, When time passes, Then the HUD shows the elapsed time in `mm:ss`.
- S2: Given a match is running, When the result becomes Victory or Defeat, Then the displayed time stops advancing.
- S3: Given a finished or running match, When the player restarts, Then the displayed time resets to `00:00`.
- S4: Given the player exits gameplay, When the screen unmounts, Then the ticker is cleared and no further refresh runs.
- S5: Given elapsed milliseconds, When they are formatted, Then the output is zero-padded `mm:ss` and non-finite/negative input renders `00:00`.
- S6: Given no level has started, When a tick fires, Then the ViewModel publishes no state.
- S7: Given a victory is submitted, When the result contract is inspected, Then score, time, and moves keep their current shape and values.

## Decisions

- Reuse `GameSession.elapsedMs()` instead of measuring in the ViewModel. Reason:
  the metric already exists, freezes correctly on terminal results, and reading a
  clock in presentation would duplicate the time source. Discarded alternative:
  a presentation-owned start timestamp.
- Tick every 500 ms rather than every second. Reason: a 1 s interval drifts against
  the session clock and can visibly skip a second; sub-second polling keeps the
  displayed second honest. Discarded alternative: 1000 ms.
- Keep the tick in a view hook, not in the ViewModel constructor. Reason: interval
  lifecycle is a view concern and keeps the ViewModel free of framework timers.
  Discarded alternative: a self-starting ticker inside `GameViewModel`.
- Do not cap minutes at 59. Reason: the game has no hour boundary and a wrapped
  timer would lie. Discarded alternative: `hh:mm:ss`.

## Risks / OPEN QUESTIONS

- Pause/resume use cases exist on the facade but no UI currently pauses a match;
  the timer keeps running through a hypothetical pause. That stays out of scope
  until a pause UI is specified.
- Real-device smoothness of the 500 ms tick is not proven by Jest fake timers.
