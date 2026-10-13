# Feature docs

How the repo's own tooling works. One line per file.

- [docs-example-runner.md](./docs-example-runner.md): runs every `// =>` assertion in the VitePress examples and checks the PHP citations written as HTML comments.
- [docs-coverage.md](./docs-coverage.md): reports exports and Collection members without a section, broken in-page anchors and package tabs that import another package.
- [readme-build.md](./readme-build.md): how `readme:build` splices docs pages into package READMEs, keeps only each package's own tab and rewrites doc links.
