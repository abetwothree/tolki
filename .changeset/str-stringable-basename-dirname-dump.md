---
"@tolki/str": minor
---

Three more fluent string methods from Laravel's `Stringable` are now available on `Str.of()`.

- `basename()` returns the last part of a path, and can strip a suffix such as a file extension: `Str.of("/app/Models/User.php").basename(".php")` gives `"User"`.
- `dirname()` returns the parent directory of a path, optionally climbing several levels: `Str.of("/app/Models/User.php").dirname(2)` gives `"/app"`. Asking for fewer than one level throws, as PHP does.
- `dump()` logs the string (plus any extra values you pass) to the console and returns the same instance, so it can be dropped into the middle of a chain while debugging.

Both path helpers work on `/`-separated paths the way PHP's `basename()` and `dirname()` do.
