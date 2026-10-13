---
"@tolki/enum": patch
"@tolki/ts": patch
---

`@tolki/ts` now re-exports `defineEnum`, `from`, `tryFrom` and `cases`, and the `AsEnum`, `CaseValue`, `DefineEnumResult`, `EnumConst` and `FromResult` types, from `@tolki/enum` instead of shipping its own copy, so both packages run the same code. Imports from `@tolki/ts` and `@tolki/ts/enums` don't change, and installing `@tolki/ts` now also installs `@tolki/enum`.
