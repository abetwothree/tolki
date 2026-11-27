# Contributing to Tolki

Thank you for your interest in contributing to Tolki! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js (see `.node-version` for the required version)
- [pnpm](https://pnpm.io/) (see `packageManager` in `package.json` for the required version)

### Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the test suite to verify your setup:
   ```bash
   pnpm test
   ```

## Project Structure

This is a monorepo managed with pnpm workspaces. Packages are located in the `packages/` directory:

- `arr` - Array utilities
- `collection` - Collection class
- `data` - Data structure utilities
- `num` - Number utilities
- `obj` - Object utilities
- `path` - Path utilities
- `str` - String utilities
- `types` - TypeScript type definitions
- `utils` - Shared utilities

## Development Workflow

### Running Tests

```bash
pnpm test          # Run all tests with coverage
pnpm test:dev      # Run tests in watch mode
pnpm test:ui       # Run tests with the Vitest UI
```

### Linting and Formatting

```bash
pnpm lint          # Run all linters (oxlint + eslint)
pnpm format        # Format code with Prettier
pnpm ts:check      # Run TypeScript type checking
```

### Building

```bash
pnpm build         # Build all packages
```

A package's `.d.ts` files must import other `@tolki/*` packages by name. The root `tsconfig.json` maps `@tolki/*` to `packages/*/src/index.ts` for development, and `vite-plugin-dts` would rewrite those imports into relative paths that break once the package is installed from npm. The shared `dts()` config in `vite.config.ts` sets `aliasesExclude: [/^@tolki\//]` to keep the package names.

Each package's `vite.config.ts` calls `definePackageConfig()` from `vite.shared.ts`, which takes the build entries from `src/**/*.ts` and the externals from the package's own `dependencies` and `peerDependencies`. A runtime import that neither lists fails the build, so declare it before you use it.

`pnpm package:check` packs every published package with `pnpm pack`, installs the tarballs in a temporary consumer and type-checks every entry under `node16`, `nodenext`, CommonJS and `bundler` settings, runs `@arethetypeswrong/cli` on each tarball and loads every value entry with `import()` and `require()`. Run it after `pnpm build`; [docs/features/package-check.md](docs/features/package-check.md) has the details.

## Making Changes

1. Create a new branch from `master` for your changes.
2. Make your changes, ensuring tests pass and code is properly formatted.
3. Add a changeset describing your changes:
   ```bash
   pnpm document:change
   ```
4. Commit your changes and open a pull request against `master`.

## Pull Request Guidelines

- Keep PRs focused on a single change.
- Include tests for new functionality or bug fixes.
- Ensure all CI checks pass before requesting review.
- Add a changeset entry if your change affects published packages.

## Reporting Issues

- Use GitHub Issues to report bugs or request features.
- For security vulnerabilities, see [SECURITY.md](SECURITY.md).
