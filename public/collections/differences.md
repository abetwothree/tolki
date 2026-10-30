---
url: /collections/differences.md
---
# Differences from Laravel

`@tolki/collection` follows Laravel's `Collection` wherever JavaScript can hold the same data. These are the places where it cannot, or chooses not to.

## Reading items

* `$c['a']` is `c.offsetGet('a')`, `$c->get('a', 0)` is `c.get('a', 0)`, and `$c->all()['a']` is `c.all().a` or `const { a } = c.all()`. There is no `c.a` or `c[0]`, and `$c->a` throws in Laravel too.&#x20;

```js
import { collect } from "@tolki/collection";

const c = collect({ a: 1 });

c.offsetGet("a");
// => 1

c.get("b", 0);
// => 0

c.all().a;
// => 1
```

## Keys and order

* A list stays a list, since a JavaScript array cannot hold sparse keys: where PHP would leave a gap in a list's integer keys, the collection renumbers them, so `collect([1, 2, 3]).filter((v) => v !== 2).all()` is `[1, 3]`, where PHP keeps the keys `0` and `2`. A keyed write such as `put(5, 'x')` keeps PHP's keys, and the list becomes keyed.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect([1, 2, 3])
    .filter((v) => v !== 2)
    .all();
  // => [1, 3]

  collect([1, 2]).put(5, "x").all();
  // => { 0: 1, 1: 2, 5: "x" }
  ```

* `duplicates()` and `chunk()` keep PHP's positional keys, because the keys are the answer, and so do `groupBy(key, true)` and `random(n, true)`, which ask for them.&#x20;

* `chunkBy()` and `chunkWhile()` do not follow `chunk()`: the chunks of a list are lists, so each one counts from 0 again, where PHP's later chunks keep the keys their items had. A keyed collection keeps its string keys in each chunk.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect([1, 2, 3, 4, 5]).chunk(2).toArray();
  // => [{ 0: 1, 1: 2 }, { 2: 3, 3: 4 }, { 4: 5 }]

  collect([1, 1, 2, 2, 3])
    .chunkBy((value) => value)
    .toArray();
  // => [[1, 1], [2, 2], [3]]

  collect({ a: 1, b: 1, c: 2 })
    .chunkBy((value) => value)
    .toArray();
  // => [{ a: 1, b: 1 }, { c: 2 }]
  ```

* A keyed collection keeps its object backing even when its keys run `0..n-1`: `collect({ 0: 'a', 1: 'b' })`'s `all()` and `toArray()` are `{ 0: 'a', 1: 'b' }`, where PHP's `all()` is the list `['a', 'b']`. `values()` gives the list, and `jsonSerialize()` answers it and `toJson()` writes `["a","b"]`, as PHP's do.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  const keyed = collect({ 0: "a", 1: "b" });

  keyed.all();
  // => { 0: "a", 1: "b" }

  keyed.values().all();
  // => ["a", "b"]

  keyed.toJson();
  // => '["a","b"]'
  ```

* A keyed collection lists its integer keys in ascending order, as a plain object does. Where PHP keeps integer keys out of sequence (`[2 => 'c', 0 => 'a']`), the methods that walk or rebuild such a collection can answer differently from Laravel. In this port, keys built from a `Map`, and items appended after a string key, keep their insertion order wherever the class already tracks it.&#x20;

* The sort family (`sort()`, `sortDesc()`, `sortBy()`, `sortByDesc()`, `sortKeys()`, `sortKeysDesc()`, `sortKeysUsing()`) and `reverse()` renumber integer keys from 0 in the new order and keep string keys, where PHP keeps every key: `collect([3, 1, 2]).sort()` has the keys `0, 1, 2` and writes `[1,2,3]`, where PHP's has `1, 2, 0` and writes `{"1":1,"2":2,"0":3}`.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect([3, 1, 2]).sort().keys().all();
  // => [0, 1, 2]

  collect([3, 1, 2]).sort().toJson();
  // => '[1,2,3]'
  ```

* On a collection mixing integer and string keys, the sort family and `reverse()` list the integer keys first, as a plain object does, so a new order that puts a string key before an integer one is lost: `collect({ 0: 1, x: 2 }).reverse()` keeps the values `[1, 2]` and `collect({ 0: 3, x: 1 }).sort()` the values `[3, 1]`, where PHP's have the keys `['x', 0]` and the values `[2, 1]` and `[1, 3]`.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect({ 0: 1, x: 2 }).reverse().values().all();
  // => [1, 2]

  collect({ 0: 3, x: 1 }).sort().values().all();
  // => [3, 1]
  ```

* PHP remembers the highest integer key a collection has held, so after `forget()` removes that key the next append still counts on from it: `collect([5 => 'a', 6 => 'b'])->forget(6)->push('x')` stores `'x'` under `7`, where this port uses `6`.&#x20;

## Values

* `all()` hands back the collection's own items, not a copy, so writing to them writes to the collection, where PHP's `all()` returns a copy of its array. `toArray()` and `collect()` return copies.&#x20;

* Truthiness is PHP's, not JavaScript's: see [Truthiness](../arrays-objects/php-semantics.md#truthiness). So `reject(false)` rejects `null` and `{}` too but keeps `'0.0'`, a callback answering `NaN` counts as true, and an ArrayAccess-style item whose `offsetExists()` answers `'0'` or `[]` reads as absent.&#x20;

* `unique()` and `duplicates()` keep the first of each loosely equal run in one walk (see [Loose and strict comparison](../arrays-objects/php-semantics.md#loose-and-strict-comparison)). Where `==` is not transitive across mixed types, PHP's answer can differ: `collect(['abc', '0', false, '']).unique()` keeps `''`, which PHP drops.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect(["abc", "0", false, ""]).unique().all();
  // => ["abc", "0", ""]
  ```

* `diff()`, `diffAssoc()`, `intersect()` and `intersectAssoc()` match an array or object item by identity, where PHP compares string casts: every array casts to `"Array"`, so `collect([[1], [2]]).diff([[1]])` keeps both items where PHP's keeps none, and an object casts through its `__toString()`, or throws without one.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect([[1], [2]])
    .diff([[1]])
    .all();
  // => [[1], [2]]
  ```

* `toJson()` writes `/` and non-ASCII characters as they are, where PHP's `json_encode()` escapes them (`\/`, `\u00e9`); both decode to the same value.&#x20;

  ```js
  import { collect } from "@tolki/collection";

  collect(["a/b", "é"]).toJson();
  // => '["a/b","é"]'
  ```

## JavaScript-only additions

* `length`, `[Symbol.iterator]` (so `for...of` and spreading work), `toJSON()` (so `JSON.stringify(c)` encodes the items) and `[Symbol.toPrimitive]` (the count for `+c`, and the JSON for `` `${c}` ``, as PHP's string cast gives).&#x20;
* `toJson(replacer, space)` and `toPrettyJson(replacer, space)` take `JSON.stringify()`'s arguments in place of PHP's flags.
* `reduceInto()`'s callback may return the new accumulator, since JavaScript cannot pass a primitive by reference.
* `avg()` and `average()` hand their callback the key as well.
* `whereBetween()` and `whereNotBetween()` accept a collection of bounds, from which PHP reads none, so its `whereBetween()` keeps no item and its `whereNotBetween()` every one.&#x20;
* `keyBy()`, `groupBy()` and `countBy()` read an `@tolki/enum` case as its value, as PHP's `enum_value()` does.&#x20;
* `eachSpread()` and `mapSpread()` hand the callback a scalar row whole, where PHP throws.&#x20;
* `eachSpread()` and `mapSpread()` spread a string-keyed row (a plain object, a `Map` or a collection) by its values, where PHP throws `Cannot use positional argument after named argument during unpacking`.&#x20;
* `ensure()` also takes JavaScript's `typeof` names (`'number'`, `'object'`, …) beside PHP's `get_debug_type()` names and classes.
* A `Map` is accepted wherever PHP takes an array. `undefined` reads as `null` through a path, in the loose comparisons of `contains()`, `search()` and `where()`, and in truthiness (`whereNull('a')` matches `{ a: undefined }`), but an `undefined` item compared strictly, or by the string cast of `diff()` and `intersect()`, is not `null`: keyless `whereNull()` and `containsStrict(null)` skip it, and `diff([null])` keeps it.

## Not portable

* Higher-order proxies (`$c->map->name`, `proxy()`, and the one-argument `when()` and `unless()`), `Macroable` (`macro()`), `lazy()` and `LazyCollection`, `dd()`, `getCachingIterator()`, and PHP's sort flags: every sort takes only a direction.
* `fromJson()` takes `depth` and `flags` for PHP's signature and ignores them. A `WeakMap` cannot be iterated, so it makes an empty collection. An `@tolki/enum` case is a plain object, so `collect()` reads it as a record of its fields, where PHP wraps an enum case as one item.&#x20;
* Paths read only an object's own fields, so a class getter reads as absent.

## TypeScript limits

* In-place writes cannot narrow the variable they are called on: `c.put('x', 1)` returns the widened type while `c` keeps its declared one, and `c` still names the keys `forget()`, `pull()` or `offsetUnset()` removed.
* There is deliberately no index signature, so `c.a` is a compile error and `c[0]` is untyped (an error under `noImplicitAny`); read items as shown under Reading items.
* A subclass's static factory is typed as the base class: `Sub.make([1])` is a `Collection<number>` to TypeScript, though it returns a `Sub`.
* PHP's `int` and `float` are both `number`, so `ensure('int')` and `ensure('float')` narrow to the same type.
* `new Collection(x)` types only what the class's own type parameters can say, since a constructor cannot declare its own: a `Map<string, V>` stays keyed by `string` (PHP stores a numeric string key as an integer), a record with integer keys gets the list shape (`new Collection({ 1: 'a' })`), a Jsonable is typed by its own members and a JsonSerializable answering a scalar by that scalar's, and a list-or-record union takes its key type's default shape. `collect()` and `make()` type all of these exactly.
* A class operand whose only named members are getters (`class G { get name() { … } }`) is typed as holding `name`, so `merge()`, `union()`, `replace()` and `replaceRecursive()` claim a keyed result, while the runtime copies no own field and keeps a list.
* A class instance's methods are typed as items: `collect(new User())` includes `greet()` in its value and key types, though only own fields are copied, since TypeScript cannot tell a method from a function-valued field.
* A class instance row in `mapSpread()` or `eachSpread()` is typed as spreading its fields, as a plain object row is, though the runtime passes the instance whole.
* Spread rows of varying length (list rows of different lengths, or a row that may be `null`) type every callback parameter as present, each an item or the key; a shorter row's key arrives in an earlier parameter, and the ones after it are `undefined`.
* A union of two collection types cannot call an overloaded method: `(cond ? collect([1]) : collect({ a: 'x' })).filter(cb)` does not compile. Wrap the union instead: `collect(cond ? [1] : { a: 'x' })` merges its members into one collection type.
* `partition()`'s `[0]` and `[1]` survive a method that returns `this`: `c.partition(cb).filter(cb2)[0]` compiles, though the filtered collection has no such member.
* `select()` offers a primitive's or a class item's prototype members as keys (`collect(['ab']).select('length')`) and types a class item's methods as selected, though only own fields are copied.
* On a wide item type (`Collection<unknown>`, or `object`, `{}` or `Function` items), a mis-typed `contains()` or `every()` callback such as `(v: string) => …` compiles; a narrower item type rejects it.
* A misspelt `ensure()` type name compiles, since any string may name a class: `ensure('interger')` narrows the items to `object`, and the runtime throws for the items it rejects.
* `Collection.wrap()` of a class instance, an `Error` or a typed array is typed as keyed by its members, as a plain object is, though the runtime wraps it as one item.
* A plain object with an `all()` member is typed as Collection-like by `flatten()`, `mapSpread()` and `eachSpread()`, and the operand methods (`merge()`, `mergeRecursive()`, `concat()`, `union()`, `replace()`, `replaceRecursive()`, `zip()`, `crossJoin()`, `combine()`, `diffUsing()`, `intersectUsing()`) type none of its function-valued members, while the runtime treats every plain object as data: `collect([1]).merge({ all: () => ['s'] })` is typed as holding numbers alone but keeps the function under the key `'all'`.
* A plain object with a `toArray()` member is typed as an Arrayable by `collect()` and by `toArray()`'s item conversion (`collect([{ toArray: () => [9] }]).toArray()` is typed `number[][]`), though at runtime it is data and comes back unchanged. The operand methods likewise type a plain object with a `toArray()`, `toJson()` or `jsonSerialize()` member as the items that member would hand over: `collect([1]).merge({ toArray: () => ['s'] })` is typed `Collection<string | number, number, "list">`, while the runtime keeps the function under the key `'toArray'`.
* A `symbol` key compiles in `put()` and `prepend()` on a collection typed with `PropertyKey` keys, such as `Collection.fromJson('{}')`, and the runtime stores it under its string form, `'Symbol(s)'`.
