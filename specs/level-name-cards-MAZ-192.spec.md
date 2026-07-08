# Spec: Show level names clearly in preview cards (MAZ-192 - client)

## Problem

The level list cards only showed the order number, difficulty stars and a timed
badge. A player could not tell which level a card represents by name - only by its
position/difficulty/visual data.

## Goal

Every level preview/card identifies the level with its product name, for both the
backend-driven catalog and the offline fixture fallback, and stays readable on small
screens.

## Changes (presentation only)

- `LevelCard` renders `level.name` truncated to one line (`numberOfLines={1}`),
  centered between the order number and the difficulty stars.
- The accessibility label leads with the name
  (`"<name>, level <order>, <difficultyLabel>"` or locked state).
- Order, difficulty metadata, timed metadata, and MAZ-191 locked-card behavior are
  preserved.

No data change: `LevelListItem.name` is already populated from both sources
(`LevelSelectViewModel.toBaseItem` from backend `LevelCatalogSummary.name`, and
`getLevels()` from `manualLevels.ts` fixture names). This ticket only surfaces it on
the card. Names are catalog data, not i18n strings.

## Scope

- `src/presentation/components/LevelCard.tsx`.
- `tests/presentation/components/LevelCard.test.tsx`.
- `tests/presentation/screens/LevelSelectScreen.test.tsx`.

## Out of Scope

- Backend catalog rules (unchanged).
- Progress-screen names (MAZ-189) - separate, but both use the same catalog name
  source.
- Sequential level locking (MAZ-191) - existing behavior preserved while resolving the
  PR conflict.
