# Spec: Show level names clearly in preview cards (MAZ-192 — client)

## Problem

The level list cards only showed the order number, difficulty stars and a timed
badge. A player could not tell which level a card represents by name — only by its
position/difficulty/visual data.

## Goal

Every level preview/card identifies the level with its product name, for both the
backend-driven catalog and the offline fixture fallback, and stays readable on small
screens.

## Changes (presentation only)

- `LevelCard` now renders `level.name` (truncated to one line, `numberOfLines={1}`,
  centered, small font) between the order number and the difficulty stars, and folds
  the timed badge inline with the stars to keep the fixed-height tile uncluttered.
- The accessibility label now leads with the name
  (`"<name>, level <order>, <difficultyLabel>"`).
- Order and difficulty metadata are preserved.

No data change: `LevelListItem.name` is already populated from both sources
(`LevelSelectViewModel.toListItem` ← backend `LevelCatalogSummary.name`, and
`getLevels()` ← `manualLevels.ts` fixture names). This ticket only surfaces it on the
card. Names are catalog data, not i18n strings.

## Scope

- `src/presentation/components/LevelCard.tsx`.
- `tests/presentation/components/LevelCard.test.tsx`,
  `tests/presentation/screens/LevelSelectScreen.test.tsx`.

## Out of Scope

- Backend catalog rules (unchanged).
- Progress-screen names (MAZ-189) — separate, but both use the same catalog name
  source.
