# AI Usage Log: NativeWind and Zustand Setup

## Task / Problem

Configure NativeWind for the client Home screen and add Zustand only where useful for presentation state, while protecting game logic from UI-library dependencies.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked to add NativeWind to `arrow-maze-client`, use it in Home and future screens, ensure game logic cannot use NativeWind, and consider Zustand if useful. The user provided NativeWind docs and asked Codex to look up Zustand docs.

## Result Obtained

Added NativeWind/Tailwind/Babel/Metro setup, NativeWind TypeScript types, a global Tailwind CSS file, a styled Home screen, and a small Zustand presentation store for Home UI state. Updated architecture rules and lint restrictions so NativeWind and Zustand cannot be imported from domain/application layers.

## Team Modifications Pending Human Review

- Confirm the Home visual direction before expanding it into real screens.
- Confirm whether Zustand should remain limited to UI state or later receive approved application-facing adapters.
- Review dependency versions after Expo SDK upgrades.

## Lessons / Limitations

NativeWind is a presentation concern, not a game architecture concern. Zustand is useful for view-model/UI state but must not replace domain entities, value objects, use cases, or approved application ports.
