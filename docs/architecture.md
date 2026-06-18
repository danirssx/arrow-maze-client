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

## Design Patterns

The mobile game engine applies eleven GoF/graph patterns across the `domain` and `application`
layers. Each pattern's key class, layer, and rationale are documented in
[`docs/design-patterns.md`](./design-patterns.md), and every pattern class carries a pattern header
in its source file.

Summary by layer:

- `domain`: Composite and Graph Model/Pathfinding (board), Decorator (cells), Factory Method
  (cell creation), Template Method (levels), State (lifecycle), Command (moves/undo), Observer
  (game events), Strategy (scoring).
- `application`: Strategy (level sources), Builder + Director (level construction), Facade
  (gameplay boundary).

The `presentation`, `infrastructure`, and `framework` layers are scaffolding only at this stage;
their patterns (e.g. MVVM, Adapter) will be documented when implemented.

Required diagrams before final delivery:

- `docs/clean-architecture.drawio`
- `docs/clean-architecture.png`
- `docs/class-diagram.drawio`
- `docs/class-diagram.png`
