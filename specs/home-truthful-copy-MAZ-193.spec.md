# Spec: Align Home copy with navigation targets (MAZ-193 — client)

## Problem

The Home screen's labels did not match where they navigated:

- 🏆 "Daily challenges" card routed to **Progress**.
- 🎁 "Win rewards" card routed to **Leaderboard**.
- ➡️ "Follow the arrow" card routed to **Level Select** (duplicate of Play).
- A second primary "Challenges" button also routed to **Level Select** (duplicate).

The rewards / daily-challenge / follow copy implies screens that do not exist, which
makes the app feel broken even though navigation technically works.

## Goal

Make every Home label/card/icon truthful: its text names the destination it opens.
No new screens (daily/rewards/social are out of scope).

## Changes (presentation + i18n only)

`HomeScreen` now renders the brand + one primary **Play** button (→ level select) and a
three-card row whose labels name their real destinations:

| Card | Icon | Label | Destination |
| --- | --- | --- | --- |
| `home-card-leaderboard` | 🏆 | Leaderboard / See the top scores | `onLeaderboard` → `/leaderboard` |
| `home-card-progress` | 📈 | Your progress / Levels you've completed | `onProgress` → `/progress` |
| `home-card-settings` | ⚙️ | Settings / Sound, language and account | `onSettings` → `/settings` |

Removed: the duplicate "Challenges" primary button, the redundant "Follow the arrow"
card, and the misleading "Daily challenges" / "Win rewards" labels (and their i18n
keys). The `onChallenges` prop is dropped; `app/index.tsx` stops wiring it. The visual
hierarchy (brand → primary CTA → card row) is preserved.

i18n `home.*` keys are replaced with `cardLeaderboard*`, `cardProgress*`,
`cardSettings*` in both `en.json` and `es.json`.

## Scope

- `src/presentation/screens/HomeScreen.tsx`, `app/index.tsx`.
- `src/framework/i18n/locales/{en,es}.json` (`home` namespace).
- `tests/presentation/screens/HomeScreen.test.tsx`.

## Out of Scope

- New screens for daily challenges, rewards, or social following.
- Backend changes.
