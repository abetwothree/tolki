# Differences from Laravel

`@tolki/arr`, `@tolki/obj` and `@tolki/data` follow Laravel's `Arr` class and `data_*` helpers wherever JavaScript can hold the same data. This page lists the places where they cannot, or choose not to. For the rules they keep on purpose, see [PHP Semantics](./php-semantics.md).

## Return values instead of references

<!-- docs/php-parity/Arr/set.json, "set-dot-path-under-a-list-index" -->
<!-- docs/php-parity/Arr/forget.json, "forget-products.desk.price" -->
<!-- docs/php-parity/Arr/push.json, "push-mutates-the-caller-by-reference" -->
<!-- docs/php-parity/Arr/pull.json, "Arr::pull — first-level key containing dots" -->

Laravel's `Arr::set()`, `forget()`, `push()` and `pull()` take the array by reference and change it. JavaScript cannot pass a variable that way, so these functions return the result and leave what you passed in unchanged. Assign the result to keep it.

- `set` returns the array or object with the value written. <!-- docs/php-parity/Arr/set.json, "set-dot-path-under-a-list-index" -->
- `forget` returns it with the path removed. <!-- docs/php-parity/Arr/forget.json, "forget-products.desk.price" -->
- `push` returns it with the values appended to the array at the path. <!-- docs/php-parity/Arr/push.json, "push-mutates-the-caller-by-reference" -->
- `pull` returns `{ value, data }`: the item taken out, and the data without it. <!-- docs/php-parity/Arr/pull.json, "Arr::pull — first-level key containing dots" -->

::: code-group

```js [@tolki/arr]
import { forget, pull, push, set } from "@tolki/arr";

const grid = [["a", "b"], ["c"]];

set(grid, "0.1", "z");
// => [["a", "z"], ["c"]]

forget(grid, "0.1");
// => [["a"], ["c"]]

push(grid, "1", "d");
// => [["a", "b"], ["c", "d"]]

pull(grid, "0.0");
// => { value: "a", data: [["b"], ["c"]] }

grid;
// => [["a", "b"], ["c"]]
```

```js [@tolki/obj]
import { forget, pull, push, set } from "@tolki/obj";

const desk = { price: { amount: 100, tax: 7 }, tags: ["a"] };

set(desk, "price.amount", 200);
// => { price: { amount: 200, tax: 7 }, tags: ["a"] }

forget(desk, "price.tax");
// => { price: { amount: 100 }, tags: ["a"] }

push(desk, "tags", "b");
// => { price: { amount: 100, tax: 7 }, tags: ["a", "b"] }

pull(desk, "price.tax");
// => { value: 7, data: { price: { amount: 100 }, tags: ["a"] } }

desk;
// => { price: { amount: 100, tax: 7 }, tags: ["a"] }
```

```js [@tolki/data]
import { dataForget, dataPull, dataPush, dataSet } from "@tolki/data";

const desk = { price: { amount: 100, tax: 7 }, tags: ["a"] };

dataSet(desk, "price.amount", 200);
// => { price: { amount: 200, tax: 7 }, tags: ["a"] }

dataForget(desk, "price.tax");
// => { price: { amount: 100 }, tags: ["a"] }

dataPush(desk, "tags", "b");
// => { price: { amount: 100, tax: 7 }, tags: ["a", "b"] }

dataPull(desk, "price.tax");
// => { value: 7, data: { price: { amount: 100 }, tags: ["a"] } }

desk;
// => { price: { amount: 100, tax: 7 }, tags: ["a"] }
```

:::

`shift`, `pop`, `splice` and `unshift` are different. Laravel gets them from `Collection`, which changes itself, and the functions keep that: they change the array or object you pass and return what came out (or the changed value, for `unshift`).

<!-- docs/php-parity/Collection/shift.json, "X2 shift mutates and returns the first value" -->
<!-- docs/php-parity/Collection/pop.json, "X1 pop mutates and returns the last value" -->
<!-- docs/php-parity/Collection/splice.json, "X6 splice mutates and returns the removed items" -->
<!-- docs/php-parity/Collection/unshift.json, "X5 unshift mutates and renumbers integer keys" -->

::: code-group

```js [@tolki/arr]
import { pop, shift, splice, unshift } from "@tolki/arr";

const queue = [1, 2, 3, 4, 5];

shift(queue);
// => 1

pop(queue);
// => 5

splice(queue, 1, 1);
// => [3]

unshift(queue, 0);
// => [0, 2, 4]

queue;
// => [0, 2, 4]
```

```js [@tolki/obj]
import { pop, shift } from "@tolki/obj";

const stock = { a: 1, b: 2, c: 3 };

shift(stock);
// => 1

pop(stock);
// => 3

stock;
// => { b: 2 }
```

```js [@tolki/data]
import { dataPop, dataShift } from "@tolki/data";

const queue = [1, 2, 3];

dataShift(queue);
// => 1

dataPop(queue);
// => 3

queue;
// => [2]
```

:::

## Behaviour differences

- `float` accepts a whole number such as `1`, where Laravel's `Arr::float()` throws, because PHP's `is_float()` rejects an integer. JavaScript has one number type. <!-- docs/php-parity/Arr/float.json, "Arr::float rejects a whole-number int" -->
- `get`, `has` and the other path readers take `*`, `{first}` and `{last}` as plain key names, where Laravel's `data_get()` expands them. `pluck` does read a `*`. <!-- docs/php-parity/Helpers/data_get.json, "data-get-wildcard-and-first-last-segments" -->
- On a list, `where`, `reject` and `whereNotNull` return the kept values as a new array numbered from 0, where Laravel keeps each value's original key. An object keeps its keys. <!-- docs/php-parity/Arr/where.json, "where-preserves-int-keys"; docs/php-parity/Arr/reject.json, "reject-preserves-int-keys"; docs/php-parity/Arr/whereNotNull.json, "whereNotNull-list-preserves-keys" -->
- The functions Laravel takes from `Collection` give the same list result: `filter`, `intersectAssoc`, `intersectByKeys`, `diffKeys`, `reverse`, `skipUntil` and `skipWhile` return a list numbered from 0 where Laravel keeps each value's original key. `chunk`, `chunkBy` and `chunkWhile` renumber the values inside each chunk, where Laravel keeps their keys. `diff`, `diffAssoc`, `intersect` and `slice` return a fresh list in the same way. `@tolki/obj` keeps the keys of an object. <!-- docs/php-parity/Collection/filter.json, "filter-list-gap-keys"; docs/php-parity/Collection/intersectAssoc.json, "intersectAssoc-list-keeps-gap-keys"; docs/php-parity/Collection/intersectByKeys.json, "intersectByKeys-list-keeps-gap-keys"; docs/php-parity/Collection/diffKeys.json, "C32-F-diffKeys-signature-examples"; docs/php-parity/Collection/reverse.json, "reverse preserves keys and reverses entry order"; docs/php-parity/Collection/skipUntil.json, "C32-D-skipUntil-list-keys"; docs/php-parity/Collection/skipWhile.json, "C32-D-skipWhile-list-keys"; docs/php-parity/Collection/chunk.json, "collection-chunk-last-chunk-keys"; docs/php-parity/Collection/chunkBy.json, "chunkBy with a callback"; docs/php-parity/Collection/chunkWhile.json, "chunkWhile on equal adjacent elements"; docs/php-parity/Collection/diff.json, "diff on array-backed collection"; docs/php-parity/Collection/diffAssoc.json, "diffAssoc on array-backed collection"; docs/php-parity/Collection/intersect.json, "intersect on array-backed collection"; docs/php-parity/Collection/slice.json, "X15 slice with a negative offset and a length" -->
- `dataGet` reads a literal key that contains a dot before it splits the path, so `dataGet({ "a.b": 1, a: { b: 2 } }, "a.b")` is `1`, where Laravel's `data_get()` is `2`. When the literal key is the only one, `dataGet` still finds it and `data_get()` returns the default. `get` in `@tolki/obj` does the same. <!-- docs/php-parity/Helpers/data_get.json, "C32-D-data-get-literal-dotted-key" -->
- A plain object lists integer-like keys first, in ascending order, whatever order you wrote them. Laravel's arrays keep insertion order. A `Map` keeps insertion order, so pass one when the order matters. <!-- docs/php-parity/Arr/divide.json, "divide-mixed" -->
- With a final glue and a single item, `join` returns that item cast to a string, where Laravel returns the item as it is: `1` stays the number `1`. <!-- docs/php-parity/Arr/join.json, "C32-H-arr-join-pieces" -->

```js
import { chunk, filter, float, intersectAssoc, join, where } from "@tolki/arr";
import { dataGet } from "@tolki/data";
import { divide, filter as filterObject, get, reject } from "@tolki/obj";

float([{ price: 1 }], "0.price");
// => 1

get({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

where(
  ["100", "200", "300", "400"],
  (value) => value === "200" || value === "400",
);
// => ["200", "400"]

reject({ a: 1, b: 2, c: 3 }, (value) => value > 1);
// => { a: 1 }

filter([1, 2, 3], (value) => value !== 2);
// => [1, 3]

filterObject({ 0: 1, 1: 2, 2: 3 }, (value) => value !== 2);
// => { 0: 1, 2: 3 }

intersectAssoc(["a", "b", "c"], ["a", "x", "c"]);
// => ["a", "c"]

chunk([1, 2, 3, 4, 5], 2);
// => [[1, 2], [3, 4], [5]]

dataGet({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

dataGet({ "a.b": 1 }, "a.b", "miss");
// => 1

get({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

divide({ x: 1, 0: 2 });
// => [[0, "x"], [2, 1]]

divide(
  new Map([
    ["x", 1],
    [0, 2],
  ]),
);
// => [["x", 0], [1, 2]]

join([1], ", ", " and ");
// => "1"
```

## Not ported

These Laravel helpers have no function in the packages.

- `Arr::isAssoc()` and `Arr::isList()`: in none of the three. `Array.isArray()` tells a list from an object.
- `data_fill()`, and the global `head()` and `last()` helpers. `first` and `last` from the packages are `Arr::first()` and `Arr::last()`.
- `accessible`, `arrayable` and `wrap` in `@tolki/data`. `@tolki/arr` and `@tolki/obj` have them.

```js
import * as arr from "@tolki/arr";
import * as data from "@tolki/data";
import * as obj from "@tolki/obj";

"isList" in arr || "isAssoc" in obj || "dataFill" in data;
// => false

"dataAccessible" in data || "dataArrayable" in data || "dataWrap" in data;
// => false
```

## Renamed

- `Arr::array()` is `arrayItem` in `@tolki/arr`, `objectItem` in `@tolki/obj` and `dataItem` in `@tolki/data`. `array` is too generic a name to export.
- `Arr::arrayable()` is `arrayable` in `@tolki/arr` and `objectifiable` in `@tolki/obj`.
- `data_get()`, `data_set()` and `data_forget()` are `dataGet`, `dataSet` and `dataForget`. Every other function in `@tolki/data` takes the same `data` prefix, so `Arr::pluck()` is `dataPluck`.

::: code-group

```js [@tolki/arr]
import { arrayItem } from "@tolki/arr";

arrayItem([{ tags: ["a"] }], "0.tags");
// => ["a"]
```

```js [@tolki/obj]
import { objectItem } from "@tolki/obj";

objectItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }
```

```js [@tolki/data]
import { dataItem } from "@tolki/data";

dataItem([{ tags: ["a"] }], "0.tags");
// => ["a"]

dataItem({ desk: { price: 100 } }, "desk");
// => { price: 100 }
```

:::

## JavaScript-only additions

- Functions Laravel has on `Collection` rather than on `Arr`. All three packages export `chunk`, `chunkBy`, `chunkWhile`, `combine`, `contains`, `containsStrict`, the `diff` and `intersect` families, `filter`, `flip`, `keys`, `pad`, `pop`, `replace`, `replaceRecursive`, `reverse`, `shift`, `skipUntil`, `skipWhile`, `slice`, `splice`, `takeUntil`, `takeWhile`, `union`, `unshift` and `values`. `@tolki/data` also has `dataCount`, `dataSearch`, `dataBefore` and `dataAfter`. <!-- docs/php-parity/Collection/search.json, "search-callback"; docs/php-parity/Collection/before.json, "before-array-needle"; docs/php-parity/Collection/after.json, "after-array-needle"; docs/php-parity/Collection/count.json, "count-empty" -->
- `flattenDot` in `@tolki/obj` flattens like `dot` but drops an empty nested object or array, where `dot` keeps it as a value, as Laravel's `Arr::dot()` does. <!-- docs/php-parity/Arr/dot.json, "dot-empty-leaf", "dot-nested-empty-leaf" -->
- `dataUndot(data, true)` builds a list from paths made of whole numbers such as `"0.1"`, as `undot` from `@tolki/arr` always does. It throws a `TypeError` for any other path.
- `@tolki/obj` and `@tolki/data` read a `Map`, and `@tolki/data` reads a `Set` and a generator as a list.

```js
import {
  dataAfter,
  dataBefore,
  dataCount,
  dataFrom,
  dataGet,
  dataSearch,
  dataUndot,
} from "@tolki/data";
import { dot, flattenDot } from "@tolki/obj";

dataCount({ a: 1, b: 2 });
// => 2

dataSearch([1, 2, 3], 2);
// => 1

dataBefore([1, 2, 3], 3);
// => 2

dataAfter([1, 2, 3], 1);
// => 2

dot({ a: {}, b: { c: 1 } });
// => { a: {}, "b.c": 1 }

flattenDot({ a: {}, b: { c: 1 } });
// => { "b.c": 1 }

dataUndot({ "0.0": "x", 0.1: "y" }, true);
// => [["x", "y"]]

dataFrom(new Set([1, 2]));
// => [1, 2]

dataGet(new Map([["a", { b: 1 }]]), "a.b");
// => 1
```
