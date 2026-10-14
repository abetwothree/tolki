# Dot Notation

A dot path is a string such as `"user.address.city"` that reaches into nested arrays and objects in one call. `@tolki/arr`, `@tolki/obj`, `@tolki/data` and the `Collection` methods all read the same paths.

## Path syntax

Each segment between the dots is an object key or an array index. A number segment picks that position of an array. A path that leads nowhere gives the default, which is `null` when you leave it out.

::: code-group

```js [@tolki/arr]
import { get } from "@tolki/arr";

get([{ items: ["a", "b"] }], "0.items.1");
// => "b"

get([{ items: ["a", "b"] }], "0.items.5", "none");
// => "none"
```

```js [@tolki/obj]
import { get } from "@tolki/obj";

get({ desk: { sizes: ["s", "m"] } }, "desk.sizes.1");
// => "m"

get({ desk: { sizes: ["s", "m"] } }, "desk.color", "none");
// => "none"
```

```js [@tolki/data]
import { dataGet } from "@tolki/data";

dataGet([{ items: ["a", "b"] }], "0.items.1");
// => "b"

dataGet({ desk: { sizes: ["s", "m"] } }, "desk.color", "none");
// => "none"
```

:::

## Keys that contain a dot

An object key can hold a dot of its own. `get` from `@tolki/obj` tries the whole string as a key first, and only splits it into segments when no such key exists.

<!-- docs/php-parity/Arr/get.json, "X26 get/has/exists resolve a literal dotted key first" -->

Laravel's `Arr::get()` does the same, so the port gives the same answer.

```js
import { get } from "@tolki/obj";

get({ "a.b": 1, a: { b: 2 } }, "a.b");
// => 1

get({ a: { b: 2 } }, "a.b");
// => 2
```

## Functions that take a path

- **Read:** `get`, `has`, `hasAll`, `hasAny`, and the typed getters `string`, `integer`, `float`, `boolean` and `arrayItem` (`objectItem`, `dataItem`).
- **Write:** `set`, `add`, `forget`, `pull` and `push`. Each one creates the missing steps of a path as it goes.
- **Pick out of rows:** `pluck` takes a path for the value and for the key, and `except` takes paths among its keys.
- **Convert:** `dot` turns a nested structure into a flat object of paths, and `undot` turns it back.

::: code-group

```js [@tolki/arr]
import { dot, except, has, set, string, undot } from "@tolki/arr";

has([["a", "b"]], "0.1");
// => true

set([], "0.0", "x");
// => [["x"]]

except([["a", "b"]], ["0.1"]);
// => [["a"]]

string([{ name: "x" }], "0.name");
// => "x"

dot([{ a: 1 }, { a: 2 }]);
// => { "0.a": 1, "1.a": 2 }

undot({ "0.0": "x", 0.1: "y" });
// => [["x", "y"]]
```

```js [@tolki/obj]
import { dot, except, has, integer, set, undot } from "@tolki/obj";

has({ a: { b: 1 } }, "a.z");
// => false

set({}, "a.b.c", 1);
// => { a: { b: { c: 1 } } }

except({ a: { b: 1, c: 2 }, d: 3 }, ["a.b"]);
// => { a: { c: 2 }, d: 3 }

integer({ a: { b: 2 } }, "a.b");
// => 2

dot({ a: { b: 1, c: [2] } });
// => { "a.b": 1, "a.c.0": 2 }

undot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }
```

```js [@tolki/data]
import {
  dataDot,
  dataExcept,
  dataHas,
  dataInteger,
  dataSet,
  dataUndot,
} from "@tolki/data";

dataHas([{ a: 1 }], "0.a");
// => true

dataSet({}, "a.b.c", 1);
// => { a: { b: { c: 1 } } }

dataExcept({ a: { b: 1, c: 2 }, d: 3 }, ["a.b"]);
// => { a: { c: 2 }, d: 3 }

dataInteger({ a: { b: 2 } }, "a.b");
// => 2

dataDot({ a: { b: 1, c: [2] } });
// => { "a.b": 1, "a.c.0": 2 }

dataUndot({ "a.b": 1, "a.c": 2 });
// => { a: { b: 1, c: 2 } }
```

:::

## Wildcards

A `*` segment stands for every item at that step, and `pluck` collects what lies behind it. The result has one entry per item in front of the `*`.

<!-- docs/php-parity/Arr/pluck.json, "Arr::pluck wildcard path", "Arr::pluck wildcard + key" -->

Laravel's `Arr::pluck()` reads a `*` the same way, and the port returns the same shape.

::: code-group

```js [@tolki/arr]
import { pluck } from "@tolki/arr";

const posts = [
  { title: "A", tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", tags: [{ id: 3 }] },
];

pluck(posts, "tags.*.id");
// => [[1, 2], [3]]

pluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

```js [@tolki/obj]
import { pluck } from "@tolki/obj";

const posts = {
  a: { title: "A", tags: [{ id: 1 }, { id: 2 }] },
  b: { title: "B", tags: [{ id: 3 }] },
};

pluck(posts, "tags.*.id");
// => [[1, 2], [3]]

pluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

```js [@tolki/data]
import { dataPluck } from "@tolki/data";

const posts = [
  { title: "A", tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", tags: [{ id: 3 }] },
];

dataPluck(posts, "tags.*.id");
// => [[1, 2], [3]]

dataPluck(posts, "tags.*.id", "title");
// => { A: [1, 2], B: [3] }
```

:::

## Where wildcards do not work

Of the functions above, only `pluck` reads a `*`. `get`, `has` and their `data` versions take it as the name of a key, so a path with `*` finds nothing. The same goes for the `{first}` and `{last}` segments.

<!-- docs/php-parity/Helpers/data_get.json, "data-get-wildcard-and-first-last-segments" -->

Laravel's `data_get()` expands both of them. See [Differences from Laravel](./differences.md#behaviour-differences) for the full list.

::: code-group

```js [@tolki/arr]
import { get, has } from "@tolki/arr";

get([{ n: 1 }, { n: 2 }], "*.n");
// => null

has([{ n: 1 }], "*.n");
// => false

get([{ s: [{ x: 1 }] }], "0.s.{first}.x");
// => null
```

```js [@tolki/obj]
import { get, has } from "@tolki/obj";

get({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

has({ a: { n: 1 } }, "*.n");
// => false

get({ s: [{ x: 1 }, { x: 2 }] }, "s.{first}.x");
// => null
```

```js [@tolki/data]
import { dataGet, dataHas } from "@tolki/data";

dataGet({ a: { n: 1 }, b: { n: 2 } }, "*.n");
// => null

dataHas({ a: { n: 1 } }, "*.n");
// => false

dataGet({ s: [{ x: 1 }, { x: 2 }] }, "s.{first}.x");
// => null
```

:::

## Collections read the same paths

`@tolki/collection` methods that look inside items, such as `pluck`, `where`, `sortBy`, `keyBy` and `sum`, take the same paths, and `pluck` takes the same `*`. `get` is the exception: it takes one key, not a path. The method pages are in the Collections section, under [Methods List](../collections/methods-list.md#pluck).

```js
import { collect } from "@tolki/collection";

const posts = collect([
  { title: "A", author: { id: 2 }, tags: [{ id: 1 }, { id: 2 }] },
  { title: "B", author: { id: 1 }, tags: [{ id: 3 }] },
]);

posts.pluck("tags.*.id").all();
// => [[1, 2], [3]]

posts.where("author.id", 1).pluck("title").all();
// => ["B"]

posts.sortBy("author.id").pluck("title").all();
// => ["B", "A"]

posts.sum("author.id");
// => 3

collect({ a: { b: 1 } }).get("a.b");
// => null
```
