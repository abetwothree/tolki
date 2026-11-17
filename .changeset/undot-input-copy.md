---
"@tolki/path": patch
"@tolki/arr": patch
"@tolki/obj": patch
"@tolki/data": patch
"@tolki/collection": patch
---

- `undot` no longer changes the nested arrays or objects of its input, matching Laravel.
- `dataUndot` and `Collection#undot` inherit this, so they no longer write into their input either.
