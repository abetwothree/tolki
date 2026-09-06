---
"@tolki/types": minor
---

Add `UndotArrayKey`, and accept a single-element tuple in `SortSpec`.

- `UndotArrayKey` — the key shape an array-building undot can represent: a bare numeric index (`0`, `"0"`) or a dot-path whose first segment is numeric (`"0.1"`). Constraining a parameter to this type turns a string-keyed map, which no array can represent, into a compile error instead of data silently discarded at runtime.
- `SortSpec<TValue>` gains a `readonly [string]` member, so destructuring a descriptor with `const [key, direction] = spec` yields a real, typed `direction: undefined` case rather than reaching it only through an unchecked cast. The existing `string`, `[key, direction]`, and comparator members are unchanged.

`SortSpec` is widened rather than narrowed, so every value that satisfied it before still does. Code that consumes a `SortSpec` exhaustively — for example a `switch` with an exhaustiveness check — will need to handle the new member.
