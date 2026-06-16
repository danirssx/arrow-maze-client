# Arrow Maze Client

Mobile client for Arrow Maze, built with Expo, React Native, and TypeScript.

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind
- Zustand
- i18next
- Jest
- ESLint
- Husky
- Commitlint

## Architecture Overview

The client follows Clean Architecture and MVVM for the presentation layer.

```txt
app / framework / presentation -> infrastructure -> application -> domain
```

Business rules belong in `src/domain`. Use cases and ports belong in `src/application`. Expo, React Native, i18next, navigation, and dependency wiring belong in `app` or `src/framework`.

NativeWind is approved only for presentation styling in `app`, `src/presentation`, and framework-level UI wiring. Zustand is approved only for UI/view-model state. Neither library may be used in `src/domain`, `src/application`, or game-rule logic.

## Academic Compliance

This repository must stay aligned with Section 6 and Section 7 of the project statement.

Section 6 requires a clear, professional, and updated `README.md` covering project description, architecture, design patterns, SOLID principles, AOP strategy, local execution, tests, contribution workflow, diagrams, and AI usage documentation.

Section 7 requires every significant AI-assisted intervention to be documented in `AI_USAGE.md` and/or `ai-log/`, including the tool, prompt, generated result, team modifications, and lessons learned. AI-assisted code must be reviewed, tested, and understood by the team before integration.

## Folder Structure

```txt
app/
src/domain/
src/application/
src/infrastructure/
src/presentation/
src/framework/
src/shared/
src/assets/
tests/
docs/
ai-log/
```

## Getting Started

```bash
npm install
npm run start
```

## Quality Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## CI/CD

Pull requests run lint, typecheck, and tests through GitHub Actions.

## Contributing

See `CONTRIBUTING.md`.

## AI Usage

Every significant AI-assisted task must create an entry in `ai-log/`. The final summary is maintained in `AI_USAGE.md`.

## License

Academic project. License decision pending team approval.
