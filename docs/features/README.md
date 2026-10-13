# Feature docs

How the repo's own tooling works. One line per file.

- [docs-example-runner.md](./docs-example-runner.md): runs every `// =>` assertion in the VitePress examples and checks the PHP citations written as HTML comments.
- [docs-coverage.md](./docs-coverage.md): reports exports and Collection members without a section, broken in-page anchors and package tabs that import another package.
- [readme-build.md](./readme-build.md): how `readme:build` splices docs pages into package READMEs, keeps only each package's own tab and rewrites doc links.
- [fn-try.md](./fn-try.md): the `FnTry` docs playground: props, argument types, how results and errors are formatted, and its live region.
- [code-group-sync.md](./code-group-sync.md): how code groups with the same tab titles stay in sync, are remembered in localStorage and keep the page from jumping.
- [docs-site.md](./docs-site.md): the VitePress site layout, nav and sidebar rules, page URLs, authoring conventions, both section templates and the verification commands.
- [arr-obj-data-collection-layering.md](./arr-obj-data-collection-layering.md): how `data` dispatches to `arr` and `obj`, the hand-written helpers, name differences and how `Collection` builds on it.
