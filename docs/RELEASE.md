# Release Guide — Arrow Maze Client

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Android Studio | latest | for Android builds |
| Xcode | 15+ | for iOS builds (macOS only) |

Authenticate before using EAS:

```bash
eas login
```

If this checkout has not been linked to an Expo cloud project yet, run the
interactive setup once with the team-owned Expo account:

```bash
eas init
```

Do not commit Expo access tokens or local credential files.

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url
```

Never commit `.env`. For cloud builds, define `EXPO_PUBLIC_API_BASE_URL` in the
matching EAS environment:

| EAS profile | EAS environment | Expected backend URL |
| --- | --- | --- |
| `development` | `development` | Local/LAN backend used by internal debug builds |
| `preview` | `preview` | Preview or staging backend |
| `production` | `production` | Production backend |

`eas.json` uses the `environment` field so EAS applies variables from the
matching cloud environment. Keep secrets out of `eas.json`; only non-secret
build flags may be committed there.

## Run quality gates before any release

```bash
npm run verify
```

This runs lint + typecheck + tests with coverage. All must pass before building.

## Development build (Expo Go)

```bash
npm install
npm run start
```

Scan the QR code with the Expo Go app on your device.

## Development build (EAS Build)

Use this when you need a native internal artifact instead of Expo Go:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

The Android artifact is an APK. The iOS artifact targets the simulator, so it
does not require distribution signing credentials.

## Preview build (EAS Build — internal distribution)

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Requires an Expo account and the preview EAS environment configured. Share the
resulting APK/IPA link for team testing. Preview builds should be created from
`develop` or feature branches, not from `main`.

## Production build

Production builds are promoted only from `main` after human release approval.
Do not run production EAS builds from `develop` or feature branches.

### Android (APK / AAB)

```bash
eas build --profile production --platform android
```

The output is an AAB ready for Google Play. Download from the EAS dashboard.

### iOS (IPA)

```bash
eas build --profile production --platform ios
```

Requires Apple Developer account. Submit via:

```bash
eas submit --platform ios
```

### Web

```bash
npm run build
```

Outputs a static bundle to `dist/`. Deploy to any static host (Netlify, Vercel, GitHub Pages).

## CI checks (GitHub Actions)

Every pull request to `develop` or `main` automatically runs:

1. `npm ci` — clean install
2. `npm run lint` — ESLint with architecture guardrails
3. `npm run typecheck` — TypeScript strict check
4. `npm run test:coverage` — Jest with coverage report

See `.github/workflows/pull-request.yml`.

## Branch-to-build policy

| Branch/source | EAS profile | Purpose |
| --- | --- | --- |
| Feature branch / PR | `development` or `preview` | Internal validation only |
| `develop` | `preview` | Sprint integration and demo validation |
| `main` | `production` | Production release candidate after human approval |

This client policy mirrors the workspace release rule: feature PRs target
`develop`; only human-approved release PRs promote to `main`.

## Contract tests

Contract tests in `tests/contract/` validate that client DTOs match the
backend OpenAPI shapes for:

- `GET /levels` — level catalog list
- `GET /levels/:id` — level detail
- `POST /auth/register`, `POST /auth/login`
- `GET /progress/me`, `PUT /progress/sync`
- `GET /leaderboard/:levelId`, `POST /leaderboard/scores`

Run with:

```bash
npm test -- --testPathPattern=contract
```

No real network calls are made. Fixtures are derived from backend OpenAPI examples.

## Versioning

Update `version` in `package.json` and `app.json` before each release following
[Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

## Screenshots / GIFs

Place release screenshots in `docs/screenshots/` named by feature:

```
docs/screenshots/home.png
docs/screenshots/settings.png
docs/screenshots/leaderboard.png
```

_Placeholders: screenshots to be added after final UI polish (AM-048)._
