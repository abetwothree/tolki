# Tolki Enum Utilities List

## Enum Utilities List

As mentioned in the [Enum Utilities Installation](./index.md) page, the `@tolki/ts` package is not meant to be used as standalone package as it works with the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) package to transform PHP enums into TypeScript enums. The functions below are being listed out for reference, not necessarily for direct use.

<div class="collection-method-list" markdown="1">

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

</div>

## Enum Utilities Details

### cases

Similar to the PHP [cases](https://www.php.net/manual/en/unitenum.cases.php) method, this function returns an array of all the cases of the given enum.

```javascript
import { cases } from "@tolki/ts";
import { Status } from "@js/types/enums";

const result = cases(Status); // result is an array with an enum instance for each case in the Status enum
```

### defineEnum

This is a factory function that is automatically applied by the Laravel TypeScript Publisher package when it transforms PHP enums into TypeScript enums. It automatically adds the `cases`, `from`, and `tryFrom` methods to the transformed TypeScript enums.

```javascript
import { defineEnum } from "@tolki/ts";

const Status = defineEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  // automatically added by the Laravel TypeScript Publisher package
  _cases: ["ACTIVE", "INACTIVE", "PENDING"],
  _methods: [],
  _static: [],
});

Status.cases(); // result is an array with an enum instance for each case in the Status enum
Status.from("active"); // result is the enum instance for the ACTIVE case
Status.tryFrom("non-valid-key"); // result null
```

### from

Similar to the PHP [from](https://www.php.net/manual/en/backedenum.from.php) method, this function returns the enum instance for the given value. If the value does not exist in the enum, it throws an error.

```javascript
import { from } from "@tolki/ts";
import { Status } from "@js/types/enums";

const result = from(Status, "active"); // result is the enum instance for the ACTIVE case
const result2 = from(Status, "non-valid-key"); // throws an error because "non-valid-key" is not a valid value
```

### tryFrom

Similar to the PHP [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php) method, this function returns the enum instance for the given value. If the value does not exist in the enum, it returns null instead of throwing an error.

```javascript
import { tryFrom } from "@tolki/ts";
import { Status } from "@js/types/enums";

const result = tryFrom(Status, "active"); // result is the enum instance for the ACTIVE case
const result2 = tryFrom(Status, "non-valid-key"); // result is null because "non-valid-key" is not a valid value
```
