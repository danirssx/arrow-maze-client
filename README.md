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

## Design Patterns

The mobile game engine (domain + application layers) applies these Gang of Four / graph patterns.
Each pattern class carries a pattern header in its source file. Full rationale and the
class → layer map live in [`docs/design-patterns.md`](docs/design-patterns.md).

| Pattern | Layer | Key class(es) |
| --- | --- | --- |
| Composite | domain | `BoardGroup`, `Cell` + cell leaves |
| Graph Model / Pathfinding | domain | `BoardGraph`, `BoardGraphBuilder`, `PathfindingService` |
| Decorator | domain | `CellDecorator`, `LockedCellDecorator`, `CollectableCellDecorator` |
| Factory Method | domain | `CellFactory` |
| Template Method | domain | `BaseLevel`, `NormalLevel`, `TimedLevel` |
| State | domain | `GameContext`, `*State`, `GamePhase` |
| Command | domain | `MoveCommand`, `CommandHistory` |
| Observer | domain | `GameEventEmitter`, `GameEvent` (subject: `BaseLevel`) |
| Strategy | domain / application | `IScoringStrategy` strategies; `ILevelStrategy` sources |
| Builder + Director | application | `ConcreteLevelBuilder`, `LevelDirector` |
| Facade | application | `GameFacade` |

The `presentation`, `infrastructure`, and `framework` layers are scaffolding only at this stage;
their patterns will be documented as those layers are implemented.

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
npm run test:coverage
npm run verify
npm run build
```

## Architecture Guardrails

Clean Architecture boundaries are enforced by ESLint through `import/no-restricted-paths`.

Current guarded rules:

- `src/domain` must not import `src/application`, `src/infrastructure`, `src/presentation`, or `src/framework`.
- `src/application` must not import `src/infrastructure`, `src/presentation`, or `src/framework`.
- `src/domain` and `src/application` must stay independent from Expo, React Native, navigation, HTTP, storage, and presentation details.

If a ticket requires changing these boundaries, stop and ask the team before editing code.

## Design Source

The shared product design reference lives in `design/`.

Current assets include:

- `design/logo.svg`
- `design/logo.png`
- `design/mockup/Section 1.png`
- `design/README.md`

These files define the FlechaGo visual direction: mobile-first layout, blue/lavender palette, Outfit typography, soft card surfaces, and game-board neon accents. UI tickets should use this folder as the design source of truth, but domain/application code must never depend on design assets.

Use `design/` for source references and mockups. Use `src/assets/` for runtime assets imported by Expo screens/components. Use `public/` only for future web-only static files that must be served by URL.

## CI/CD

Pull requests run install, lint, typecheck, and tests with coverage through GitHub Actions.

## Contributing

See `CONTRIBUTING.md`.

## AI Usage

Every significant AI-assisted task must create an entry in `ai-log/`. The final summary is maintained in `AI_USAGE.md`.

## License

Academic project. License decision pending team approval.
