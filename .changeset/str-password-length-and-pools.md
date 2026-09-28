---
"@tolki/str": minor
---

`password()` now matches Laravel's latest behavior in two edge cases.

- Asking for a password shorter than the number of character sets in use now returns exactly the length you asked for. For example, `password(1)` returns one character instead of three.
- Turning every character set off, as in `password(32, false, false, false, false)`, now throws an `Error` with the message "At least one character pool must be enabled." instead of quietly returning an empty string.
