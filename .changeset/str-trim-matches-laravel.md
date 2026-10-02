---
"@tolki/str": minor
---

`trim()`, `ltrim()` and `rtrim()` now return what Laravel's `Str::trim()`, `Str::ltrim()` and `Str::rtrim()` return in several cases where they differed.

- **Breaking:** an empty string as the second argument now trims nothing, as in PHP. To trim whitespace, pass `null` or leave the argument out.
- `ltrim()` no longer removes whitespace from the end of the string. `ltrim("  hello  ")` returned `"hello"` and now returns `"hello  "`.
- `trim()` and `rtrim()` no longer add spaces to the start of the remaining lines of multi-line text.
- All three also remove the next-line character (U+0085), which PHP counts as whitespace.
- `excerpt()` keeps the spaces in front of the matched phrase: `excerpt("This is  my name", "my")` returns `"This is  my name"`, where it returned `"This ismy name"`.
