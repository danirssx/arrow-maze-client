# Contributing to Arrow Maze Client

This document defines the team workflow for the client repository.

## Code of Conduct

Use respectful, concrete, and constructive reviews. The goal of review is to improve correctness, architecture, and maintainability.

## Branch Strategy

Use short-lived feature branches from `develop`:

- `feat/<scope>-AM-<ticket>`
- `fix/<scope>-AM-<ticket>`
- `test/<scope>-AM-<ticket>`
- `docs/<scope>-AM-<ticket>`
- `refactor/<scope>-AM-<ticket>`
- `chore/<scope>-AM-<ticket>`
- `ci/<scope>-AM-<ticket>`

## Commit Convention

All commits must use Conventional Commits in English:

```txt
type(scope): imperative message
```

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`, `ci`, `build`.

Valid examples:

```txt
feat(client): initialize expo project
test(domain): add rotation rule tests
ci(client): add pull request workflow
```

Invalid examples:

```txt
updates
wip
fixing stuff
```

## Pull Request Process

1. Create a ticket-specific branch from `develop`.
2. Implement only the approved ticket scope.
3. Run lint, typecheck, and tests with coverage locally.
4. Update `ai-log/` for significant AI-assisted work.
5. Open a PR against `develop`.
6. Require at least one reviewer and passing CI.
7. Merge only through the approved team workflow.

Release PRs from `develop` to `main` are created only by humans after the milestone is reviewed.

## Code Review Guidelines

Reviewers must verify Clean Architecture boundaries, SOLID risks, test quality, AI usage logs, and Conventional Commits.

## Architecture Guardrails

Client architecture boundaries are enforced by ESLint.

- Domain cannot depend on application, infrastructure, presentation, or framework.
- Application cannot depend on infrastructure, presentation, or framework.
- Domain and application cannot import Expo, React Native, navigation, storage, HTTP, or UI implementation details.
- Design assets from `../design/` are presentation references only; they must not be imported by domain or application code.

Run this before opening a PR:

```bash
npm run verify
```

If `npm run lint` reports `import/no-restricted-paths`, treat it as an architecture bug, not a style warning.

## Testing Guidelines

Tests must follow AAA, use `should_<expected>_when_<condition>` names, and verify observable behavior instead of private implementation details.
