---
"@tolki/utils": patch
---

Adds two helpers that make a value safe to put inside a shell command. Each leaves a value of plain characters as it is and quotes anything else.

- `escapeShellArg` quotes for a POSIX shell, with single quotes.
- `escapeWindowsShellArg` quotes for cmd.exe on Windows, with double quotes. A `%` cannot be escaped there, so it is left as it is.
