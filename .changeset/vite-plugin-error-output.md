---
"@tolki/enum": patch
"@tolki/ts": patch
---

Surface the artisan command's stdout/stderr in Vite plugin failure messages

Previously, when the `ts:publish` command failed, the plugin only reported
Node's generic `Command failed: <command>` message, so the actual PHP error
was invisible unless the command was re-run manually in a terminal. The
plugin now appends the captured stderr and stdout from the failed command
to both the logged error (dev mode) and the thrown error (build mode).
