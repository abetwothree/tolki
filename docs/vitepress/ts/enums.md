# Enums

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) transforms every PHP enum into a functional TypeScript object — not just a union of case values, but PHP-like enum behavior (`.from()`, `.tryFrom()`, `.cases()`) powered by `@tolki/ts`, plus any of your own instance/static methods you opt in.

As mentioned in [Installation & Usage](./index.md), the `@tolki/ts` package is not meant to be used standalone — it works together with the Laravel package's generated output.

## How Enums Are Generated

- One `.ts` file is generated per enum, at a modular, namespace-derived path (e.g. `App\Enums\Status` → `app/enums/status.ts`).
- Barrel `index.ts` files re-export everything (`export * from './status'`) for each namespace directory — unlike [routes](./routing.md), enum names don't collide across files, so barrels use `export *` rather than default-only re-exports.
- Both **backed** (`int`/`string`) and **unit** enums are supported. Unit enums use their case name as the value.
- When `enums.metadata_enabled` is on (the default), each enum includes `_cases`, `_methods`, and `_static` arrays describing its own shape, and is wrapped in `defineEnum()` from `@tolki/ts` when `enums.use_tolki_package` is also on (the default).

## Anatomy of a Generated Enum

```typescript
import { defineEnum } from '@tolki/ts';

/**
 * String-backed enum with TsCase attribute overrides on individual cases.
 *
 * @see App\Enums\Color
 */
export const Color = defineEnum({
    /** Primary red color */
    Red: 'red',
    /** Primary green color */
    Green: 'green',
    Blue: 'blue',
    backed: true,
    /** Get the hex code for the color */
    hex: {
        Red: '#EF4444',
        Green: '#22C55E',
        Blue: '#3B82F6',
    },
    _cases: ['Red', 'Green', 'Blue'],
    _methods: ['hex'],
} as const);

export type ColorType = 'red' | 'green' | 'blue';
export type ColorKind = 'Red' | 'Green' | 'Blue';
```

- The class (and each case's) PHPDoc description becomes a JSDoc comment — see [PHPDoc Descriptions](#phpdoc-descriptions).
- `backed` records whether the PHP enum is backed (used by [`AsEnum`](#type-reference) to type API responses).
- `hex` is an **instance method** — [`#[TsEnumMethod]`](#tsenummethod) — resolved to one value per case.
- `_cases` / `_methods` / `_static` are the metadata arrays the `@tolki/ts` runtime functions read to resolve "instances" — see [Runtime Utilities](#runtime-utilities).
- `ColorType` / `ColorKind` are always-generated type aliases — see [Value & Key Types](#value-key-types).

## Enum Attributes

All attributes live under the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute | Target | Description |
|---|---|---|
| `#[TsEnumMethod]` | Method | Include a method's return values in the output. Called per case, producing a key/value pair object. |
| `#[TsEnumStaticMethod]` | Static Method | Include a static method's return value. Called once, added as a top-level property. |
| `#[TsEnum]` | Enum Class | Rename the enum or add a description. |
| `#[TsCase]` | Enum Case | Rename, change the frontend value, or add a description to a case. |
| `#[TsExclude]` | Class, Method | Exclude an entire enum or a specific method. |

> [!NOTE]
> Whether via attributes or the global auto-include config, only **public** methods are ever included — private and protected methods are always excluded.

### `#[TsEnumMethod]`

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

```typescript
export const Status = {
    Active: 'active',
    Inactive: 'inactive',
    /** Human-readable label */
    statusLabel: {
        Active: 'Active User',
        Inactive: 'Inactive User',
    },
} as const;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | Method name | Overrides the key name in the output (also affected by [`enums.method_case`](#casing)). |
| `description` | `string` | `''` | JSDoc comment above the property. |
| `params` | `array` | `[]` | Named arguments to invoke the method with (see below). |

#### Methods with required parameters

Methods requiring parameters are **skipped by default**, to avoid producing misleading `null` values. Supply `params` to include them anyway — the values are spread as named arguments when the method is invoked once per case:

```php
#[TsEnumMethod(description: 'Compare with threshold', params: ['threshold' => 1])]
public function isAboveThreshold(int $threshold): bool
{
    return $this->value > $threshold;
}
```

`params` values must be constant expressions (scalars or arrays of scalars), since they're defined inside a PHP attribute. Methods with only *optional* parameters don't need `params` — they're included automatically.

### `#[TsEnumStaticMethod]`

Same `name` / `description` / `params` options as `#[TsEnumMethod]`, but the method is invoked **once** (not per case) and added as a single top-level property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnumStaticMethod;

#[TsEnumStaticMethod]
public static function options(): array
{
    return array_map(fn (self $s) => ['value' => $s->value, 'label' => $s->name], self::cases());
}
```

```typescript
export const Status = {
    // ...cases
    options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ],
} as const;
```

Required-parameter methods are skipped unless `params` is provided, identically to `#[TsEnumMethod]`.

### `#[TsEnum]`

Rename the enum's TypeScript const name and/or add a class-level description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnum;

#[TsEnum('UserStatus', description: 'All possible user account statuses')]
enum Status: string { case Active = 'active'; case Inactive = 'inactive'; }
```

```typescript
/** All possible user account statuses */
export const UserStatus = { Active: 'active', Inactive: 'inactive' } as const;
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Overrides the TypeScript const name — useful to avoid naming collisions across namespaces. |
| `description` | `string` | JSDoc comment; takes priority over any PHPDoc description. |

### `#[TsCase]`

Rename a case, override its frontend value, or add a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCase;

enum Status: int
{
    #[TsCase(name: 'active_status', value: true, description: 'The user is active')]
    case Active = 1;

    #[TsCase(name: 'inactive_status', value: false)]
    case Inactive = 0;
}
```

```typescript
export const Status = {
    /** The user is active */
    active_status: true,
    inactive_status: false,
} as const;
```

| Parameter | Type | Description |
|---|---|---|
| `name` | `string` | Overrides the case key name. |
| `value` | `string \| int` | Overrides the case value. |
| `description` | `string` | JSDoc comment above the case. |

## Value & Key Types

Every enum gets a `{Name}Type` alias built from its case **values**. Backed enums additionally get a `{Name}Kind` alias built from case **names** (unit enums already use their case name as the value, so no separate `Kind` is needed):

```typescript
export type StatusType = 'active' | 'inactive';
export type StatusKind = 'Active' | 'Inactive'; // backed enums only
```

```typescript
import type { StatusType, StatusKind } from '@js/types/data/enums';

function setStatus(status: StatusType) {}     // only 'active' | 'inactive'
function setStatusByKey(status: StatusKind) {} // only 'Active' | 'Inactive'
```

## Metadata & the `defineEnum()` Wrapper

When `enums.metadata_enabled` is on, every enum carries `_cases`, `_methods`, and `_static` arrays describing its own shape. These aren't meant to be read directly — they're what `defineEnum()` (and the standalone `from` / `tryFrom` / `cases` functions) use to resolve a PHP-like "instance" from a raw case value:

```typescript
import { Status } from '@js/types/data/enums';

const instance = Status.from('active');
// { name: 'Active', value: 'active', label: 'Active User', options: [...] }
//                             ^ per-case method resolved   ^ static method passed through as-is
```

See [Runtime Utilities](#runtime-utilities) below for the full function reference.

### Disabling metadata or the `@tolki/ts` wrapper

```php
// config/ts-publish.php
'enums' => [
    'metadata_enabled' => false, // omit _cases/_methods/_static entirely
],
```

```php
'enums' => [
    'metadata_enabled' => true,
    'use_tolki_package' => false, // keep metadata, skip the defineEnum() wrapper
],
```

## Auto-Including All Enum Methods

By default, only methods explicitly marked with `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` are included. To include every public method without annotating each one:

```php
// config/ts-publish.php
'enums' => [
    'auto_include_methods' => true,        // all public instance methods
    'auto_include_static_methods' => true, // all public static methods
],
```

PHP's built-in `cases()`, `from()`, and `tryFrom()` are always excluded automatically. You can still attach `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` to individual methods purely to customize their `name`/`description`/`params` while auto-include handles everything else. Methods with required parameters are still skipped unless annotated with `params`.

::: warning
These settings are off by default for a reason — enabling them exposes the return value of **every** public method on your enums. Make sure that's what you want before turning them on.
:::

## PHPDoc Descriptions

Doc blocks are read automatically and converted to JSDoc comments:

| Location | JSDoc placement |
|---|---|
| Enum class | Above the `export const` declaration |
| Enum case | Above the case property |
| Instance method | Above the method property |
| Static method | Above the static method property |

`@`-prefixed lines (`@param`, `@return`, `@phpstan-type`, ...) are stripped — only the prose description carries over. When both a PHPDoc block **and** an attribute `description` are present, **the attribute always wins**.

## Filtering & Excluding Enums

Same include/exclude pattern used by models, resources, and every other collected type:

```php
// config/ts-publish.php
'enums' => [
    'included' => [App\Enums\Status::class],       // only these (empty = all)
    'excluded' => [App\Enums\Internal::class],      // never publish these
    'additional_directories' => ['modules/Blog/Enums'],
],
```

`#[TsExclude]` on the enum class excludes the whole enum; on a method, it excludes just that method (regardless of whether auto-include or an explicit attribute would otherwise include it). See [Excluding Content](https://tolki.abe.dev/ts/excluding-content) for the full attribute behavior shared across models, resources, and routes.

## Casing

`enums.method_case` (`'camel'` (default), `'snake'`, or `'pascal'`) controls the casing of instance/static method key names in the output — it does not rename PHP methods, only the generated property key.

## Runtime Utilities

The functions below are exported from `@tolki/ts` and power `defineEnum()`'s PHP-like behavior. They're listed for reference — in normal usage you'll interact with them through the generated enum object (`Status.from(...)`), not by importing them directly.

<div class="collection-method-list" markdown="1">

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

</div>

### cases

Similar to PHP's [cases](https://www.php.net/manual/en/unitenum.cases.php) method — returns an array of resolved instances, one per case.

```typescript
import { cases } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = cases(Status); // one resolved instance per case in Status
```

### defineEnum

The factory function automatically applied by the Laravel package's generated output. Binds `from`, `tryFrom`, and `cases` to the enum object.

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

Similar to PHP's [from](https://www.php.net/manual/en/backedenum.from.php) — resolves the enum instance for a value, throwing if it doesn't match any case.

```typescript
import { from } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = from(Status, "active");
from(Status, "non-valid-key"); // throws
```

### tryFrom

Same as `from`, but returns `null` instead of throwing for an unmatched value — mirrors PHP's [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php).

```typescript
import { tryFrom } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = tryFrom(Status, "active");
const missing = tryFrom(Status, "non-valid-key"); // null
```

## Vite Plugin

The `@tolki/ts` package ships a Vite plugin that republishes enums (and routes) automatically during development. See the [Vite Plugin documentation](./vite-plugin.md).

## Configuration Reference

The full list of `enums.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).

## Type Reference

Exported from `@tolki/ts` (runtime) and `@tolki/types` (types only):

| Export | Description |
|---|---|
| `defineEnum()` | Wraps a raw enum const with bound `from`/`tryFrom`/`cases` helpers. |
| `from()`, `tryFrom()`, `cases()` | Standalone equivalents that take the enum object as their first argument. |
| `EnumConst` | The base shape every generated enum const satisfies. |
| `CaseKeys<T>` / `CaseValue<T>` | The union of case key names / case values for an enum const. |
| `MethodKeys<T>` / `StaticKeys<T>` | The union of instance / static method key names. |
| `FromResult<T, V>` | The resolved instance type returned by `from(T, V)`. |
| `DefineEnumResult<T>` | The return type of `defineEnum()` — the const plus bound helpers. |
| `AsEnum<T, V?>` | A type-level resolved instance (discriminated union across all cases, or narrowed to one with the second parameter) — the type companion to the `EnumResource` JSON API resource. |

