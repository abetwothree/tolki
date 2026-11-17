---
"@tolki/data": patch
---

- Unused calls to data's side-effect-free helpers now drop out of bundles in Vite, Rollup, webpack and Rspack, as arr's and obj's do.
- `dataPop`, `dataShift`, `dataUnshift` and `dataSplice` can change the array or object you pass, so a call to them is always kept.
- The helpers' TypeScript types are unchanged.
