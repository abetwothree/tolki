# AGENTS.md

## Setup commands

- Install deps: `pnpm install`
- Run tests with coverage: `pnpm test:run`
- Run linter: `pnpm lint`
- Run formatter: `pnpm format`
- Run type checks: `pnpm ts:check`

## Code style

- Use TypeScript and read tsconfig.json at the root for configuration
- Use ES modules (import/export)
- Use `pnpm` as package manager
- Use `prettier` for formatting
- Use `oxlint` and `eslint` for linting
- Use full return statements with curly braces, even for single statements:

```JavaScript
// bad
if (condition) doSomething();
// good
if (condition) {
  return doSomething();
}
```

- Use `===` and `!==` instead of `==` and `!=`
- Use `const` for variables that are not reassigned
- Use functional patterns where possible
- Aim for 100% test coverage
- Use `Vitest` for testing
- This is monorepo, so all packages should be in `packages/` folder
