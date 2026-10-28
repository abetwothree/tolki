---
"@tolki/ts": patch
---

Fixes how `@tolki/ts/vite` builds the command it runs for a changed file.

- A source file's path containing `$&`, `$'`, `` $` `` or `$$` is no longer expanded inside the `{file}` substitution.
- A file path containing `--quiet` no longer suppresses `--quiet`.
- `escapeShellArg` now comes from `@tolki/utils`.
