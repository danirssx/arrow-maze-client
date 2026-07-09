# Spec - Mobile audio effects and background music (Client / Mobile)

Date: 2026-07-09
Ticket: `MAZ-217`
Source: Linear issue `MAZ-217` / M12 closeout plan
Status: Approved and implemented locally. The `@s` scenarios in
`specs/mobile-audio-MAZ-217.feature` are the executable contract for this slice.

## Purpose

Fix mobile audio so gameplay effects and screen-scoped background music are
audible, respect the existing mute setting, and release audio resources when
Home or Gameplay unmount.

## In scope / Out of scope

- In scope: diagnose missing playback assets/wiring, play one effect for valid
  tap, undo, victory, and defeat, add Home and Gameplay background music, use
  local safe-to-version placeholder assets, stop the active screen music on
  unmount, and honor mute.
- Out of scope: invalid tap effect, restart effect, advanced mixing/ducking,
  remote audio downloads, user-selectable tracks, and changing game rules.

## Behavior

Sound effects are screen side effects, not game rules. When sound is enabled,
valid gameplay actions produce exactly one effect:

- A valid arrow extraction plays the move effect.
- A successful undo plays the undo effect.
- The first transition into victory plays the victory effect.
- The first transition into defeat plays the defeat effect.

Background music is scoped to visible screens. Home starts Home music when it
mounts; Gameplay starts Gameplay music when it mounts. The current screen stops
its music when it unmounts or when sound is muted. Entering Gameplay from Home
therefore stops Home music before Gameplay music starts. Re-entering a screen
starts only that screen's track.

Mute is the single audio gate. When muted, no new effects or background tracks
start, and any active screen-scoped background track is stopped.

## Architecture placement (domain -> application -> presentation; inward-only deps)

- Domain: no previsto. Game rules and events remain unchanged.
- Application: may extend existing audio ports with simple primitive keys and a
  stop handle contract. No framework or infrastructure imports.
- Infrastructure/Adapters: Expo audio adapter loads local placeholder assets,
  plays one-shot effects, loops background tracks, and unloads/stops resources.
- Presentation (MVVM): may expose UI-level audio cues or call controller intents
  that remain rule-free. Views render state and dispatch intents only.
- Framework (composition root): wires the concrete audio adapter/facade and owns
  screen lifecycle hooks for start/stop background music.

## Clean Architecture contract

Applicable rules from `docs/reglas_clean_arch.md`:

- [x] Regla de dependencia (dependencies point inward only)
- [x] Independencia del dominio (no RN/Expo/storage/http/navigation in `src/domain`)
- [x] Application solo orquesta (no business rules, no infra/framework/presentation imports)
- [x] Repositorios: interfaz adentro (port), implementación afuera (infrastructure)
- [x] DTOs simples en fronteras (primitives/records, no raw domain entities/types)
- [x] Invariantes en VO/agregados (no in ViewModels/screens)
- [x] MVVM: View dumb, ViewModel solo presentación, streams/view state, composition root en framework

Layer impact:

- Domain: no previsto.
- Application: audio port/type changes only if needed for background lifecycle.
- Infrastructure/Adapters: Expo audio adapter/facade resource lifecycle and asset mapping.
- Presentation (MVVM): Home/Game audio trigger integration without business rules.
- Framework (composition root): concrete audio wiring and screen mount/unmount lifecycle.

Forbidden moves:

- [ ] `src/domain` importing React/RN/Expo/storage/http/navigation
- [ ] `src/application` importing `infrastructure`/`framework`/`presentation`
- [ ] Views/screens containing business rules, framework side effects, or dependency composition
- [ ] ViewModels calculating scoring/progress/authorization/persistence or domain results
- [ ] DTOs to presentation re-exporting raw domain entities/types
- [ ] NativeWind/Zustand/svg/reanimated imported by `domain`/`application` or game-rule logic

Required tests:

- Domain: not required unless implementation changes game events.
- Application: port-level tests if new audio lifecycle contracts are introduced.
- Infrastructure: unit tests with `expo-av` mocked for one-shot playback,
  looped background playback, mute gating, and cleanup/unload behavior.
- Presentation/UI or framework: tests for Home/Game screen lifecycle and gameplay
  cue triggering with a fake audio service.

Architecture acceptance criteria:

- Given the touched layers in this ticket, When imports are inspected, Then dependencies point inward only.
- Given audio crosses boundaries, When DTOs/keys are inspected, Then they are simple strings/records and not raw Expo objects.
- Given gameplay outcomes are involved, When implementation is inspected, Then rules remain in existing domain/application code and audio remains a side effect.

## Edge cases

- Missing or failing asset load does not crash the screen; the failure is logged
  or swallowed by the adapter boundary.
- Repeated Victory/Defeat renders do not replay terminal effects.
- Disabled undo does not play an undo effect.
- Muting while music is playing stops the active track.
- Unmount cleanup is idempotent.

## Acceptance criteria (Given/When/Then)

- S1: Given sound is enabled, When a valid arrow tap extracts an arrow, Then the move effect plays exactly once.
- S2: Given sound is enabled, When undo restores an extracted arrow, Then the undo effect plays exactly once.
- S3: Given sound is enabled, When the game transitions to victory or defeat, Then the matching terminal effect plays exactly once.
- S4: Given sound is muted, When valid tap, undo, victory, or defeat happens, Then no effect plays and no music starts.
- S5: Given Home is visible and sound is enabled, When the screen mounts and unmounts, Then Home background music starts and is stopped/cleaned up on unmount.
- S6: Given Gameplay is visible and sound is enabled, When the screen mounts and unmounts, Then Gameplay background music starts and is stopped/cleaned up on unmount.
- S7: Given audio assets are inspected, When source/license is reviewed, Then they are local safe-to-version placeholders or documented as free placeholders.

## Decisions

- Background transition: stop the previous screen's music instead of lowering
  volume. Reason: the ticket excludes advanced mixing and stopping gives a clear
  leak-free lifecycle. Discarded alternative: ducking/crossfade.
- Assets: use local placeholder tones/tracks committed with license/source notes.
  Reason: deterministic offline tests and demo safety. Discarded alternative:
  remote or proprietary sample packs.
- Trigger ownership: keep audio as a framework/presentation side effect and do
  not add audio logic to domain rules. Reason: domain events are UI-neutral.
  Discarded alternative: domain-level audio commands.

## Risks / OPEN QUESTIONS

- Manual validation still needs a device/emulator because Jest mocks cannot prove
  native audio output.
- Exact placeholder asset generation/source must be documented in the
  implementation commit.
