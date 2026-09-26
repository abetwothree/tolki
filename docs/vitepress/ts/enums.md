# Enums

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns every PHP enum into a TypeScript object that behaves like the PHP enum, not only a union of its values. `.from()`, `.tryFrom()` and `.cases()` work on it through the `@tolki/ts` package, and you can publish your enum's own methods and static methods alongside the cases.

For example, this enum publishes its cases and its `label()` method:

```php
enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    #[TsEnumMethod]
    public function label(): string
    {
        return match($this) {
            self::Active => 'Active User',
            self::Inactive => 'Inactive User',
        };
    }
}
```

On the frontend, you use the published enum much like the PHP one:

```typescript
import { Status } from "@js/types/data/app/enums";

Status.Active; // 'active'
Status.label.Active; // 'Active User'
Status.from("active").label; // 'Active User', a PHP-like enum "instance"
```

`@tolki/ts` works together with the files this package generates and isn't meant to be used on its own. [Installation & Usage](./index.md) covers installing it. To send one enum case to the frontend as a full object, return it through [`EnumResource`](./enum-api-resource.md).

## How Enums Are Generated

The `ts:publish` command publishes each enum as follows:

- **One file per enum**: `App\Enums\Status` is written to `app/enums/status.ts`, following the enum's namespace. Each namespace directory also gets an `index.ts` barrel that re-exports its files (`export * from './status'`).
- **Backed and unit enums**: enums backed by `int` or `string` and unit enums are all supported. A unit enum uses each case name as its value.
- **Metadata**: with `enums.metadata_enabled` on (the default), each enum has a `backed` flag and a `_cases` list. It also gets a `_methods` list when it publishes [instance methods](#tsenummethod), and a `_static` list when it publishes [static methods](#tsenumstaticmethod).
- **The `defineEnum()` wrapper**: with `enums.use_tolki_package` also on (the default), the enum is wrapped in `defineEnum()` from `@tolki/ts`.

## Anatomy of a Generated Enum

For a `Color` enum with case descriptions and a `hex()` method, the published file looks like this:

```typescript
import { defineEnum } from "@tolki/ts";

/**
 * Colors a label can use.
 *
 * @see App\Enums\Color
 */
export const Color = defineEnum({
  /** Primary red color */
  Red: "red",
  /** Primary green color */
  Green: "green",
  Blue: "blue",
  backed: true,
  /** Get the hex code for the color */
  hex: {
    Red: "#EF4444",
    Green: "#22C55E",
    Blue: "#3B82F6",
  },
  _cases: ["Red", "Green", "Blue"],
  _methods: ["hex"],
} as const);

export type ColorType = "red" | "green" | "blue";
export type ColorKind = "Red" | "Green" | "Blue";
```

Each part of the file does one job:

- **JSDoc comments**: the PHPDoc descriptions of the enum and its cases. See [PHPDoc Descriptions](#phpdoc-descriptions).
- **`backed`**: whether the PHP enum is backed. [`EnumResource`](./enum-api-resource.md) responses include the same key, and [`AsEnum`](#type-reference) types it.
- **`hex`**: an instance method published with [`#[TsEnumMethod]`](#tsenummethod), with one value per case.
- **`_cases`, `_methods` and `_static`**: the lists the `@tolki/ts` functions read to build a PHP-like instance. See [Runtime Utilities](#runtime-utilities).
- **`ColorType` and `ColorKind`**: type aliases for the case values and the case names. See [Value & Key Types](#value-key-types).

## Enum Attributes

All attributes live in the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute               | Target        | Description                                                                               |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| `#[TsEnumMethod]`       | Method        | Publish a method's return value. Called once per case, producing an object keyed by case. |
| `#[TsEnumStaticMethod]` | Static method | Publish a static method's return value. Called once and added as a top-level property.    |
| `#[TsEnum]`             | Enum class    | Rename the enum or add a description.                                                     |
| `#[TsCase]`             | Enum case     | Rename a case, change its frontend value, or add a description.                           |
| `#[TsExclude]`          | Class, method | Exclude a whole enum or one method.                                                       |

### `#[TsEnumMethod]`

Mark an instance method with `#[TsEnumMethod]` to publish its return value for every case. Here the attribute also renames the key and adds a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnumMethod;

enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';

    #[TsEnumMethod(name: 'statusLabel', description: 'Human-readable label')]
    public function label(): string
    {
        return match($this) {
            self::Active => 'Active User',
            self::Inactive => 'Inactive User',
        };
    }
}
```

The method's values publish under the new key, one per case:

```typescript
export const Status = defineEnum({
  Active: "active",
  Inactive: "inactive",
  backed: true,
  /** Human-readable label */
  statusLabel: {
    Active: "Active User",
    Inactive: "Inactive User",
  },
  _cases: ["Active", "Inactive"],
  _methods: ["statusLabel"],
} as const);
```

The attribute takes these parameters:

| Parameter     | Type     | Default     | Description                                                                                                         |
| ------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` | Method name | The key name in the output. [`enums.method_case`](#casing) applies to it too.                                       |
| `description` | `string` | `''`        | A JSDoc comment above the property.                                                                                 |
| `params`      | `array`  | `[]`        | Named arguments to call the method with. See [Methods With Required Parameters](#methods-with-required-parameters). |

#### Methods With Required Parameters

A method with required parameters is skipped by default, instead of publishing misleading `null` values. To include one, pass `params`. The package calls the method once per case, with those values as named arguments:

```php
#[TsEnumMethod(description: 'Compare with threshold', params: ['threshold' => 1])]
public function isAboveThreshold(int $threshold): bool
{
    return $this->value > $threshold;
}
```

`params` values must be constant expressions, because they're PHP attribute arguments. A method whose parameters are all optional needs no `params`. If a method throws for a case, that case's value publishes as `null`.

### `#[TsEnumStaticMethod]`

`#[TsEnumStaticMethod]` takes the same `name`, `description` and `params` options. The package calls the method once, not once per case, and publishes its return value as one top-level property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnumStaticMethod;

#[TsEnumStaticMethod]
public static function options(): array
{
    return array_map(fn (self $s) => ['value' => $s->value, 'label' => $s->name], self::cases());
}
```

The return value publishes as it is:

```typescript
export const Status = defineEnum({
  // ...cases
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  _static: ["options"],
} as const);
```

A static method with required parameters is skipped unless you pass `params`, the same as with `#[TsEnumMethod]`.

### `#[TsEnum]`

`#[TsEnum]` renames the enum's TypeScript const, or adds a description to it:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnum;

#[TsEnum('UserStatus', description: 'All possible user account statuses')]
enum Status: string { case Active = 'active'; case Inactive = 'inactive'; }
```

The new name also names the type aliases:

```typescript
/**
 * All possible user account statuses
 *
 * @see App\Enums\Status
 */
export const UserStatus = defineEnum({
  Active: "active",
  Inactive: "inactive",
  // ...
} as const);

export type UserStatusType = "active" | "inactive";
export type UserStatusKind = "Active" | "Inactive";
```

The file takes the new name too (`user-status.ts`), and models that use the enum refer to it as `UserStatusType`. The attribute takes these parameters:

| Parameter     | Type     | Description                                                                     |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| `name`        | `string` | The TypeScript const name. Use it to avoid a name collision between namespaces. |
| `description` | `string` | A JSDoc comment. It takes priority over any PHPDoc description.                 |

### `#[TsCase]`

`#[TsCase]` renames a case, changes its frontend value, or adds a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCase;

enum Status: int
{
    #[TsCase(name: 'Enabled', value: 'enabled', description: 'The user can sign in')]
    case Active = 1;

    #[TsCase(name: 'Disabled', value: 'disabled')]
    case Inactive = 0;
}
```

The published enum and its type aliases use the new names and values:

```typescript
export const Status = defineEnum({
  /** The user can sign in */
  Enabled: "enabled",
  Disabled: "disabled",
  // ...
} as const);

export type StatusType = "enabled" | "disabled";
export type StatusKind = "Enabled" | "Disabled";
```

The attribute takes these parameters:

| Parameter     | Type            | Description                     |
| ------------- | --------------- | ------------------------------- |
| `name`        | `string`        | The case's key name.            |
| `value`       | `string \| int` | The case's value.               |
| `description` | `string`        | A JSDoc comment above the case. |

::: warning
A changed `value` applies to the published enum and to [`EnumResource`](./enum-api-resource.md) responses. Laravel still serializes an enum-cast model column with the PHP value, so a model's `{Enum}Type` property won't match the JSON your API sends for that column.
:::

## Value & Key Types

Every enum gets a `{Name}Type` alias of its case values. A backed enum also gets a `{Name}Kind` alias of its case names. A unit enum doesn't need one, because its values already are its case names:

```typescript
export type StatusType = "active" | "inactive";
export type StatusKind = "Active" | "Inactive"; // backed enums only
```

Use the aliases to type a raw value or a case name:

```typescript
import type { StatusType, StatusKind } from "@js/types/data/app/enums";

function setStatus(status: StatusType) {} // only 'active' | 'inactive'
function setStatusByKey(status: StatusKind) {} // only 'Active' | 'Inactive'
```

## Metadata & the `defineEnum()` Wrapper

With `enums.metadata_enabled` on, every enum has a `_cases` list, plus `_methods` and `_static` lists when it publishes instance or static methods. You don't read these lists yourself. `defineEnum()` and the standalone `from`, `tryFrom` and `cases` functions use them to build a PHP-like instance from a case value:

```typescript
import { Status } from "@js/types/data/app/enums";

const instance = Status.from("active");
// { name: 'Active', value: 'active', backed: true, label: 'Active User', options: [...] }
```

An instance method resolves to its value for the matched case (`label`), and a static method passes through as it is (`options`). See [Runtime Utilities](#runtime-utilities) for every function.

### Disabling Metadata or the `@tolki/ts` Wrapper

Set `enums.metadata_enabled` to `false` to publish plain enum objects, without `backed`, the `_cases`, `_methods` and `_static` lists, or the `defineEnum()` wrapper:

```php
// config/ts-publish.php
'enums' => [
    'metadata_enabled' => false,
],
```

To keep the metadata but drop the wrapper, turn off `enums.use_tolki_package` instead:

```php
'enums' => [
    'metadata_enabled' => true,
    'use_tolki_package' => false,
],
```

::: warning `use_tolki_package` Affects More Than Enums
The setting controls every `AsEnum<>` type the package publishes:

- **Models**: the `{Model}Resource` interfaces and the `import { type AsEnum }` line aren't generated. The main `{Model}` interface uses `{Enum}Type` for enum columns either way. See [Enum-Typed Columns](./models.md#enum-typed-columns-model-resource).
- **API resources**: an `EnumResource::make()` property publishes as `StatusType` instead of `AsEnum<typeof Status>`, and the enum is imported as a type (`import type { StatusType }`) instead of a value (`import { Status }`). See [Enum Properties with `EnumResource`](./api-resources.md#enum-properties-with-enumresource).
- **Inertia shared data**: an `EnumResource` prop shared from `HandleInertiaRequests::share()` publishes as `RoleType` with a type import, instead of `AsEnum<typeof Role>` with a value import. See [Inertia](./inertia.md).

Leave it on unless your enums must not depend on `@tolki/ts` at runtime. [Routes](./routing.md) import `@tolki/ts` whatever this setting is.
:::

## Auto-Including All Enum Methods

By default, only methods marked with `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` publish. To publish every public method without marking each one, turn on auto-include:

```php
// config/ts-publish.php
'enums' => [
    'auto_include_methods' => true,        // all public instance methods
    'auto_include_static_methods' => true, // all public static methods
],
```

Auto-include adds public methods only. It never adds private or protected methods, magic methods such as `__call()`, or PHP's built-in `cases()`, `from()` and `tryFrom()`. You can still mark a method with its attribute to set its `name`, `description` or `params` while auto-include handles the rest. A method with required parameters is still skipped unless its attribute passes `params`.

::: warning
Both settings are off by default because they publish the return value of every public method on your enums. Check that's what you want before you turn them on.
:::

## PHPDoc Descriptions

The package reads doc blocks and turns their descriptions into JSDoc comments:

| Location        | JSDoc placement                      |
| --------------- | ------------------------------------ |
| Enum class      | Above the `export const` declaration |
| Enum case       | Above the case property              |
| Instance method | Above the method property            |
| Static method   | Above the static method property     |

Tag lines such as `@param`, `@return` and `@phpstan-type` are removed, so only the prose description carries over. When an attribute sets a `description` too, the attribute wins over the PHPDoc block.

## Filtering & Excluding Enums

Enums use the same include and exclude settings as models, resources and the other published types:

```php
// config/ts-publish.php
'enums' => [
    'included' => [App\Enums\Status::class],       // only these (empty = all)
    'excluded' => [App\Enums\Internal::class],      // never publish these
    'additional_directories' => ['modules/Blog/Enums'],
],
```

`#[TsExclude]` on the enum class excludes the whole enum. On a method, it excludes only that method, even when auto-include or an attribute would otherwise publish it. See [Excluding Content](./excluding-content.md) for how `#[TsExclude]` works across models, resources and routes.

## Casing

`enums.method_case` sets the casing of published method keys: `'camel'` (default), `'snake'` or `'pascal'`. It doesn't rename your PHP methods, and it also applies to a key set with the attributes' `name` parameter. See [Casing Configurations](./casing-configuration.md) for examples.

## Runtime Utilities

`@tolki/ts` exports these functions, which give `defineEnum()` its PHP-like behavior. You normally call them through the published enum (`Status.from(...)`) instead of importing them.

<div class="collection-method-list" markdown="1">

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

</div>

### cases

Like PHP's [cases](https://www.php.net/manual/en/unitenum.cases.php) method, `cases` returns an array with one resolved instance per case:

```typescript
import { cases } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = cases(Status); // one resolved instance per case in Status
```

### defineEnum

The published files wrap each enum in `defineEnum`, which binds `from`, `tryFrom` and `cases` to the enum object:

```typescript
import { defineEnum } from "@tolki/ts";

const Status = defineEnum({
  ACTIVE: "active",
  INACTIVE: "inactive",
  _cases: ["ACTIVE", "INACTIVE"],
  _methods: [],
  _static: [],
});

Status.cases();
Status.from("active");
Status.tryFrom("non-valid-key"); // null
```

### from

Like PHP's [from](https://www.php.net/manual/en/backedenum.from.php), `from` returns the enum instance for a value, and throws if the value matches no case:

```typescript
import { from } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = from(Status, "active");
from(Status, "non-valid-key"); // throws
```

### tryFrom

Like PHP's [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), `tryFrom` works like `from` but returns `null` for a value that matches no case:

```typescript
import { tryFrom } from "@tolki/ts";
import { Status } from "@js/types/data/app/enums";

const result = tryFrom(Status, "active");
const missing = tryFrom(Status, "non-valid-key"); // null
```

## Vite Plugin

The `@tolki/ts` package ships a Vite plugin that republishes enums and routes automatically during development. See the [Vite Plugin documentation](./vite-plugin.md).

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `enums.*` config key, including the pipeline class overrides for advanced customization.

## Type Reference

The runtime functions come from `@tolki/ts`. The types come from `@tolki/types`, and `@tolki/ts` re-exports `AsEnum`, `CaseValue`, `DefineEnumResult`, `EnumConst` and `FromResult`:

| Export                            | Description                                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineEnum()`                    | Wraps a raw enum const with bound `from`, `tryFrom` and `cases` helpers.                                                                                                                                        |
| `from()`, `tryFrom()`, `cases()`  | Standalone versions that take the enum object as their first argument.                                                                                                                                          |
| `EnumConst`                       | The base shape every generated enum const satisfies.                                                                                                                                                            |
| `CaseKeys<T>` / `CaseValue<T>`    | The union of case key names, or of case values, for an enum const.                                                                                                                                              |
| `MethodKeys<T>` / `StaticKeys<T>` | The union of instance method key names, or of static method key names.                                                                                                                                          |
| `FromResult<T, V>`                | The resolved instance type that `from(T, V)` returns.                                                                                                                                                           |
| `DefineEnumResult<T>`             | The return type of `defineEnum()`: the const plus its bound helpers.                                                                                                                                            |
| `AsEnum<T, V?>`                   | A resolved instance at the type level: a discriminated union across all cases, or one case with the second parameter. It types the JSON that the [`EnumResource`](./enum-api-resource.md) API resource returns. |
