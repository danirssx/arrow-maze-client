# Arrow Maze Client Architecture

This repository follows Clean Architecture with MVVM in the presentation layer.

Dependency direction:

```txt
app / framework / presentation
        -> infrastructure
        -> application
        -> domain
```

Rules:

- `src/domain` contains pure game rules only.
- `src/application` contains use cases and ports approved by the team.
- `src/infrastructure` implements external adapters.
- `src/presentation` contains screens, view models, UI state, and components.
- `src/framework` wires Expo, navigation, i18next, dependency injection, and error boundaries.

Required diagrams before final delivery:

- `docs/clean-architecture.drawio`
- `docs/clean-architecture.png`
- `docs/class-diagram.drawio`
- `docs/class-diagram.png`
