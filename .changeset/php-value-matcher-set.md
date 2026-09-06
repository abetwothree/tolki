---
"@tolki/utils": minor
---

Add `phpValueMatcher(others)`, re-exported from the package root.

- `phpValueMatcher(others)` — builds a reusable `phpValueMatch`-equivalent membership test against a fixed list of operands: cast operands go into a `Set` once, so repeated membership checks (as `Arr.diff`/`Arr.intersect` and `Obj.diff`/`Obj.intersect` perform per item) run in O(1) instead of rescanning `others` on every call. Values with no PHP scalar cast keep the exact `phpValueMatch` fallback semantics via a small residual list.
