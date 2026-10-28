---
"@tolki/ts": patch
---

Fixes how `@tolki/ts/vite` builds the command it runs for a changed file.

- A source file's path containing `$&`, `$'`, `` $` `` or `$$` is no longer expanded inside the `{file}` substitution.
- A source file whose path contains the text `--quiet` no longer stops the plugin from adding `--quiet`.
- `escapeShellArg` now comes from `@tolki/utils`.
