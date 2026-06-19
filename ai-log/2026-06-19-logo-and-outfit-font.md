# AI Usage Log: FlechaGo logo + Outfit font (no ticket, direct PR)

## Task / Problem

Per the user's direct request (no Linear ticket): (1) place the `design/logo-go.svg` logo in the app, and (2) adopt the Google "Outfit" font across the app. Constraint (MEMORY): `react-native-svg` is **not** wired, so an SVG cannot be rendered directly. Based on `develop`.

## Tool and Model

Claude Code / Claude Opus 4.8.

## Prompt Used

The user asked to add the logo where appropriate and to implement the Outfit font (gave the Google Fonts `@import` URL), as a single PR with no ticket — following both repos' `AGENTS.md`, `MEMORY.md`, AI logging, validation, MEMORY/AGENTS update check, commit/push/PR.

## Agent Roles Used

| Agent | Status | How it was used | Evidence |
| --- | --- | --- | --- |
| Spec Partner | Used | Clarified the two constraints that shaped the design: no `react-native-svg` (→ rasterize the SVG to PNG) and RN does not inherit `fontFamily` while NativeWind feeds `style` from `className` (→ a `defaultProps` font default cannot work). | this log |
| Planner/Slicer | Used | Scoped to: bundle the logo as a PNG + render it in `Brand`; load Outfit via `useFonts`; make it global with a weight-aware host-render patch. Presentation/framework only. | this log |
| TDD Implementer | Referenced | No new unit test (visual/asset + global font); leaned on the existing `HomeScreen` test (which imports `Brand` → the PNG) plus full `npm run verify` to prove nothing regressed. | `tests/presentation/screens/HomeScreen.test.tsx` |
| Judge | Referenced | Pre-PR audit: full `npm run verify`; confirmed the font patch is idempotent, injects family *under* explicit styles, and maps `fontWeight` → real Outfit weight files; verified the PNG import is typed (`images.d.ts`) and resolves in jest. | `npm run verify` |
| Mutation Tester | Not used | StrykerJS not configured; asset/UI change. | N/A |

## Result Obtained

- **Logo:** `design/logo-go.svg` wraps a base64 PNG; extracted it and downscaled (`sips -Z 768`) to `assets/images/logo-go.png` (768×614, alpha, ~175 KB). Rendered in `Brand` (logo mark above the wordmark), so it shows on the Home hub. Added `images.d.ts` so `*.png` imports are typed.
- **Outfit font:** installed `@expo-google-fonts/outfit`; `app/_layout.tsx` loads Regular/Medium/SemiBold/Bold/Black via `useFonts` and holds the UI until ready. `src/framework/fonts/registerDefaultFont.ts` patches the host `Text` renderer once to inject the Outfit weight family that matches the resolved `fontWeight`, *under* the element's own style — so the whole app renders in Outfit with **zero per-component edits**, and `font-bold`/`font-semibold`/`font-black` resolve to the real weight files (not synthetic bold).

## Verification

- `npm run verify` (lint + typecheck + coverage) → **52 suites / 233 tests passing**.
- `tsc --noEmit` clean after adding `images.d.ts`; `HomeScreen` test (imports the PNG) green.

## Team Modifications Pending Human Review

- New runtime dependency `@expo-google-fonts/outfit` (+ `package-lock.json`); `expo-font` was already present.
- The render patch targets `Text` (RN forwardRef with `.render`); `TextInput` is skipped (class component, no static `.render`) — inputs keep the system font. Easy to extend later if desired.
- Logo is a raster (no `react-native-svg`); if a crisp vector is needed later, wire `react-native-svg` + transformer.

## Lessons / Limitations

The two RN realities that drove the design: (1) `fontFamily` does not inherit and NativeWind sets the `style` prop from `className`, so `Text.defaultProps.style` never applies — wrapping the host `render` and injecting the family *under* the existing style is the reliable global-font seam; (2) an "SVG" exported from design tools is often just a PNG in a `<pattern>`, so extracting the embedded raster avoids pulling in `react-native-svg`.
