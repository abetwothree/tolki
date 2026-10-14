# PHP Semantics

These packages port Laravel, so where JavaScript and PHP disagree about what is equal, what is true or what a key is, the port follows PHP. That keeps a result the same as the one Laravel gives. This page lists the four places it matters. The helpers behind them live in `@tolki/utils`.

## Loose and strict comparison

PHP's `==` is loose: it converts a value before it compares. A string that reads as a number equals that number, and `null` equals `0`, `""` and `[]`. The functions that compare values (`contains`, `search`, `unique`, `where` and others) use it, and the ones with a `Strict` twin (`containsStrict`, `whereStrict`) use PHP's `===` instead.

<!-- docs/php-parity/Php/loose-equal.json, "one and its numeric string", "null and zero", "null and empty string", "null and an empty array", "null and undefined-as-null", "zero and a letter", "one and zero-padded one" -->

`looseEqual` from `@tolki/utils` is the `==` operator. `"1" == 1` and `null == 0` are both true in PHP. PHP has no `undefined`, so the port reads it as `null`. `"abc"` does not equal `0`, but `"1"` equals `"01"`. JavaScript's own `==` gives a different answer for `null == 0` (false) and for `"1" == "01"` (false).

```js
import { looseEqual } from "@tolki/utils";

looseEqual("1", 1);
// => true

looseEqual(null, 0);
// => true

looseEqual(null, undefined);
// => true

looseEqual("abc", 0);
// => false

looseEqual("1", "01");
// => true
```

The `contains` and `containsStrict` pair shows the difference on a list.

::: code-group

```js [@tolki/arr]
import { contains, containsStrict } from "@tolki/arr";

contains([1, 2, 3], "1");
// => true

containsStrict([1, 2, 3], "1");
// => false
```

```js [@tolki/obj]
import { contains, containsStrict } from "@tolki/obj";

contains({ a: "1" }, 1);
// => true

containsStrict({ a: "1" }, 1);
// => false
```

```js [@tolki/data]
import { dataContains, dataContainsStrict } from "@tolki/data";

dataContains([1, 2, 3], "1");
// => true

dataContainsStrict({ a: "1" }, 1);
// => false
```

:::

On a `Collection`, `where` is loose and `whereStrict` is strict, and `where` with a `==` or `===` operator picks the same two.

```js
import { collect } from "@tolki/collection";

const rows = collect([{ a: 1 }, { a: "1" }, { a: 2 }]);

rows.where("a", 1).all();
// => [{ a: 1 }, { a: "1" }]

rows.whereStrict("a", 1).all();
// => [{ a: 1 }]

rows.where("a", "===", 1).all();
// => [{ a: 1 }]
```

## Truthiness

Wherever a callback or a value is tested for being true, PHP's rule applies, not JavaScript's. The tests are `filter()` with no callback, `Collection`'s `reject()` with no argument, `Collection`'s `where` without an operator, and what a callback to `first`, `where`, `reject`, `every`, `some` or `sole` answers.

<!-- docs/php-parity/Php/truthiness.json, "truthiness-the-string-zero", "truthiness-the-string-0.0", "truthiness-an-empty-string", "truthiness-integer-zero", "truthiness-null", "truthiness-an-empty-array", "truthiness-an-array-holding-zero", "truthiness-NAN", "truthiness-an-empty-object" -->

In PHP the string `"0"`, the empty string, `0`, `null`, `false` and the empty array are false. The string `"0.0"`, `NaN` and a non-empty array are true. The port keeps the same list and adds the JavaScript containers that have no PHP twin: an empty plain object, an empty `Map` and an empty `Set` are false. Any other object is true, however empty.

```js
import { collect } from "@tolki/collection";
import { isFalsy, isPhpFalsy } from "@tolki/utils";

collect(["0", "0.0", "", 0, [], {}, NaN, "a", false, null]).filter().all();
// => ["0.0", NaN, "a"]

collect([1, null, 0, 2]).reject().all();
// => [null, 0]

collect([{ a: 1 }, { a: 0 }]).where("a").all();
// => [{ a: 1 }]

isPhpFalsy("0");
// => true

isFalsy("0");
// => false

isPhpFalsy(new Map());
// => true

isPhpFalsy(NaN);
// => false
```

`isFalsy` is the JavaScript-minded check, where `"0"` is true. Use `isPhpFalsy` when you want the rule the packages use.

A callback that answers `"0"` counts as false, and one that answers `"0.0"` counts as true.

<!-- docs/php-parity/Arr/callback-truthiness.json, "C32-C-arr-callback-php-truthiness" -->

::: code-group

```js [@tolki/arr]
import { where } from "@tolki/arr";

where(["a", "b"], () => "0");
// => []

where(["a", "b"], () => "0.0");
// => ["a", "b"]
```

```js [@tolki/obj]
import { where } from "@tolki/obj";

where({ x: "a", y: "b" }, () => "0");
// => {}

where({ x: "a", y: "b" }, () => "0.0");
// => { x: "a", y: "b" }
```

```js [@tolki/data]
import { dataWhere } from "@tolki/data";

dataWhere(["a", "b"], () => "0");
// => []

dataWhere({ x: "a", y: "b" }, () => "0.0");
// => { x: "a", y: "b" }
```

:::

## Key casting

PHP stores a string key that reads as a plain integer, such as `"10"`, as the number `10`. A string such as `"01"` stays a string. The port does the same, so a callback gets a number for `"10"` and a string for `"01"`, and `keys` lists them that way.

<!-- docs/php-parity/Collection/callback-key-types.json, "C32-E-callback-key-types-sweep" -->
<!-- docs/php-parity/Arr/set.json, "set-record-key-cast" -->

A callback sees the number `1` for the key `"1"` and a string for `"x"`, and `set` writes the key `"1"` as an integer but `"01"` as a string.

::: code-group

```js [@tolki/arr]
import { keys } from "@tolki/arr";

keys(["a", "b"]);
// => [0, 1]
```

```js [@tolki/obj]
import { keys } from "@tolki/obj";

keys({ 10: "a", "01": "b", x: "c" });
// => [10, "01", "x"]
```

```js [@tolki/data]
import { dataKeys } from "@tolki/data";

dataKeys({ 10: "a", "01": "b", x: "c" });
// => [10, "01", "x"]
```

:::

```js
import { map, set } from "@tolki/obj";

map({ 10: 1, "01": 2, x: 3 }, (value, key) => typeof key);
// => { 10: "number", "01": "string", x: "string" }

set({ x: 1 }, "1", "V");
// => { 1: "V", x: 1 }

set({ x: 1 }, "01", "V");
// => { x: 1, "01": "V" }
```

`phpArrayKey` from `@tolki/utils` applies the rule to one key. Two keys that cast to the same key are one key, so the later value wins, as in a PHP array literal.

<!-- docs/php-parity/Arr/first.json, "first-collision" -->

```js
import { values } from "@tolki/obj";
import { phpArrayKey } from "@tolki/utils";

phpArrayKey("10");
// => 10

phpArrayKey("-5");
// => -5

phpArrayKey("01");
// => "01"

values(
  new Map([
    [1, "a"],
    ["1", "b"],
  ]),
);
// => ["b"]
```

## Exceptions

The errors Laravel throws exist here under the same names. `@tolki/utils` exports them, and each one extends `Error`, so `instanceof` tells them apart.

<!-- docs/php-parity/Arr/integer.json, "integer-string-value" -->
<!-- docs/php-parity/Arr/sole.json, "sole-none", "sole-multi-list" -->
<!-- docs/php-parity/Collection/ensure.json, "C32-A-ensure-scalar-message" -->
<!-- docs/php-parity/Collection/callback-truthiness.json, "C32-C-collection-callback-php-truthiness" -->

| Class                         | Thrown when                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `InvalidArgumentException`    | A typed getter (`string`, `integer`, `float`, `boolean`) finds another type. |
| `ItemNotFoundException`       | `sole` or `firstOrFail` finds no match.                                      |
| `MultipleItemsFoundException` | `sole` finds more than one match. It carries the number found as `count`.    |
| `UnexpectedValueException`    | `Collection.ensure` meets an item of a type you did not allow.               |

```js
import { sole } from "@tolki/arr";
import { integer } from "@tolki/obj";
import {
  InvalidArgumentException,
  ItemNotFoundException,
  MultipleItemsFoundException,
} from "@tolki/utils";

sole([1, 2], () => true);
// => throws MultipleItemsFoundException

integer({ a: "x" }, "a");
// => throws InvalidArgumentException

let caught;

try {
  sole([]);
} catch (error) {
  caught = error instanceof ItemNotFoundException;
}

caught;
// => true

try {
  sole([1, 2], () => true);
} catch (error) {
  caught = error instanceof MultipleItemsFoundException && error.count;
}

caught;
// => 2

try {
  integer({ a: "x" }, "a");
} catch (error) {
  caught = error instanceof InvalidArgumentException;
}

caught;
// => true
```
