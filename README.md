# Arrow Maze Client

Mobile client for Arrow Maze, built with Expo, React Native, and TypeScript.

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
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
