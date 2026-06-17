# AI Usage

This file compiles significant AI-assisted work for the Arrow Maze client.

## Tools Used

| Tool | Model/Version | Role |
| --- | --- | --- |
| Codex | GPT-5 | Project setup, configuration, documentation scaffolding |

## Task Log

Raw entries live in `ai-log/` and are compiled into this section before delivery.

<!-- AI_LOG_ENTRIES_START -->


---

# AI Usage Log: AM-018 Directed Board Graph

## Task / Problem

Extend AM-018 / MAZ-89 after the planning update that added directed graph and pathfinding logic to the mobile board domain.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to update Linear tickets with the new board graph scope and then continue implementing MAZ-89.

## Result Obtained

Added pure domain graph components in `src/domain/board`: `BoardGraph`, `BoardGraphBuilder`, `PathfindingService`, and `PositionNotInGraphError`.

Movement semantics implemented for AM-018: walls are excluded, exits are terminal, arrows create one directed edge, and empty cells connect to navigable cardinal neighbors.

## Team Modifications Pending Human Review

- Confirm whether future level templates will introduce an explicit `StartCell`; AM-018 currently receives start and exit positions as pathfinding inputs.
- Confirm whether empty cells should remain four-directional or receive stricter movement rules in AM-020/AM-022.

## Lessons / Limitations

The graph belongs in `src/domain/board` because movement validity is a game-domain invariant. Application and presentation layers should consume graph-backed results through later builders/facades instead of inspecting graph internals directly.


---

# AI Usage Log: MAZ-123 Expo SDK 54 Upgrade

## Task / Problem

Resolve the Expo Go incompatibility reported in `MAZ-123` by upgrading the mobile client from Expo SDK 53 to SDK 54.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to resolve Linear issue `MAZ-123`, where Expo Go could not run the app because the project used an incompatible SDK version.

## Result Obtained

Updated Expo and related native/runtime packages to SDK 54-compatible versions, including React Native 0.81.5, React 19.1.0, Expo Router 6, React Native Reanimated 4, and required peer dependencies for Expo Router and Reanimated.

## Team Modifications Pending Human Review

- Restart any running Expo CLI sessions before testing in Expo Go.
- Confirm the app opens from a clean `npx expo start --clear` session on the target device.
- Review the remaining moderate `npm audit` findings separately, because automatic force fixes may introduce unrelated dependency churn.

## Lessons / Limitations

Expo SDK upgrades must be validated with `expo-doctor`, not only by changing the `expo` package version. Expo Router and Reanimated require direct peer dependencies under SDK 54.


---

# AI Usage Log: Branch Workflow Setup

## Task / Problem

Configure the repository branch workflow after `main` and `develop` were created.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to configure branches for the client and backend repositories and clarify what must be set in GitHub before starting the workflow.

## Result Obtained

Updated worktree scripts and agent/contribution documentation so feature work starts from `origin/develop`, feature PRs target `develop`, and only human-approved release PRs target `main`.

## Team Modifications Pending Human Review

- Confirm whether the team wants `develop` or `main` as the GitHub default branch.
- Configure branch protection rules in GitHub for `main` and `develop`.

## Lessons / Limitations

When a project uses both `main` and `develop`, agent instructions must be explicit about PR targets to avoid accidental release-branch work.


---

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


---

# AI Usage Log: Project Setup

## Task / Problem

Create the initial client repository configuration and governance scaffolding based on the project build guideline.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user asked Codex to build the project setup following `Build Completo del proyecto.md`, `Config de Agentes completa.md`, and the documentation guidance, with emphasis on configuration, build, agents, Zed, and Git worktrees.

## Result Obtained

Generated initial Expo/TypeScript configuration, Clean Architecture folders, lint/typecheck/test scripts, GitHub Actions, Husky/Commitlint, AI usage templates, PR template, agent prompts, and worktree scripts.

## Team Modifications Pending Human Review

- Review dependency versions before freezing the baseline branch.
- Confirm whether optional client tools such as AsyncStorage, SQLite, Axios, or Expo AV should be added.
- Complete human modifications after reviewing this setup.

## Lessons / Limitations

The setup intentionally avoids domain entities, use cases, decorators, and game patterns because those require team approval under `AGENTS.md`.


---

# AI Usage Log: Section 6 and Section 7 Compliance

## Task / Problem

Add explicit project rules requiring README completeness and AI usage traceability according to Section 6 and Section 7 of the project statement.

## Tool and Model

Codex / GPT-5.

## Prompt Used

The user provided compliance text in Spanish and asked to add it to the guideline or `AGENTS.md`, emphasizing README completeness, AI documentation, critical review, tests, and team responsibility.

## Result Obtained

Updated `AGENTS.md` with a mandatory Section 6 and Section 7 compliance section, and added an Academic Compliance section to `README.md`.

## Team Modifications Pending Human Review

- Confirm the final wording matches the professor's statement.
- Expand README sections for SOLID, AOP strategy, and diagrams as the implementation decisions are approved.

## Lessons / Limitations

Compliance rules should live where agents cannot miss them: `AGENTS.md`, with a README summary for human contributors and evaluators.


<!-- AI_LOG_ENTRIES_END -->

## Critical Evaluation

### Approximate AI-Assisted Work

| Area | Estimate |
| --- | --- |
| Boilerplate and configuration | Pending |
| Pattern implementation | Pending |
| Game business logic | Pending |
| Tests | Pending |
| Documentation | Pending |
| Architectural decisions | 0% unless explicitly approved by the team |

### AI Failure Cases

Pending. Add concrete cases discovered during reviews.

### Reflection

Pending. Complete before final delivery with what accelerated delivery, what required review, and what the team would do differently.
