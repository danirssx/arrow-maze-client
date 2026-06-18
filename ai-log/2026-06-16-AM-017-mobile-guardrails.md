# AI Usage Log: AM-017 Mobile Guardrails

## Task / Problem

Resolve AM-017 by hardening the mobile architecture and test setup without implementing gameplay. The user also pointed to the root `design/` folder as the visual reference for future mobile UI work.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to implement Linear ticket MAZ-88 / AM-017 and noted that the referenced design folder is `design/`.

## Result Obtained

- Removed `--passWithNoTests` from the mobile test script.
- Added `test:coverage` and `verify` scripts.
- Updated PR CI to run tests with coverage.
- Added a real Jest smoke test for i18n setup.
- Documented mobile architecture guardrails in `README.md` and `CONTRIBUTING.md`.
- Moved the design reference folder into `arrow-maze-client/design/`.
- Documented `design/` as the presentation design source of truth while keeping domain/application independent from design assets.
- Configured the approved ArrowMaze blue/lavender/reward palette in `tailwind.config.js`.
- Updated the PR template to require `npm run verify`.

## Team Modifications Pending Human Review

- Confirm which finalized assets from `design/` should be copied into `src/assets/` when UI tickets start consuming runtime images.
- Confirm whether mobile coverage thresholds should be enforced now or after AM-018/AM-029 add substantial domain/application code.

## Lessons / Limitations

AM-017 should enforce the development gates and architectural boundaries, but it should not implement gameplay or visual screens. The design folder is useful as a reference for future presentation tickets, not as a dependency for core layers. In Expo/React Native, `src/assets/` is the right default for runtime imports; `public/` should be reserved for web-only static files.
