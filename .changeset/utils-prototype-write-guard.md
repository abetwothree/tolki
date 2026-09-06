---
"@tolki/utils": major
---

Add `isPrototypeObject(value)`, re-exported from the package root, and use it to close a prototype-pollution hole in `defineKey`.

- `isPrototypeObject(value)` — true when `value` is the `prototype` of the constructor it carries as an own property, so `Object.prototype`, `Array.prototype`, `Function.prototype` and every class's prototype qualify, while an ordinary object, an array, and a constructor look-alike such as `{ constructor: Object }` do not. It recognises a prototype only by an own _function_ `constructor`, so it does not detect `%IteratorPrototype%` and the other intrinsics whose `constructor` is an accessor or absent, nor a `Proxy` wrapping a prototype -- a transparent proxy is not distinguishable from its target in JavaScript. Neither `isObject` nor `isObjectAny` can stand in for it: `Array.prototype` is array-shaped and `Object.prototype` is object-shaped, so a shape test cannot tell a shared prototype apart from ordinary data.
  This is a breaking change: `defineKey` declines writes it previously performed.

- `defineKey(target, key, value)` now refuses a `target` that is a prototype object and returns without writing. Every value inheriting from that prototype would otherwise observe the write, so a caller-supplied path reaching one is a global mutation, not a property assignment. Writes to any other target are unchanged.
