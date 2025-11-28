# AGENTS.md

## Package.json commands and their descriptions

- Install deps: `pnpm install`
- Run tests with coverage: `pnpm run test`
  - Other ways to run tests are with `vitest` commands using `pnpm`
- Run linter: `pnpm run lint`
  - The command above runs both `oxlint` and `eslint`
- Run formatter: `pnpm run format`
  - This uses `prettier` to format the code
- Run TypeScript type checks: `pnpm run ts:check`
- Run `pnpm list:functions <file-path>` to list all functions in a file
  - Example: `pnpm run list:functions packages/arr/src/arr.ts`
- Run `pnpm run stubs:create-lists` to create function lists from stubs

## To do lists

When it makes sense, create a to-do list when working on a feature or bugfix. Use checkboxes so that it's easy to see what is done and what is left to do.

## Return types with generics

The return type should use generics where appropriate to give better type inference to the end user.

Example of a function that returns a Collection of TValue items:

```TypeScript
// Types in types package
type ArrayFirst<T extends any[]> = T extends [] ? never : T[0];
type InferedValue<TKey extends PropertyKey, TValue> = TKey extends number ? TValue : TValue | undefined;

function shift(): ArrayFirst<TItems> {
  // function implementation ...
}

function get<TValue, TKey extends PropertyKey>(Items: Record<TKey, TValue>, key: TKey): InferedValue<TKey, TValue> | undefined {
  // function implementation ...
}
```

## Function Overrides

When creating function overrides for better typing, make sure to keep the most general override at the bottom so that TypeScript can pick the most specific one first.

Overrides should typically be added when a parameter being passed in can affect the return type so that the end user gets better type inference of the result based on the parameters passed in.

Example of the pop function which changes the return type based on the `count` parameter:

```TypeScript
pop(): TValue | null;
pop(count: number): Collection<TValue[], number>;
pop(count: number = 1): TValue | null | Collection<TValue[], number> {
  // function implementation ...
}
```

## Parameter types with generics

When using generics in parameter types, make sure to use the correct syntax for arrays and objects.

- For arrays, use `TValue[]` for an array of values of type `TValue`
- For objects, use `Record<TKey, TValue>` for an object with keys of type `TKey` and values of type `TValue`
- For union types, use `TValue | TValue[]` for a value that can be either a single value of type `TValue` or an array of values of type `TValue`
- For a key that can be the key of an array or object, use `TKey extends PropertyKey` where `PropertyKey` is a built-in TypeScript type that includes `string`, `number`, and `symbol`
  - Example:

  ```TypeScript
    function exampleFunction<TValue, TKey extends PropertyKey>(
      data: TValue[] | Record<TKey, TValue>,
      key: TKey
    ): TValue | undefined {
      // function implementation ...
    }
  ```

## Code style

- Use TypeScript and read tsconfig.json at the root for configuration
- Avoid using `any` type, use more specific types instead
- Use `unknown` type if the type is not known, and then narrow it down later
- Use `as` for type assertions instead of angle-bracket syntax
- Use optional chaining and nullish coalescing where appropriate
- Use array and object destructuring where appropriate
- Use template literals instead of string concatenation
- Use arrow functions for anonymous functions
- Use async/await for asynchronous code instead of promises directly
- Use try/catch for error handling in async functions
- Use `for...of` loops instead of traditional `for` loops where possible
- Use `map`, `filter`, `reduce` and other array methods instead of loops where possible
- Use `Set` and `Map` instead of plain objects for collections where appropriate
- Use `Object.entries()`, `Object.keys()`, `Object.values()` for object iteration
- Use `null` and `undefined` appropriately, avoid using both interchangeably
- Use `throw` for error handling instead of returning error codes or values
- Use `Promise.all()` for parallel async operations instead of sequential `await`s where possible
- Use `const` and `let` instead of `var`
- Use JSDoc comments for functions and classes
- Use ES modules (import/export)
- Use `pnpm` as package manager
- Use `prettier` for formatting
- Use `oxlint` and `eslint` for linting
- Do place line numbers on tests as the lines change often and they become outdated quickly
- Use `===` and `!==` instead of `==` and `!=`
- Do not use `any` for types. Use the most specific type possible.
- Use `unknown` for types that are not known or cannot be narrowed down.
- Use `const` for variables that are not reassigned
- Use functional patterns where possible
- Aim for 100% test coverage
  - Remove any code that isn't needed and not covered by tests
  - Code coverage files are in `./coverage/` folder after running tests with coverage
- Use `Vitest` for testing
- This is a monorepo, so all packages should be in `packages/` folder
- Instead of using the JavaScript `typeof` directly to check for value types, use the following utility functions from `@laravel-js/utils`:
  - `isArray(variable)` - checks if the variable is an array
  - `toArrayable(variable)` - converts the variable is an object with the `toArray` method
  - `isObject(variable)` - checks if the variable is a non-null non-array object
  - `isObjectAny(variable)` - checks if the variable is a object (including arrays, null)
  - `isTruthyObject(variable)` - checks if the variable is a non-null non-undefined object (including arrays)
  - `isString(variable)` - checks if the variable is a string
  - `isStringable(variable)` - checks if the variable can be cast to a string or is an object with the `toString` method
  - `objectToString`(variable) - checks if the variable is an object with the `toString` method
  - `isNumber(variable)` - checks if the variable is a number
  - `isInteger(variable)` - checks if the variable is an integer
  - `isFloat(variable)` - checks if the variable is a float
  - `isBoolean(variable)` - checks if the variable is a boolean
  - `isFunction(variable)` - checks if the variable is a function
  - `isNull(variable)` - checks if the variable is null
  - `isUndefined(variable)` - checks if the variable is undefined
  - `isSymbol(variable)` - checks if the variable is a symbol
  - `isMap(variable)` - checks if the variable is a Map
  - `isSet(variable)` - checks if the variable is a Set
  - `isWeakMap(variable)` - checks if the variable is a WeakMap
  - `isWeakSet(variable)` - checks if the variable is a WeakSet
  - `looseEqual(value1, value2)` - checks if two values are loosely equal the way that PHP does it with `==`
  - `entriesKeyValue(variable)` - converts a key of an array or object to number if it should be a number, otherwise, returns the key as is. This is useful when iterating over arrays or objects and getting the keys from `Object.entries()` or similar methods.
- For better code coverage results, use full return statements with curly braces, even for single statements, no implicit returns:

```JavaScript
// bad
if (condition) doSomething();

// good
if (condition) {
  return doSomething();
}
```

- Each function or method should have a JSDoc comment explaining its purpose, parameters, return value and examples of how to use it. Example format:

```JavaScript
/**
 * Description of the function.
 *
 * @param paramName - Description of the parameter.
 * @returns Description of the return value.
 *
 * @example
 *
 * Example of how to use the function
 * functionName(param); -> returnValue
 */
function functionName<PossibleGeneric>(paramName: PossibleGeneric): ReturnType {
  // function implementation
}
```

- The Laravel helpers are mostly static methods on classes in PHP. In JS, these should be implemented as standalone functions in the corresponding package, e.g. `arr.ts` for the `Arr` package. The reason for this is for tree-shaking reasons, so that users can import only the functions they need without pulling in an entire class of functionality when they only need one or two functions.
  - This unfortunately cannot be avoided on the Stringable or Collection version in JavaScript because those do require a class to hold the state. But for the static helper functions, they should be standalone functions.
- When writing tests, look at the corresponding Laravel test files for inspiration, but do not copy them verbatim. Adapt them to JavaScript and the specific implementation in this monorepo.
- Source of truth of the Laravel implementation for each package are in the `packages/stubs/*` folders. The files are named after the corresponding Laravel class, e.g. `Arr.php` for the `Arr` package and the tests are in the corresponding file named `ArrTest.php`. Tests from the Laravel codebase can be used as the test to implement for the JS tests, but should not be copied verbatim. Especially when the Laravel tests use PHP-specific features or syntax, they should be adapted to JS.
  - When looking at the source stub like `Arr.php`, the methods are usually static methods on a class. In JS, these should be implemented as standalone functions in the corresponding package, e.g. `arr.ts`.
  - When looking at the source test stub like `ArrTest.php`, look for the methods in static format such as `Arr::set` to find the corresponding tests.
  - Use the stubs function list files to see which functions are implemented in each stub and their order.
    - The files are named like `Arr-Function-List.txt` for the `Arr.php` stub and are located in the `fn-lists` in the same folder root.
- Functions should be written in the same order as in the Laravel stub for easier reference.
- Functions should be defined with named exports, e.g. `export function functionName() {}` instead of `export const functionName = () => {}` for easier reference and consistency.

## Structure and description of packages

Look at the package-docs.md file at the root for more details on the long term this monorepo is going for.

Packages table layout:

| Directory           | Package Name           | Description                                               |
| ------------------- | ---------------------- | --------------------------------------------------------- |
| packages/all        | @laravel-js/all        | Meta package that includes all other packages             |
| packages/arr        | @laravel-js/arr        | Array helpers                                             |
| packages/collection | @laravel-js/collection | Collection class and helpers                              |
| packages/data       | @laravel-js/data       | Helpers for working with arrays and objects               |
| packages/num        | @laravel-js/num        | Number helpers and formatting                             |
| packages/obj        | @laravel-js/obj        | Object helpers                                            |
| packages/path       | @laravel-js/path       | Path helpers for working with paths in objects and arrays |
| packages/str        | @laravel-js/str        | String helpers                                            |
| packages/types      | @laravel-js/types      | Type definitions and helpers                              |
| packages/utils      | @laravel-js/utils      | General utility functions                                 |

Folder and root files list and description of each package:

| Directory                    | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| packages/\*\*/**tests**      | Tests for the package                                         |
| packages/\*\*/dist           | Compiled output of the package                                |
| packages/\*\*/fn-lists       | Function lists extracted from stubs for reference             |
| packages/\*\*/src            | Source code for the package                                   |
| packages/\*\*/stubs          | Laravel PHP source used as source of truth for implementation |
| packages/\*\*/package.json   | Package configuration file                                    |
| packages/\*\*/vite.config.ts | Vite configuration file for building the package              |

More detailed description of the packages to be implemented:

### @laravel-js/all

- A meta package that includes all other packages as dependencies for easy installation

### @laravel-js/arr

- Array helpers
- Functions should be in the same order as in the Laravel `Arr` stub for easier reference
- We are not doing `isAssoc` or `isList` functions because in JS, arrays are always lists and there are not associative arrays. So these functions are not needed.
- use `@laravel-js/path` for path-based operations. Any function that works with paths to get, set, check or delete values in objects should use the path helpers from that package. If the function currently only works with objects, it should be adapted to work with arrays as well.
- use `@laravel-js/utils` for utility functions
- use `@laravel-js/types` for type definitions
- use `@laravel-js/obj` for any object-specific operations when an object contains objects

### @laravel-js/collection

- Collection class and helpers to work the same way as Laravel Collections. However, PHP has associative arrays and JS does not, so the Collection class should be able to handle both array-like collections (with numeric keys) and object-like collections (with string keys) but it should not try to mimic associative arrays exactly.
- Functions should be in the same order as in the Laravel `Collection.php` stub for easier reference
- The Items type describes the data structure that the Collection can hold. It can be either an array of values (TValue[]) or a record/object with keys of type TKey and values of type TValue (Record<TKey, TValue>).
- Keep public methods at the top of the class in the same order as in the Laravel stub for easier reference
- Use the `@laravel-js/data` package to handle operations that can work on both arrays and objects. This package will smartly call the appropriate helper from `@laravel-js/arr` or `@laravel-js/obj` as needed because the Collection class can hold either arrays or objects.
- Any functions that are public but there is no equivalent in the `@laravel-js/arr` or `@laravel-js/obj` packages should be implemented in those packages as well for consistency and reusability and then called from the Collection class. The `@laravel-js/data` package should also be updated to handle the new function for both arrays and objects. Then finally the Collection class can call the function from `@laravel-js/data` to handle both arrays and objects.
- Private and protected methods should be at the bottom of the class
- Use generics to type the collection items, e.g. `Collection<T>` where `T` is the type of the items in the collection
- Use tuple types for collections with fixed number of items, e.g. `Collection<[number, string]>` for a collection with two items: a number and a string
- Use array types for collections with variable number of items, e.g. `Collection<number[]>` for a collection with any number of numbers
- Stubs
  - The main stub is `packages/collection/stubs/Collection.php` which contains the `Collection` class and its methods to implement in JS in `packages/collection/src/collection.ts`.
  - The other stubs in `packages/collection/stubs/` are helper classes used by the `Collection` class. The methods from these helper classes should be integrated into the `Collection` class as needed.
    - The helper stubs are:
      - Classes
        - `packages/collection/stubs/LazyCollection.php` - class for lazy collections
      - Traits
        - `packages/collection/stubs/Conditionable.php` - trait for conditional methods
        - `packages/collection/stubs/EnumeratesValues.php` - trait for enumerating values
        - `packages/collection/stubs/Macroable.php` - trait for macros
        - `packages/collection/stubs/TransformsToResourceCollection.php` - trait for transforming to resource collection
      - Interfaces
        - `packages/collection/stubs/ArrayAccess.php` - interface for array access
        - `packages/collection/stubs/CanBeEscapedWhenCastToString.php` - interface for escaping when cast to string
        - `packages/collection/stubs/Countable.php` - interface for countable count method
        - `packages/collection/stubs/Enumerable.php` - interface for enumerable collections
        - `packages/collection/stubs/IteratorAggregate.php` - interface for the getIterator method
        - `packages/collection/stubs/Jsonable.php` - interface for json serialization toJson method
        - `packages/collection/stubs/JsonSerializable.php` - interface for json serialization jsonSerialize method
  - The test stub is `packages/collection/stubs/CollectionTest.php` which contains the tests for the `Collection` class and its methods from the Laravel codebase to use as inspiration for the JS tests.
- use `@laravel-js/data` for handling whether an operation is on an array or object and the functionality to run on that data structure
- use `@laravel-js/utils` for utility functions
- use `@laravel-js/types` for type definitions

### @laravel-js/data

- A set of helpers for working with arrays and objects, including `dataGet`, `dataSet`, `dataForget`, `dataHas`, `dataPluck`, `dataDot`, `dataUndot`
- All functions must be prefixed with `data` to avoid name collisions
- Functions should follow the same order as `arr.ts` and `obj.ts` for easier reference
- Use `@laravel-js/path` for path-based operations. Any function that works with paths to get, set, check or delete values in objects or arrays should use the path helpers from that package.
- use `@laravel-js/utils` for utility functions
- Each function should receive arrays or objects and then smartly call helpers from the `@laravel-js/arr` or `@laravel-js/obj` packages as needed
- use `@laravel-js/types` for type definitions
- Functions should be in the same order as arr.ts and obj.ts for easier reference
- Functions should be implemented like this to check data type and call the appropriate helper from `@laravel-js/arr` or `@laravel-js/obj`:
- No need to implement the following functions from Laravel's `Arr` class because they don't make sense in JS:
  - `accessible` - in JS, all objects are accessible
  - `array` - in JS, we have `Array.isArray()`
  - `wrap` - because `arrWrap` should be used directly if needed

```JavaScript
import { collapse as arrCollapse, wrap as arrWrap } from "@laravel-js/arr";
import { collapse as objCollapse } from "@laravel-js/obj";
import { isArray, isObject } from "@laravel-js/utils";

export function dataCollapse(data: unknown): unknown {
  if (isObject(data)) {
    return objCollapse(data);
  }

  return arrCollapse(arrWrap(data));
}
```

### @laravel-js/num

- Helpers for working with numbers and formatting
- Functions should be in the same order as in the Laravel `Number.php` stub for easier reference
- use `@laravel-js/types` for type definitions
- use `@laravel-js/utils` for utility functions

### @laravel-js/obj

- Object helpers that mimic Laravel's Arr helpers but for objects
- Functions should be in the same order as in the Laravel `Arr` stub for easier reference
- We are not doing `isAssoc` or `isList` functions because in JS, arrays are always lists and there are not associative arrays. So these functions are not needed.
- use `@laravel-js/path` for path-based operations. Any function that works with paths to get, set, check or delete values in objects should use the path helpers from that package. If the function currently only works with arrays, it should be adapted to work with objects as well.
- use `@laravel-js/utils` for utility functions
- use `@laravel-js/types` for type definitions
- use `@laravel-js/arr` for any array-specific operations when an object contains arrays

### @laravel-js/path

- Path helpers for working with paths in objects and arrays
- use `@laravel-js/types` for type definitions

### @laravel-js/str

- String helpers
- Functions should be in the same order as in the Laravel `Str.php` stub for easier reference
- use `@laravel-js/types` for type definitions
- use `@laravel-js/utils` for utility functions

### @laravel-js/types

- Type definitions and helpers for working with Laravel-specific types

### @laravel-js/utils

- General utility functions that don't fit in other packages
- use `@laravel-js/types` for type definitions
