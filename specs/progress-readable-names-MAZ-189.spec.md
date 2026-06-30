# Spec: Readable level names and friendly sync status (MAZ-189 — client)

## Problem

The Progress screen showed raw UUIDs such as
`550e8400-e29b-41d4-a716-446655440040` whenever a level name could not be resolved
(MAZ-186 wired the `levelId -> name` map but fell back to the raw `levelId`). It also
showed the technical label "Pending sync", which is accurate but unclear to a player.

## Goal

Make Progress readable: show level names first, never expose a full UUID as the
primary label, and explain the sync state in product language (English + Spanish).

## Changes

- `ProgressScreen` row label falls back to a readable i18n string
  (`progress.unknownLevel`) instead of the raw `levelId`, so a UUID is never the
  primary label.
- `progress.pendingSync` copy becomes product language ("Saved on this device — it
  will sync soon" / "Guardado en este dispositivo — se sincronizará pronto"). It still
  renders only while `pendingSync === true`, so it disappears after a successful sync.
- New `progress.unknownLevel` key in `en.json` + `es.json`.

The level name still resolves from the catalog (`LevelSelectViewModel.getLevels()` →
backend `LevelCatalogSummary.name` online, `manualLevels.ts` draft names offline) via
the `levelNameById` map the route already builds. No new data source.

## Scope

- `src/presentation/screens/ProgressScreen.tsx` (presentation only).
- `src/framework/i18n/locales/{en,es}.json` (copy).
- `tests/presentation/screens/ProgressScreen.test.tsx`.

## Out of Scope

- Backend progress rules (unchanged).
- Hiding real sync failures: retryable failures still keep `pendingSync` and the
  permanent-rejection handling from MAZ-190 is unchanged; this ticket only relabels
  the pending state for the player.
