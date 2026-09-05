<p align="center"><img src="https://raw.githubusercontent.com/abetwothree/tolki/refs/heads/master/docs/vitepress/public/tolki-logo-short.svg" width="50%" alt="Laravel Tolki JS Logo"></p>

# Tolki JS TypeScript Package

This package provides TypeScript utility functions meant to be used by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish/) PHP Package.

Features currently include the following:

- TypeScript Enum support with similar functionality to a PHP enum.
- TypeScript Route support to use Laravel's route definitions in frontend projects.
- A supporting Vite plugin to automatically publish files on production builds and automatically update TypeScript definitions on PHP file changes during development.

## Documentation

The full documentation for the enum utilities can be found at [https://tolki.abe.dev](https://tolki.abe.dev/ts/).

<!-- AUTO-GENERATED-DOCS:START -->

## Installation & Usage

The [`@tolki/ts`](https://www.npmjs.com/package/@tolki/ts) package provides a variety of enum manipulation utilities inspired by PHP's enum utilities like [from](https://www.php.net/manual/en/backedenum.from.php), [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php), and [cases](https://www.php.net/manual/en/unitenum.cases.php).

It also includes utilities to create functional routing objects that work the same way as Laravel Wayfinder's route definitions do.

This package is meant to be used with the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish), which transforms PHP enums & routes into functional TypeScript objects.

### Installing the Laravel Package

Install the PHP package via Composer:

```bash
composer require abetwothree/laravel-ts-publish
```

Optionally, you may publish the config and view files with:

```bash
php artisan vendor:publish --tag="ts-publish-config"
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

### Installing `@tolki/ts`

You can install this package via npm, yarn, or pnpm:

```bash [npm]
npm install @tolki/ts
```

```bash [yarn]
yarn add @tolki/ts
```

```bash [pnpm]
pnpm add @tolki/ts
```

If you don't want your enums to depend on `@tolki/ts` at runtime, set `enums.use_tolki_package` to `false` in the published configuration file. See the full [Enums documentation](https://tolki.abe.dev/ts/enums.html) for what changes when it's disabled.

Keep in mind that the `@tolki/ts` npm package is required for routing utilities to function correctly at runtime.

### Recommended Directory Structure

By default, generated files are written to `resources/js/types/data`. It's recommended to gitignore this directory — the files are generated on demand (locally, in CI, or before a production build), so committing them just adds noise and merge conflicts:

**Configuration:**

```php
// config/ts-publish.php

'output_directory' => resource_path('/js/types/data'),
```

**Git Ignore:**

```gitignore
# Ignore published TypeScript files
/resources/js/types/data/
```

If you use [ESLint](https://eslint.org/) or [Oxlint](https://oxc.rs/), add the published directory to your linter's ignore list too.

### Importing the Published Files

Create an import alias for the published files in `tsconfig.json` and `vite.config.ts` to avoid long relative paths and make it clear these are generated files:

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@data/*": ["resources/js/types/data/*"]
    }
  }
}
```

**vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@data": path.resolve(__dirname, "resources/js/types/data"),
    },
  },
});
```

Output is always organized into namespace-derived directory trees — a single-namespace app (just `App\Models`, `App\Enums`, etc.) produces one `app/` directory tree, so a default installation's imports look like:

```typescript
import { Status } from "@data/app/enums";
import type { User } from "@data/app/models";
```

See [Modular Publishing](https://tolki.abe.dev/ts/modular-publishing.html) for the full namespace-to-path algorithm on larger, multi-namespace applications.

### Automatic Publishing with the Vite Plugin

Add the Vite plugin to automatically watch for changes to your collected PHP files and re-run `ts:publish` during development and before a production build:

```typescript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

If you're using Laravel Sail and Vite runs on your host machine, point the plugin at the Sail binary instead of a bare `sail` alias (which isn't available to Vite's non-interactive shell):

```typescript
laravelTsPublish({
  command: "./vendor/bin/sail artisan ts:publish",
});
```

For the full default behavior (single-file republishing during `vite dev`, the `--only-functional` flag on `vite build`, manifest handling, and every configuration option), see the full [Vite Plugin documentation](https://tolki.abe.dev/ts/vite-plugin.html).

### Automatic Publishing on Composer Update

Add `ts:publish` to the `post-update-cmd` hook in `composer.json` so deployed and CI environments stay in sync automatically:

```json
{
  "scripts": {
    "post-update-cmd": ["@php artisan ts:publish"]
  }
}
```

### Analyzer API

The same static analysis engine that powers `ts:publish` is also callable directly — hand `AstEngine` a class and a method name and get back a typed property list, without running the full publish pipeline or writing anything to disk. See the full [Analyzer API documentation](https://tolki.abe.dev/ts/analyzer-api.html).

### Pre-Command Hook

If you need to run custom logic right before `ts:publish` executes — dynamically configuring directories, swapping pipeline classes, or reacting to feature flags — register a closure with `LaravelTsPublish::callCommandUsing()` in a service provider's `boot()` method. See the full [Pre-Command Hook documentation](https://tolki.abe.dev/ts/pre-command-hook.html) for worked examples.

### Development Workflow

During development, run `vite dev` and the plugin will automatically watch for changes in your collected PHP files and call the publish command to keep your TypeScript files up to date.

Run `vite build` to build your assets for production — the plugin calls the publish command (with `--only-functional` appended by default, since interfaces are erased at compile time) before bundling.

## Enums

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) transforms every PHP enum into a functional TypeScript object — not just a union of case values, but PHP-like enum behavior (`.from()`, `.tryFrom()`, `.cases()`) powered by `@tolki/ts`, plus any of your own instance/static methods you opt in.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), the `@tolki/ts` package is not meant to be used standalone — it works together with the Laravel package's generated output.

### How Enums Are Generated

- One `.ts` file is generated per enum, at a modular, namespace-derived path (e.g. `App\Enums\Status` → `app/enums/status.ts`).
- Barrel `index.ts` files re-export everything (`export * from './status'`) for each namespace directory — unlike [routes](https://tolki.abe.dev/ts/routing.html), enum names don't collide across files, so barrels use `export *` rather than default-only re-exports.
- Both **backed** (`int`/`string`) and **unit** enums are supported. Unit enums use their case name as the value.
- When `enums.metadata_enabled` is on (the default), each enum includes `_cases`, `_methods`, and `_static` arrays describing its own shape, and is wrapped in `defineEnum()` from `@tolki/ts` when `enums.use_tolki_package` is also on (the default).

### Anatomy of a Generated Enum

```typescript
import { defineEnum } from "@tolki/ts";

/**
 * String-backed enum with TsCase attribute overrides on individual cases.
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

- The class (and each case's) PHPDoc description becomes a JSDoc comment — see [PHPDoc Descriptions](#phpdoc-descriptions).
- `backed` records whether the PHP enum is backed (used by [`AsEnum`](#type-reference) to type API responses).
- `hex` is an **instance method** — [`#[TsEnumMethod]`](#tsenummethod) — resolved to one value per case.
- `_cases` / `_methods` / `_static` are the metadata arrays the `@tolki/ts` runtime functions read to resolve "instances" — see [Runtime Utilities](#runtime-utilities).
- `ColorType` / `ColorKind` are always-generated type aliases — see [Value & Key Types](#value--key-types).

### Enum Attributes

All attributes live under the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute               | Target        | Description                                                                                         |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `#[TsEnumMethod]`       | Method        | Include a method's return values in the output. Called per case, producing a key/value pair object. |
| `#[TsEnumStaticMethod]` | Static Method | Include a static method's return value. Called once, added as a top-level property.                 |
| `#[TsEnum]`             | Enum Class    | Rename the enum or add a description.                                                               |
| `#[TsCase]`             | Enum Case     | Rename, change the frontend value, or add a description to a case.                                  |
| `#[TsExclude]`          | Class, Method | Exclude an entire enum or a specific method.                                                        |

> [!NOTE]
> Whether via attributes or the global auto-include config, only **public** methods are ever included — private and protected methods are always excluded.

#### `#[TsEnumMethod]`

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
  Active: "active",
  Inactive: "inactive",
  /** Human-readable label */
  statusLabel: {
    Active: "Active User",
    Inactive: "Inactive User",
  },
} as const;
```

| Parameter     | Type     | Default     | Description                                                                             |
| ------------- | -------- | ----------- | --------------------------------------------------------------------------------------- |
| `name`        | `string` | Method name | Overrides the key name in the output (also affected by [`enums.method_case`](#casing)). |
| `description` | `string` | `''`        | JSDoc comment above the property.                                                       |
| `params`      | `array`  | `[]`        | Named arguments to invoke the method with (see below).                                  |

##### Methods with required parameters

Methods requiring parameters are **skipped by default**, to avoid producing misleading `null` values. Supply `params` to include them anyway — the values are spread as named arguments when the method is invoked once per case:

```php
#[TsEnumMethod(description: 'Compare with threshold', params: ['threshold' => 1])]
public function isAboveThreshold(int $threshold): bool
{
    return $this->value > $threshold;
}
```

`params` values must be constant expressions (scalars or arrays of scalars), since they're defined inside a PHP attribute. Methods with only _optional_ parameters don't need `params` — they're included automatically.

#### `#[TsEnumStaticMethod]`

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
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
} as const;
```

Required-parameter methods are skipped unless `params` is provided, identically to `#[TsEnumMethod]`.

#### `#[TsEnum]`

Rename the enum's TypeScript const name and/or add a class-level description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsEnum;

#[TsEnum('UserStatus', description: 'All possible user account statuses')]
enum Status: string { case Active = 'active'; case Inactive = 'inactive'; }
```

```typescript
/** All possible user account statuses */
export const UserStatus = { Active: "active", Inactive: "inactive" } as const;
```

| Parameter     | Type     | Description                                                                                |
| ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `name`        | `string` | Overrides the TypeScript const name — useful to avoid naming collisions across namespaces. |
| `description` | `string` | JSDoc comment; takes priority over any PHPDoc description.                                 |

#### `#[TsCase]`

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

| Parameter     | Type            | Description                   |
| ------------- | --------------- | ----------------------------- |
| `name`        | `string`        | Overrides the case key name.  |
| `value`       | `string \| int` | Overrides the case value.     |
| `description` | `string`        | JSDoc comment above the case. |

### Value & Key Types

Every enum gets a `{Name}Type` alias built from its case **values**. Backed enums additionally get a `{Name}Kind` alias built from case **names** (unit enums already use their case name as the value, so no separate `Kind` is needed):

```typescript
export type StatusType = "active" | "inactive";
export type StatusKind = "Active" | "Inactive"; // backed enums only
```

```typescript
import type { StatusType, StatusKind } from "@js/types/data/enums";

function setStatus(status: StatusType) {} // only 'active' | 'inactive'
function setStatusByKey(status: StatusKind) {} // only 'Active' | 'Inactive'
```

### Metadata & the `defineEnum()` Wrapper

When `enums.metadata_enabled` is on, every enum carries `_cases`, `_methods`, and `_static` arrays describing its own shape. These aren't meant to be read directly — they're what `defineEnum()` (and the standalone `from` / `tryFrom` / `cases` functions) use to resolve a PHP-like "instance" from a raw case value:

```typescript
import { Status } from "@js/types/data/enums";

const instance = Status.from("active");
// { name: 'Active', value: 'active', label: 'Active User', options: [...] }
//                             ^ per-case method resolved   ^ static method passed through as-is
```

See [Runtime Utilities](#runtime-utilities) below for the full function reference.

#### Disabling metadata or the `@tolki/ts` wrapper

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

### Auto-Including All Enum Methods

By default, only methods explicitly marked with `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` are included. To include every public method without annotating each one:

```php
// config/ts-publish.php
'enums' => [
    'auto_include_methods' => true,        // all public instance methods
    'auto_include_static_methods' => true, // all public static methods
],
```

PHP's built-in `cases()`, `from()`, and `tryFrom()` are always excluded automatically. You can still attach `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` to individual methods purely to customize their `name`/`description`/`params` while auto-include handles everything else. Methods with required parameters are still skipped unless annotated with `params`.

These settings are off by default for a reason — enabling them exposes the return value of **every** public method on your enums. Make sure that's what you want before turning them on.

### PHPDoc Descriptions

Doc blocks are read automatically and converted to JSDoc comments:

| Location        | JSDoc placement                      |
| --------------- | ------------------------------------ |
| Enum class      | Above the `export const` declaration |
| Enum case       | Above the case property              |
| Instance method | Above the method property            |
| Static method   | Above the static method property     |

`@`-prefixed lines (`@param`, `@return`, `@phpstan-type`, ...) are stripped — only the prose description carries over. When both a PHPDoc block **and** an attribute `description` are present, **the attribute always wins**.

### Filtering & Excluding Enums

Same include/exclude pattern used by models, resources, and every other collected type:

```php
// config/ts-publish.php
'enums' => [
    'included' => [App\Enums\Status::class],       // only these (empty = all)
    'excluded' => [App\Enums\Internal::class],      // never publish these
    'additional_directories' => ['modules/Blog/Enums'],
],
```

`#[TsExclude]` on the enum class excludes the whole enum; on a method, it excludes just that method (regardless of whether auto-include or an explicit attribute would otherwise include it). See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full attribute behavior shared across models, resources, and routes.

### Casing

`enums.method_case` (`'camel'` (default), `'snake'`, or `'pascal'`) controls the casing of instance/static method key names in the output — it does not rename PHP methods, only the generated property key.

### Runtime Utilities

The functions below are exported from `@tolki/ts` and power `defineEnum()`'s PHP-like behavior. They're listed for reference — in normal usage you'll interact with them through the generated enum object (`Status.from(...)`), not by importing them directly.

[cases](#cases) [defineEnum](#defineenum) [from](#from) [tryFrom](#tryfrom)

#### cases

Similar to PHP's [cases](https://www.php.net/manual/en/unitenum.cases.php) method — returns an array of resolved instances, one per case.

```typescript
import { cases } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = cases(Status); // one resolved instance per case in Status
```

#### defineEnum

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

#### from

Similar to PHP's [from](https://www.php.net/manual/en/backedenum.from.php) — resolves the enum instance for a value, throwing if it doesn't match any case.

```typescript
import { from } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = from(Status, "active");
from(Status, "non-valid-key"); // throws
```

#### tryFrom

Same as `from`, but returns `null` instead of throwing for an unmatched value — mirrors PHP's [tryFrom](https://www.php.net/manual/en/backedenum.tryfrom.php).

```typescript
import { tryFrom } from "@tolki/ts";
import { Status } from "@js/types/data/enums";

const result = tryFrom(Status, "active");
const missing = tryFrom(Status, "non-valid-key"); // null
```

### Vite Plugin

The `@tolki/ts` package ships a Vite plugin that republishes enums (and routes) automatically during development. See the [Vite Plugin documentation](https://tolki.abe.dev/ts/vite-plugin.html).

### Configuration Reference

The full list of `enums.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

### Type Reference

Exported from `@tolki/ts` (runtime) and `@tolki/types` (types only):

| Export                            | Description                                                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineEnum()`                    | Wraps a raw enum const with bound `from`/`tryFrom`/`cases` helpers.                                                                                                               |
| `from()`, `tryFrom()`, `cases()`  | Standalone equivalents that take the enum object as their first argument.                                                                                                         |
| `EnumConst`                       | The base shape every generated enum const satisfies.                                                                                                                              |
| `CaseKeys<T>` / `CaseValue<T>`    | The union of case key names / case values for an enum const.                                                                                                                      |
| `MethodKeys<T>` / `StaticKeys<T>` | The union of instance / static method key names.                                                                                                                                  |
| `FromResult<T, V>`                | The resolved instance type returned by `from(T, V)`.                                                                                                                              |
| `DefineEnumResult<T>`             | The return type of `defineEnum()` — the const plus bound helpers.                                                                                                                 |
| `AsEnum<T, V?>`                   | A type-level resolved instance (discriminated union across all cases, or narrowed to one with the second parameter) — the type companion to the `EnumResource` JSON API resource. |

## Models

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) converts Eloquent models into TypeScript interfaces for their columns, mutators, and relations — resolved via a reflection + database-schema waterfall so the generated types stay accurate without you hand-maintaining them.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), models don't need the `@tolki/ts` runtime package at all (unlike [enums](https://tolki.abe.dev/ts/enums.html) and [routes](https://tolki.abe.dev/ts/routing.html)) — the output is plain TypeScript interfaces, with one exception: enum-typed columns optionally use the `AsEnum<>` type from `@tolki/types` (see [Enum-Typed Columns](#enum-typed-columns-modelresource)).

### How Models Are Generated

- One `.ts` file is generated per model, at a modular, namespace-derived path (e.g. `App\Models\User` → `app/models/user.ts`).
- Barrel `index.ts` files re-export everything (`export * from './user'`) per namespace directory, the same as [enums](https://tolki.abe.dev/ts/enums.html#how-enums-are-generated).
- Each column's type is resolved through a waterfall: an explicit [`#[TsCasts]`](#tscasts) override first, then the model's cast (`casts()` method or `$casts` property, including a [`#[TsType]`](#tstype) on a custom cast class), then the raw database column type — see the [Type Mapping Reference](#type-mapping-reference) for the full default table.
- Mutators (new-style `Attribute` accessors and old-style `getXAttribute()` methods) and relations are inspected the same way, and split into their own interfaces by default — see [Model Templates](#model-templates).

### Anatomy of a Generated Model

```typescript
import { type AsEnum } from "@tolki/ts";

import { MembershipLevel, Role } from "../enums";
import type { DatabaseNotification } from "../../illuminate/notifications";
import type { MembershipLevelType, RoleType } from "../enums";
import type { Address, Comment, Image, Order, Post, Profile, Team } from ".";

/**
 * Application user account
 *
 * @see App\Models\User
 */
export interface User {
  id: number;
  /** User name formatted with first letter capitalized */
  name: string;
  email: string;
  email_verified_at: string | null;
  password: string;
  options: Record<string, unknown> | null;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
  role: RoleType | null;
  membership_level: MembershipLevelType | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
    locale: string;
  } | null;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export interface UserResource extends Omit<User, "role" | "membership_level"> {
  role: AsEnum<typeof Role> | null;
  membership_level: AsEnum<typeof MembershipLevel> | null;
}

export interface UserMutators {
  /** User initials (e.g. "JD" for "John Doe") */
  initials: string;
  /** Whether the user is a premium member */
  is_premium: boolean;
}

export interface UserRelations {
  // Relations
  profile: Profile | null;
  posts: Post[];
  comments: Comment[];
  orders: Order[];
  addresses: Address[];
  teams: Team[];
  owned_teams: Team[];
  /** Polymorphic images (avatar gallery, etc.) */
  images: Image[];
  /** Get the entity's notifications. */
  notifications: DatabaseNotification[];
  // Counts
  profile_count: number;
  posts_count: number;
  // ...one `_count` per relation
  // Exists
  profile_exists: boolean;
  posts_exists: boolean;
  // ...one `_exists` per relation
}

export interface UserAll extends User, UserMutators, UserRelations {}

export interface UserAllResource
  extends UserResource, UserMutators, UserRelations {}
```

- `User` holds the raw columns — enum columns (`role`, `membership_level`) are typed with the plain `{Enum}Type` union, matching how Eloquent serializes a `BackedEnum` to JSON.
- `UserResource` is the enum-_resolved_ variant — see [Enum-Typed Columns](#enum-typed-columns-modelresource).
- `settings` shows an inline object type — the result of a [`#[TsCasts]`](#tscasts) override.
- `UserMutators` holds accessor-based properties (new-style `Attribute` or old-style `getXAttribute()`), each with its PHPDoc description carried over as a JSDoc comment — see [PHPDoc Descriptions](#phpdoc-descriptions).
- `UserRelations` includes every relation plus a generated `_count` and `_exists` property per relation (mirroring Laravel's [`withCount`](https://laravel.com/docs/eloquent-relationships#counting-related-models) / `withExists`) — including polymorphic relations and framework-provided ones (`notifications`, imported from a generated `illuminate/notifications` namespace).
- `UserAll` / `UserAllResource` are convenience interfaces combining all three — only generated when there's more than one non-empty interface to combine.

### Model Templates

By default, a model is split into up to four interfaces (`{Model}`, `{Model}Mutators`, `{Model}Relations`, `{Model}All`) so a given page only needs to import what it actually uses. Switch to a single combined interface with the `model-full` template:

| Template                          | Description                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `laravel-ts-publish::model-split` | **(Default)** Separate interfaces for properties, mutators, and relations, plus an `All` interface combining them.                     |
| `laravel-ts-publish::model-full`  | Combines properties, mutators, and relations into one interface (grouped with `// Columns` / `// Mutators` / `// Relations` comments). |

```php
// config/ts-publish.php
'models' => [
    'template' => 'laravel-ts-publish::model-full',
],
```

Any mutator listed in the model's `$appends` array is always included in the properties interface (even in the split template), since Laravel always includes appended attributes when serializing a model to JSON.

Publish the views (`php artisan vendor:publish --tag="laravel-ts-publish-views"`) if you want to customize either template's structure, then point `models.template` at your published/custom view.

#### Choosing between interfaces in a form

The split template lets you compose only the pieces a page needs. For example, an Inertia form that needs the full `User` shape plus just one relation flag:

```typescript
import { useForm } from "@inertiajs/vue3";
import type { User, UserRelations } from "@js/types/data/models";

interface UserForm extends User, Pick<UserRelations, "profile_exists"> {
  profile: UserRelations["profile"] | null;
}

const form = useForm<UserForm>({ ...user });
form.profile; // Profile | null
form.posts; // TS error — `posts` isn't part of UserForm
```

With `model-full`, the equivalent requires `Omit`-ing every relation property you don't need instead of only picking what you want:

```typescript
import type { User } from "@js/types/data/models";

interface UserForm extends Omit<
  User,
  | "admin"
  | "profile"
  | "posts"
  | "profile_count"
  | "posts_count"
  | "posts_exists"
> {
  profile: User["profile"] | null;
}
```

Additionally, when using the `model-full` template, since all relations are included, it creates deeply dependent types where errors in a relation 2, 3 or more levels deep can propagate and cause TypeScript to raise errors. It can be good way to make sure all your models have proper TypeScript types for forms and other contexts where you only need a subset of the model's relations, but it can be a bit annoying to track down and fix.

### Nullable Relations

Singular relations are automatically typed with `| null` based on the relation type and, where relevant, whether the underlying foreign key column is nullable:

| Relation Type                                          | Strategy   | Behavior                                                                 |
| ------------------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| `HasOne`                                               | `nullable` | Always add `null` — the related record may not exist.                    |
| `MorphOne`                                             | `nullable` | Always add `null`.                                                       |
| `HasOneThrough`                                        | `nullable` | Always add `null`.                                                       |
| `BelongsTo`                                            | `fk`       | Add `null` only when the foreign key column is nullable in the database. |
| `MorphTo`                                              | `morph`    | Add `null` when either the morph type or morph id column is nullable.    |
| `HasMany`, `BelongsToMany`, `MorphMany`, `MorphToMany` | `never`    | Never nullable (returns an empty array, not null).                       |

```typescript
export interface UserRelations {
  profile: Profile | null; // HasOne — always nullable
  posts: Post[]; // HasMany — never nullable
}

export interface PostRelations {
  author: User; // BelongsTo — user_id is NOT NULL
  category_rel: Category | null; // BelongsTo — category_id is nullable
}
```

#### Disabling or overriding the strategy

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false, // keep all singular relations non-nullable
],
```

Override the strategy per relation type (including custom third-party relation classes) via `models.relation_nullability_map` — keys are FQCNs, values are `'nullable'`, `'never'`, `'fk'`, or `'morph'`:

```php
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use SomePackage\Relations\BelongsToTenant;

'models' => [
    'relation_nullability_map' => [
        BelongsTo::class => 'nullable', // make all BelongsTo always nullable
        HasOne::class => 'never',       // make HasOne never nullable
        BelongsToTenant::class => 'fk', // custom relation type, checked like BelongsTo
    ],
],
```

See `AbeTwoThree\LaravelTsPublish\RelationMap` for the full default map.

### Model Attributes

All attributes live under the `AbeTwoThree\LaravelTsPublish\Attributes` namespace.

| Attribute      | Target                                              | Description                                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `#[TsCasts]`   | `casts()` method, `$casts` property, or model class | Override/add TypeScript types for columns, mutators, or relations. |
| `#[TsType]`    | Custom cast class                                   | Set the TypeScript type used wherever this cast class is applied.  |
| `#[TsExclude]` | Model class, accessor method, or relation method    | Exclude an entire model, or a specific accessor/relation.          |

#### `#[TsCasts]`

Takes an array mapping property names to either a raw TypeScript type string, or `['type' => ..., 'import' => ...]` for a type that needs importing from your own files:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

class User extends Model
{
    #[TsCasts([
        'metadata' => '{label: string, value: string}[]',
        'settings' => 'Record<string, unknown>',
        'dimensions' => ['type' => 'ProductDimensions', 'import' => '@js/types/product'],
    ])]
    public function casts(): array
    {
        return [
            'metadata' => 'array',
            'settings' => 'array',
            'dimensions' => 'array',
        ];
    }
}
```

```typescript
import { ProductDimensions } from "@js/types/product";

export interface User {
  metadata: { label: string; value: string }[];
  settings: Record<string, unknown>;
  dimensions: ProductDimensions;
}
```

`#[TsCasts]` can be placed on the `casts()` method, the `$casts` property, or the model class itself — all three accept the same array shape.

Prefer placing `#[TsCasts]` on `casts()` / `$casts` so the TypeScript override sits next to the actual PHP cast. Since it can also override mutator and relation types, place it on the class itself when you need to override those instead.

However, when extending models from the `vendor` directory, it can be useful to place `#[TsCasts]` on the class itself to override types for relations or mutators without modifying the original vendor cast definitions.

#### `#[TsType]`

For a **custom cast class** used across multiple models/properties, put `#[TsType]` on the cast class once instead of repeating `#[TsCasts]` everywhere it's used:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsType;

#[TsType(['type' => 'ProductDimensions', 'import' => '@js/types/product'])]
class ProductDimensionsCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes) { /* ... */ }
}

class Product extends Model
{
    public function casts(): array
    {
        return ['dimensions' => ProductDimensionsCast::class];
    }
}
```

```typescript
import { ProductDimensions } from "@js/types/product";

export interface Product {
  dimensions: ProductDimensions;
}
```

`#[TsType]` also accepts a plain string (`#[TsType('{width: number, height: number}')]`) when the type doesn't need an import.

### Laravel 13 Model Attributes

Laravel 13 shipped a set of native class attributes across Eloquent models (`Illuminate\Database\Eloquent\Attributes`) and API resources (`Illuminate\Http\Resources\Attributes`) that replace older property-based conventions (`#[Table]` instead of `protected $table`, and so on). These are **not** attributes from this package — no `use AbeTwoThree\LaravelTsPublish\Attributes\...` needed — and most of them are honored automatically, with no configuration and no code change on your end, because Laravel resolves them into the model's ordinary instance state before this package ever reads the model:

| Attribute                                                                                                                                                                                                                                                                                          | Honored? | Notes                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#[Table('...')]`                                                                                                                                                                                                                                                                                  | Yes      | Changes which table columns are read from, same as `protected $table`.                                                                                                                                                                                                                      |
| `#[Hidden(['col'])]`                                                                                                                                                                                                                                                                               | Yes      | Feeds the same `hidden` flag `protected $hidden` does — see [What gets published: hidden attributes](#what-gets-published-hidden-attributes-write-only-accessors).                                                                                                                          |
| `#[Visible(['col'])]`                                                                                                                                                                                                                                                                              | Yes      | An **allowlist** — every column _not_ listed becomes hidden, same as `protected $visible`. List every column meant to stay published, or most of the model will disappear from the generated interface.                                                                                     |
| `#[Appends(['accessor'])]`                                                                                                                                                                                                                                                                         | Yes      | Adds accessors to the published set, same as `protected $appends`.                                                                                                                                                                                                                          |
| `#[Connection('name')]`                                                                                                                                                                                                                                                                            | Yes      | Selects which database connection's schema the columns are read from, same as `protected $connection`.                                                                                                                                                                                      |
| `#[Collects(SomeResource::class)]`                                                                                                                                                                                                                                                                 | Yes      | Which resource a collection collects — see [API Resources](https://tolki.abe.dev/ts/api-resources.html).                                                                                                                                                                                    |
| `#[UseResource(...)]` / `#[UseResourceCollection(...)]`                                                                                                                                                                                                                                            | Yes      | Associates a model with its resource — see [API Resources](https://tolki.abe.dev/ts/api-resources.html). Available since Laravel 12.29, not just 13.                                                                                                                                        |
| `#[PreserveKeys]`                                                                                                                                                                                                                                                                                  | Not yet  | Would make a resource collection emit a keyed object instead of an array. No effect on generated output currently.                                                                                                                                                                          |
| `#[RouteKey('slug')]`                                                                                                                                                                                                                                                                              | Yes      | A model-bound route argument now generates `_routeKey` from the attribute's key even when the model carries only `#[RouteKey]` and overrides none of `getRouteKeyName()`/`getKeyName()`/`$primaryKey` — see [Routing § Model Binding](https://tolki.abe.dev/ts/routing.html#model-binding). |
| Everything else (`#[DateFormat]`, `#[WithoutTimestamps]`, `#[WithoutIncrementing]`, `#[Fillable]`, `#[Guarded]`, `#[Unguarded]`, `#[Scope]`, `#[ScopedBy]`, `#[ObservedBy]`, `#[Boot]`, `#[Initialize]`, `#[Touches]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`, `#[UseFactory]`, `#[UsePolicy]`) | N/A      | These affect querying, events, mass assignment, or factories — not the serialized shape — so there's nothing for the TypeScript generator to do either way.                                                                                                                                 |

Most of these attribute classes (`#[Table]`, `#[Hidden]`, `#[Visible]`, `#[Appends]`, `#[Connection]`, `#[Collects]`, `#[PreserveKeys]`) require Laravel 13; `#[UseResource]`/`#[UseResourceCollection]` only require 12.29+. On an older floor, using one isn't a hard error — a `use` import of a nonexistent class doesn't fail until something actually resolves it, and nothing in this package or in Laravel itself does for a class-level attribute on a model that floor doesn't know about. The model loads and instantiates normally; the attribute is just silently ignored, which is a more dangerous failure mode than an error, since nothing tells you `#[Table]` didn't take effect. Stay on the version each attribute actually needs if you rely on it.

### Typing Attributes Without #[TsCasts]

#### Typing `array` casts with `@property`

A column cast to `'array'` (or any other cast the accessor → cast → DB waterfall can't type more precisely) generates as `unknown[]`. Rather than reaching for `#[TsCasts]`, add a class-level `@property`/`@property-read` docblock tag naming the real shape — the same convention PHPStan/Larastan already read — and it wins wherever the resolved type would otherwise stay vague:

```php
/**
 * @property array<int, string>|null $to
 * @property array<string, string>|null $headers
 */
class Message extends Model { ... }
```

`$to` and `$headers` now generate as `string[] | null` and `Record<string, string> | null` instead of `unknown[] | null` — and it types the same property for PHPStan/Larastan too. The tag only takes effect when the waterfall's own result is vague, so it never overrides a type already resolved specifically (an accessor's return type, an enum cast, a custom `CastsAttributes` class, etc.), and a subclass's own tag wins over one declared on a parent.

A refinement that's still partly vague is accepted as long as it's more structured than a bare untyped array/collection/object — `@property array<string, mixed>|null $settings` refines a plain `'array'` cast to `Record<string, unknown> | null` even though `Record<string, unknown>` itself still names `unknown`, because it beats the `unknown[]` it replaces. A refinement that's exactly as vague as the original (`unknown`, `unknown[]`, `object`, or the `unknown[] | Record<string, unknown>` Collection fallback) is still rejected.

The `@property` walk also covers every **trait** used by the class or its parents (recursively), so a trait supplying an accessor can carry its own class-level tag — including the non-standard `@property string[] labels` form some packages use without the `$` sigil.

#### Typing json columns with `@phpstan-type` aliases

For a shape complex enough to deserve a name, define it once as a `@phpstan-type` on the DTO that owns it, then pull it into the model with `@phpstan-import-type`:

```php
/** @phpstan-type PresetConfig array{filters?: array<string, mixed>, sorts?: list<string>} */
final readonly class PresetDto { ... }

/**
 * @phpstan-import-type PresetConfig from PresetDto
 * @property PresetConfig|null $config
 */
class Preset extends Model { ... }
```

`$config` generates as `{ filters?: Record<string, unknown>; sorts?: string[] } | null` — the alias expands inline (no import of `PresetDto` itself is emitted, since only its shape is used), optional keys keep their `?`, and PHPStan validates the same alias. `@phpstan-import-type ... as Alias` and `@psalm-type`/`@psalm-import-type` are both recognized, an alias may reference another imported alias, and a cyclical import degrades to `unknown` rather than hanging the publish run. This is the preferred path over `#[TsCasts]` for a shape that's already worth documenting for static analysis.

#### Typing castable-with-arguments casts

Laravel's built-in `Castable` classes carry their configuration after a colon — `AsEnumCollection::of(DayOfWeek::class)` and `AsCollection::of(...)`/`::using(...)` all build a `"ClassName:arg1,arg2"` cast string. These are resolved without any extra config:

```php
protected function casts(): array
{
    return [
        'week_days' => AsEnumCollection::of(DayOfWeek::class),
        'grid_configs' => AsCollection::of(GridConfigDto::class),
    ];
}
```

- **`AsEnumCollection::of($enum)`** generates as the enum's TypeScript type suffixed `[]` — `DayOfWeekType[]` — with the enum's import wired exactly like a scalar enum-typed column.
- **`AsCollection::of($map)` / `::using($collection, $map)`** resolves the mapped class's element shape and appends `[]`. An `Arrayable` DTO with a documented `toArray()` shape inlines as an object array (`{ label: string; config: Record<string, unknown> }[]`); a mapped enum resolves the same way `AsEnumCollection` does. Without a resolvable map (or a bare `AsCollection`/`AsCollection::class`), it stays `unknown[]` — the same fallback as today.
- **Any other `Castable`/`CastsAttributes` class carrying arguments** — a custom cast, `AsEncryptedCollection`, etc. — resolves as if the arguments weren't there, i.e. exactly like the bare class.

Before reaching for `#[TsCasts]`, prefer — in this order — a parameterized `Attribute<>`/`@return`/`@phpstan-return` docblock on an accessor (generics included, e.g. `Attribute<Collection<int, LineItem>, never>`), a class-level `@property`/`@property-read` tag (including a `@phpstan-type`/`@phpstan-import-type` alias, as above), or a `@return MorphTo<A|B, $this>` generic on a `morphTo()` relation. All of these are read by PHPStan/Larastan too, so they're checked by static analysis in a way a package-specific attribute isn't — and every one is honored by the generator with no extra configuration. See the [annotation checklist](#annotation-checklist) below for the full symptom-first list.

`#[TsCasts]` is still the right tool when a shape is genuinely dynamic (keys built at runtime) or the type is owned by the frontend and needs its own import.

#### Typing `morphTo` relations

A `morphTo()` relation's target union is normally inferred in reverse — by scanning every other model for a `morphOne`/`morphMany` pointing back at it — which can only ever find a union, never narrow one. A `@return MorphTo<A|B, $this>` docblock generic on the relation method overrides that scan and types the relation directly, PHPStan-checked, no `#[TsCasts]` needed:

```php
class Activity extends Model
{
    /** @return MorphTo<User, $this> */
    public function causer(): MorphTo
    {
        return $this->morphTo();
    }
}
```

`causer` generates as `User | null` even though no other model declares a reverse relation pointing at `Activity`. The second generic argument (`$this`, Laravel's own convention for the child) carries no target information and is ignored. A generic naming the base `Model` class (`MorphTo<Model, $this>`) isn't narrowing — it's the common, useless case (`@phpstan-return MorphTo<Model, $this>` is what Larastan itself expects when a relation's targets aren't known upfront) — so it falls through to the reverse scan exactly as if no generic were present, rather than emitting a `Model` token nothing can import. Two differently-named `morphTo` relations on the same model resolve independently either way, since both the docblock generic and the reverse scan are read per relation, not per model.

#### DTO-typed accessors and casts

An `Arrayable` DTO whose `toArray()` carries no `@return array{...}` shape now infers its shape from its own typed public properties — promoted constructor properties included — instead of falling back to `unknown[]`:

```php
final readonly class OrderTypeCapabilities implements Arrayable
{
    public function __construct(
        public string $typeName,
        public bool $tracksSteelDetails,
        public ?string $warehouseDocsKey = null,
    ) {}

    /** @return array<string, bool|string|null> */
    public function toArray(): array
    {
        return (array) $this;
    }
}
```

generates as `{ typeName: string; tracksSteelDetails: boolean; warehouseDocsKey: string | null }`. Nullable properties keep their `| null`; private, protected, and static properties are excluded, since they aren't part of `(array) $this`; and a property typed as a class with no import channel (a Model, for example) degrades to `unknown` the same way an unimportable docblock shape value does. Reach for a `@return array{...}` docblock instead only when the properties alone don't tell the whole story — it still wins whenever present.

This is `Arrayable`-only. A `JsonSerializable` DTO's `jsonSerialize()` still only resolves from a `@return array{...}` docblock and otherwise falls through to later resolution steps (e.g. its class basename), rather than inferring from properties — `(array) $this` is a real contract tying `toArray()` to a DTO's own properties, but `jsonSerialize()` can return anything, so inferring its shape from properties could produce a confidently wrong type.

#### What gets published: hidden attributes, write-only accessors

Not every attribute Eloquent knows about ends up in the generated interface:

- **`$hidden` attributes are published by default.** Setting `ts-publish.models.exclude_hidden` to `true` excludes them instead, matching Laravel's own `toArray()`/`toJson()` serialization — the rule that would then keep a `password` or `remember_token` column out of the model's own interface, and out of any resource property set that derives from the model implicitly (whole-model delegation, `except()` — see [API Resources § `exclude_hidden` and attribute filters](https://tolki.abe.dev/ts/api-resources.html#exclude-hidden-and-attribute-filters) for the full, deliberately asymmetric rule, since a resource's `only(['password'])` keeps a hidden column it named explicitly). The default is permissive (`false`, hidden attributes shown) so upgrading the package never silently drops a property a consuming app already relies on; opt in once you've confirmed the frontend doesn't need those columns. When the setting is enabled, an app that still needs a hidden column client-side should either drop it from `$hidden` or call `makeVisible()` before returning the model — the generator has no way to see a runtime `makeVisible()` call, so a hidden column drops from the model's own published interface regardless of any particular request.
- **Write-only mutators** — `Attribute::make(set: ...)` with no `get:` — resolve in this order: (1) the method's own `@return Attribute<Get, Set>` docblock, when the `Get` type is present and isn't itself vague; (2) a same-named database column, if one exists; (3) otherwise the mutator is omitted from the interface entirely, rather than emitted as `unknown`.

```php
class Order extends Model
{
    /** @return Attribute<?string, string> */
    protected function trackingCode(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtoupper($value));
    }

    // No getter, no docblock generic, no backing column — omitted from OrderMutators entirely.
    protected function searchIndex(): Attribute
    {
        return Attribute::make(set: fn (string $value): string => strtolower($value));
    }
}
```

`trackingCode` generates as `tracking_code: string | null` in `OrderMutators`; `searchIndex` doesn't appear there at all. A write-only mutator backed by a real column (e.g. one that normalizes a value on save) resolves through the normal column waterfall instead, and is published as a column rather than a mutator.

#### Annotation checklist

A symptom-first index of the annotations above (plus one from [API Resources](https://tolki.abe.dev/ts/api-resources.html) on the API Resources page) — none of these need `#[TsCasts]`, and every one is read by PHPStan/Larastan too, so the annotation that unlocks the TypeScript type is also checked by static analysis:

| Still generating `unknown`?                                                                                          | Add this                                                                                                                                                                | Unlocks                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attribute<Collection, never>` / `Attribute<array, never>` resolving to `unknown[]`                                  | Parameterize the generic: `Attribute<Collection<int, LineItem>, never>` / `Attribute<array<int, string>, never>` (or `array{...}` for a fixed shape)                    | The real element type (`LineItem[]` / `string[]`), imported automatically                                                                                                                                                              |
| A bare `'array'`/`'collection'` cast with no shape anywhere else                                                     | A class-level `@property`/`@property-read` tag, e.g. `@property array<string, mixed>\|null $settings`                                                                   | `Record<string, unknown> \| null` (or more specific, if the tag is) instead of `unknown[] \| null` — see [Typing `array` casts with `@property`](#typing-array-casts-with-property)                                                    |
| A JSON shape worth naming once and reusing                                                                           | `@phpstan-type Name array{...}` on the class that owns it, `@phpstan-import-type Name from ThatClass` + `@property Name $prop` on the model                             | A named, PHPStan-checked object shape expanded inline, no import of the DTO itself — see [Typing json columns with `@phpstan-type` aliases](#typing-json-columns-with-phpstan-type-aliases)                                            |
| `AsEnumCollection`/`AsCollection` cast with no argument, resolving to `unknown[]`                                    | Pass the mapped class: `AsEnumCollection::of(Status::class)`, `AsCollection::of(LineItemDto::class)`                                                                    | The mapped element's real type (enum or DTO shape), suffixed `[]` — see [Typing castable-with-arguments casts](#typing-castable-with-arguments-casts)                                                                                  |
| `morphTo()` typed `unknown \| null` even though the app knows the possible targets                                   | `@return MorphTo<A\|B, $this>` on the relation method                                                                                                                   | The narrowed union, every member imported — see [Typing `morphTo` relations](#typing-morphto-relations)                                                                                                                                |
| An `Arrayable` DTO accessor/cast generating `unknown[]`                                                              | Nothing extra — typed public properties (promoted constructor properties included) are read automatically once `toArray()` has no `@return array{...}` shape of its own | A property-derived object shape instead of `unknown[]` — see [DTO-typed accessors and casts](#dto-typed-accessors-and-casts)                                                                                                           |
| `$this->relation->only([...])`/`->except([...])` losing the related model's own `#[TsCasts]`/`@property` refinements | Nothing extra — automatic whenever the relation resolves to a single model and every filtered key is a real database column                                             | `Pick<Model, 'a' \| 'b'>` referencing the model's own generated interface — `except()` picks the complement, every other column — see [API Resources § Relation Filters](https://tolki.abe.dev/ts/api-resources.html#relation-filters) |
| An accessor or relation missing from an inlined `$this->relation->except([...])`                                     | Name it explicitly — switch that key to `only([...])`, or give it its own entry in `toArray()`                                                                          | The key back. An inlined `except()` expands to database columns only, matching what `Model::except()` returns at runtime — see [API Resources § Relation Filters](https://tolki.abe.dev/ts/api-resources.html#relation-filters)        |

### PHPDoc Descriptions

Doc blocks are read automatically and converted to JSDoc comments:

| Location    | Source                                        | JSDoc Placement                          |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| Model class | Doc block above the class                     | Above the `export interface` declaration |
| Columns     | Doc block above the column's accessor method  | Above the column property                |
| Mutators    | Doc block above the mutator's accessor method | Above the mutator property               |
| Relations   | Doc block above the relation method           | Above the relation property              |

For columns and mutators, the new-style accessor (`protected function name(): Attribute`) is checked before the old-style one (`public function getNameAttribute()`). `@`-prefixed lines (`@param`, `@return`, `@phpstan-type`, ...) are stripped — only the prose description carries over.

```php
/** Application user account */
class User extends Model
{
    /** User initials (e.g. "JD" for "John Doe") */
    protected function initials(): Attribute
    {
        return Attribute::make(get: fn (): string => /* ... */);
    }

    /** Polymorphic images (avatar gallery, etc.) */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
```

### Timestamps as Date Objects

Timestamp columns (`date`, `datetime`, `timestamp`, and their immutable variants) map to `string` by default:

```php
// config/ts-publish.php
'timestamps_as_date' => true,
```

| Config Value      | Generated Type       |
| ----------------- | -------------------- |
| `false` (default) | `created_at: string` |
| `true`            | `created_at: Date`   |

### Custom TypeScript Type Mappings

The default PHP-to-TypeScript mapping is intentionally broad. Override or extend it with `custom_ts_mappings` (keys are matched case-insensitively):

```php
// config/ts-publish.php
'custom_ts_mappings' => [
    'binary' => 'Blob',
    'json' => 'Record<string, unknown>', // overrides the default 'object' mapping
    'money' => 'number',                  // adds a new mapping
],
```

Custom mappings are merged with the built-in map and take precedence. For a _per-property_ override instead of a global one, use [`#[TsCasts]`](#tscasts) or [`#[TsType]`](#tstype) instead.

Only the display-width-1 form stays boolean. `tinyint(1)` is what Laravel's `boolean()` emits on
MySQL and SQLite, so genuine boolean columns are unaffected — but a column declared with
`tinyInteger()` was previously typed [`boolean`](#booleans) and is now [`number`](#numbers).

Previously, a sized native type never matched the map at all and fell through to a substring scan,
which matched `int` inside `tinyint(1)` before reaching `tinyint`. That is why some genuinely boolean
columns were also mistyped before this change.

**What to do:** anywhere you compared a `tinyInteger()` column with `===  true` or used it directly in
a conditional, compare against the number instead. TypeScript will point at every site.

`AsArrayObject`, `AsEncryptedArrayObject` and `AsEnumArrayObject` now emit
[`unknown[] | Record<string, unknown>`](#arrays-objects) rather than `Record<string, unknown>` alone.

An `ArrayObject` hydrated from a list serializes as a JSON **array**, so the old type rejected a
payload the API genuinely returns.

**What to do:** narrow before treating the value as an object. `Object.keys(x.meta)` no longer
compiles on its own; guard with `Array.isArray(x.meta)` first, or use
[`#[TsCasts]`](#tscasts) to pin the property to whichever half your column actually produces.

#### Type Mapping Reference

[Numbers](#numbers) [Booleans](#booleans) [Strings](#strings) [Arrays &amp; Objects](#arrays-objects) [Dates &amp; Times](#dates-times) [Other](#other)

##### Numbers

`bigint`, `decimal`, `double`, `double precision`, `float`, `integer`, `int`, `numeric`, `number`, `mediumint`, `smallint`, `year`, `real`, `money`, `smallmoney`, `serial`, `bigserial`, `smallserial` → **`number`**

A bare `tinyint` (MySQL/SQL Server `tinyInteger()`) is also **`number`** — only the display-width-1 form (`tinyint(1)`, Laravel's `boolean()` column on MySQL/SQLite) means boolean; see [Booleans](#booleans).

##### Booleans

`bool`, `boolean`, `bit`, `tinyint(1)` → **`boolean`**

##### Strings

`char`, `character`, `enum`, `longtext`, `mediumtext`, `string`, `text`, `varchar`, `encrypted`, `uuid`, `guid`, `hashed`, `time`, `timetz`, `timestamptz`, `numeric-string` → **`string`**

Sized, binary, and legacy DB native types resolve the same way: `tinytext`, `binary`, `varbinary`, `blob`, `bytea`, `tinyblob`, `mediumblob`, `longblob`, `nvarchar`, `nchar`, `ntext`, `xml`, `interval`, `uniqueidentifier`, `datetimeoffset` → **`string`**. `set(…)` also resolves to `string`, not an array — MySQL returns a matched `SET` as a comma-joined string. So do Postgres/MySQL's network and full-text types: `inet`, `cidr`, `macaddr`, `macaddr8`, `tsvector`.

##### Arrays & Objects

| Cast                                                               | TypeScript Type                        |
| ------------------------------------------------------------------ | -------------------------------------- |
| `array`, `collection`, `iterable`                                  | `unknown[]`                            |
| `AsCollection`, `AsEncryptedCollection`, `AsEnumCollection` (bare) | `unknown[]`                            |
| `AsArrayObject`, `AsEncryptedArrayObject`, `AsEnumArrayObject`     | `unknown[] \| Record<string, unknown>` |
| `json`, `jsonb`, `object`                                          | `object`                               |
| `Illuminate\Database\Eloquent\Collection`                          | `Record<string, unknown>`              |
| `Illuminate\Support\Collection`                                    | `unknown[] \| Record<string, unknown>` |
| `Illuminate\Database\Eloquent\Casts\AsFluent`                      | `object`                               |

The three `As*ArrayObject` casts hydrate an `ArrayObject`, whose `jsonSerialize()` returns the underlying array verbatim — a list payload serializes as a JSON array, not an object, so the type admits both shapes rather than claiming `Record<string, unknown>` alone.

The `unknown[]` collection row above is the **bare** form. `AsEnumCollection::of(...)` and `AsCollection::of(...)` / `::using(...)` carry their mapped class in the cast string and resolve to that element's real type instead — see [Typing castable-with-arguments casts](#typing-castable-with-arguments-casts).

A parameterized docblock generic (`@return`, `@property`, `Attribute<>`) narrows further, based on its declared key type. The container and the key type are resolved independently, so every container behaves identically for a given key type:

| Key type             | Emitted                    | Containers                                            |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `int`, or omitted    | `X[]`                      | `list<X>`, `array<…>`, `iterable<…>`, `Collection<…>` |
| `string`             | `Record<string, X>`        | `array<…>`, `iterable<…>`, `Collection<…>`            |
| `array-key`, `mixed` | `X[] \| Record<string, X>` | `array<…>`, `iterable<…>`, `Collection<…>`            |

(`list<X>` has no key-type slot at all — a `list<X>` docblock generic always resolves to the first row, `X[]`.) A container with **no generic at all** — a bare `Collection`, unparameterized — doesn't reach this table: it resolves through the [Arrays & Objects](#arrays-objects) table above, via `TypeScriptMap`, not through the docblock generic resolver.

A collection _chain_ on a relation (`->sortBy()`, `->pluck($value, $key)`, `->take()`, …) is analyzed separately from its declared type: it keeps the `X[] | Record<string, X>` union unless the chain provably ends with sequential, 0-indexed keys — e.g. a trailing `->values()`, or `->take()` anchored at the front of an already-sequential collection — in which case it narrows to `X[]`.

##### Dates & Times

`date`, `immutable_date`, `datetime`, `immutable_datetime`, `immutable_custom_datetime`, `timestamp`, `datetime2`, `smalldatetime`, and `Carbon`/`CarbonImmutable`/`Illuminate\Support\Carbon` casts all resolve through [`timestamps_as_date`](#timestamps-as-date-objects) → **`string`** (default) or **`Date`**. `datetime2` is what SQL Server's `dateTime($precision)`/`timestamp($precision)` actually emit once a precision is given — the same logical column as bare `datetime`, so it follows the same toggle; `smalldatetime` is kept consistent with it.

##### Other

| Cast                                | TypeScript Type               |
| ----------------------------------- | ----------------------------- |
| `AsStringable`, `AsUri`, `AsBinary` | `string`                      |
| `null`                              | `null`                        |
| `mixed`                             | `unknown`                     |
| `never` (PHPStan)                   | `never`                       |
| `void` (PHPStan)                    | `void`                        |
| `true` / `false` (PHPStan)          | `true` / `false`              |
| `array-key` (PHPStan)               | `string \| number`            |
| `scalar` (PHPStan)                  | `string \| number \| boolean` |
| `geometry`, `geography`             | `unknown`                     |
| `vector`                            | `number[]`                    |

A spatial column's serialized shape depends entirely on how the app reads it — raw WKB is a binary
string, `ST_AsGeoJSON()` is an object — so `unknown` is the honest type rather than a guess. `vector`
is a pgvector/MySQL 9 column, which both serialize as a JSON array of floats.

MySQL's `geometry(subtype: '...')` writes the subtype itself as the column's native type instead of
`geometry` — `point`, `linestring`, `polygon`, `geometrycollection`, `multipoint`, `multilinestring`,
and `multipolygon` all resolve to **`unknown`** too, for the same reason as `geometry` above.

### Enum-Typed Columns (`{Model}Resource`)

A column, mutator, or relation typed to a `BackedEnum` or `UnitEnum` gets two representations:

- The base interface (`User`) types it as the plain `{Enum}Type` union — matching how Laravel serializes a `BackedEnum` when a model is cast to JSON.
- A parallel `{Model}Resource` / `{Model}MutatorsResource` / `{Model}AllResource` interface types the same property with [`AsEnum<typeof Enum>`](https://tolki.abe.dev/ts/enums.html#type-reference) instead — the shape you get once you've resolved the raw value to a full enum instance (e.g. `Status.from(user.status)`, or a Laravel API Resource that already serialized the enum via [`EnumResource`](https://tolki.abe.dev/ts/enum-api-resource.html)).

```typescript
import { Role } from "@data/enums";
import type { User, UserResource } from "@data/models";

function displayRole(user: User) {
  const resolved: UserResource["role"] = user.role
    ? Role.from(user.role)
    : null;
  // resolved?.label, resolved?.value, etc. — full enum instance, not just the raw value
}
```

The `{Model}Resource` variants (and the `AsEnum` import) are only generated when `enums.use_tolki_package` is `true` (the default). Set it to `false` and enum columns are typed with `{Enum}Type` only, everywhere.

### Filtering & Excluding Models

Same include/exclude pattern used by enums and resources:

```php
// config/ts-publish.php
'models' => [
    'included' => [App\Models\User::class],        // only these (empty = all)
    'excluded' => [App\Models\Pivot::class],         // never publish these
    'additional_directories' => ['modules/Blog/Models'],
],
```

`#[TsExclude]` on the model class excludes the whole model; on an accessor or relation method, it excludes just that property:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

class User extends Model
{
    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden');
    }

    #[TsExclude]
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full attribute behavior shared across models, enums, resources, and routes.

### Casing

`models.relationship_case` (`'snake'` (default), `'camel'`, or `'pascal'`) controls the casing of relation names and their generated `_count` / `_exists` properties:

| Config Value | Relation (`hasMany(Post::class)`) | Count         | Exists         |
| ------------ | --------------------------------- | ------------- | -------------- |
| `'snake'`    | `posts: Post[]`                   | `posts_count` | `posts_exists` |
| `'camel'`    | `posts: Post[]`                   | `postsCount`  | `postsExists`  |
| `'pascal'`   | `Posts: Post[]`                   | `PostsCount`  | `PostsExists`  |

### Configuration Reference

The full list of `models.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## API Resources

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can generate TypeScript interfaces from your Laravel [API Resources](https://laravel.com/docs/eloquent-resources) (`JsonResource` classes). It statically analyzes the `toArray()` method to extract property names, types, and optionality — producing a TypeScript interface that matches the shape of your API responses, without running the application.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), resources only need the `@tolki/ts` runtime package when they use `EnumResource::make()`, which generates `AsEnum<typeof Enum>` — backed by the runtime's `AsEnum` utility type (see [Enums](https://tolki.abe.dev/ts/enums.html)).

By default, the package looks for resources in the `app/Http/Resources` directory. See [Filtering & Excluding](#filtering--excluding) to customize this.

### How the Backing Model Is Resolved

The analyzer resolves property types by inspecting the backing Eloquent model's database schema and cast definitions. The backing model is determined from, in priority order:

1. The `#[TsResource(model:)]` attribute
2. The resource's own `@mixin` / `@extends` PHPDoc tag (resolved via use statements)
3. The nearest ancestor's `@mixin` / `@extends` — climbs the parent chain until one resolves
4. A typed `$resource` property
5. Convention-based guess — reverses Laravel's naming convention (`App\Http\Resources\UserResource` → `App\Models\User`)
6. `#[UseResource]` attribute scan — checks all collected models for a `#[UseResource(ResourceClass::class)]` attribute pointing to this resource (Laravel 12+ only)

Most resources only need `@mixin` or the naming convention. The `#[TsResource(model:)]` attribute is useful when the resource name doesn't match the model, and `#[UseResource]` handles cases where the resource lives outside the standard `Http\Resources` namespace.

Step 3 is what lets a subclass inherit its parent's model without repeating the docblock — see [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray). It applies to every resource missing its own tag, not only to body-less ones.

### Supported `toArray()` Patterns

The analyzer recognizes the following patterns inside `toArray()`:

#### Direct Property Access

```php
'id' => $this->id,
'name' => $this->name,
'status' => $this->status,       // Enum cast → generates enum type
```

Types are resolved from the model's database columns and cast definitions.

#### Local Variables

A variable assigned once from a model property and returned directly carries that type into the generated interface — you don't need to inline the property access:

```php
public function toArray(Request $request): array
{
    $slug = $this->slug;

    return [
        'slug' => $slug,   // string — same as returning `$this->slug` directly
    ];
}
```

This still works even if the same name is reused as a closure or arrow-function parameter elsewhere in the method. The parameter only shadows the variable for its own closure body — it no longer degrades the outer property to `unknown`:

```php
public function toArray(Request $request): array
{
    $member = $this->slug;

    return [
        'outer_member' => $member, // string
        'mapped_members' => $this->members->map(fn ($member) => $member), // User[] — this $member is the map's own element
    ];
}
```

If you see a property come out as `unknown` when it looks like it should resolve, check whether the backing variable is reassigned more than once, or reassigned inside a conditional branch — the analyzer can't tell which write is live at return time, so it deliberately falls back to `unknown` rather than guessing.

#### Conditional Methods

All conditional methods produce **optional** properties (with `?` in TypeScript) by default. Every one of
them, though, accepts a trailing default argument — and passing it explicitly makes the property
**required**, because the key can no longer be missing. `whenNotNull()`/`whenNull()`'s default argument is
covered just below the table; the rest of the family is covered right after that.

| Method                                          | Description                                    | Generated Type            |
| ----------------------------------------------- | ---------------------------------------------- | ------------------------- |
| `$this->when(cond, value)`                      | Include when condition is true                 | Inferred from value       |
| `$this->unless(cond, value)`                    | Include when condition is false                | Inferred from value       |
| `$this->whenHas('attr')`                        | Include when attribute is present              | From model column type    |
| `$this->whenAppended('attr')`                   | Include when accessor has been appended        | From model column type    |
| `$this->whenNotNull($this->attr)`               | Include when not null                          | From model column type    |
| `$this->whenNull($this->attr)`                  | Include when null                              | `null`                    |
| `$this->whenLoaded('relation')`                 | Include when relation is loaded                | From model relation type  |
| `$this->whenCounted('relation')`                | Include when count is loaded                   | `number`                  |
| `$this->whenAggregated('rel', 'col', 'fn')`     | Include when aggregate is loaded               | `number`                  |
| `$this->whenExistsLoaded('relation')`           | Include when existence flag is loaded          | `boolean`                 |
| `$this->whenPivotLoaded('table')`               | Include when pivot is loaded                   | `unknown`                 |
| `$this->whenPivotLoadedAs('accessor', 'table')` | Include when pivot (custom accessor) is loaded | `unknown`                 |
| `$this->transform($value, $callback)`           | Transform `$value` via `$callback` when filled | Inferred from `$callback` |

See [Nullable Relations](#nullable-relations) for `whenLoaded` nullability handling.

##### `unless()` is `when()` with the condition negated

`unless($condition, $value, $default)` runs `$value` when `$condition` is **false** — everything else about
how it's typed is identical to `when()`, including the default-argument rule covered below:

```php
'status' => $this->unless($this->is_draft, $this->status),          // optional
'status' => $this->unless($this->is_draft, $this->status, 'draft'), // required
```

##### `whenNotNull()` / `whenNull()` and their optional second argument

`whenNotNull($value, $default)` and `whenNull($value, $default)` read their arguments positionally — the
second argument is Laravel's fallback value, never a callback bound to the first argument. `whenNotNull()`'s guard
proves the value non-null on the success arm, so its `null` possibility is removed from the generated type:

```php
'line_2' => $this->whenNotNull($this->line_2), // string | null column
```

generates `line_2?: string`, not `line_2?: string | null`.

Passing a second argument changes both `optional` and the type: Laravel never omits the key once a default
is supplied, so the property becomes **required**, and its type becomes the union of the value and default
arms:

```php
'discount' => $this->whenNotNull($this->discount_percent, 0), // discount_percent: number | null
```

generates `discount: number` (required) — the default's type merges with, and here fully overlaps, the
value's own type. A default of a different type (e.g. a string fallback for a numeric column) produces a
union of both, still required.

##### The rest of the conditional family and their default argument

The same rule applies to every other conditional method: pass a default and the property stops being
optional, because it can no longer be missing.

```php
'status' => $this->when($this->is_published, $this->status),          // optional
'status' => $this->when($this->is_published, $this->status, 'draft'), // required
```

The type widens too, whenever the generator can resolve the default: its type is unioned in alongside the
value's, so the property covers both arms rather than only the one the value expression named.

```php
'discount' => $this->when($this->has_discount, $this->discount_percent),        // discount?: number
'discount' => $this->when($this->has_discount, $this->discount_percent, 'n/a'), // discount: number | string
'reviews'  => $this->whenCounted('reviews', null, 'n/a'),                       // reviews: number | string
'address'  => $this->whenHas('full_address', $this->full_address, 0),           // address: string | number
```

An explicit `null` still counts as a default — Laravel distinguishes an omitted argument from a passed-in
one, not a `null` value from a non-null one — so
`$this->whenLoaded('user', fn ($user) => $user, null)` is required, and typed `User | null` rather than a
bare `User` you could dereference on the not-loaded path.

The property is required either way — passing a default means the key is always there. Only the _type_
depends on what the generator could resolve, and two cases can't be widened:

- **The default's own type can't be resolved** (an unanalyzable expression or closure). There is nothing to
  union in, so the value's type stands alone.
- **The value's type can't be resolved** — `whenPivotLoaded()` and `whenPivotLoadedAs()`, whose pivot
  payload the generator never inspects. The property stays `unknown`, since `unknown` already admits the
  default.

A closure default that declares a required parameter goes a step further than merely unresolvable: Laravel
invokes every conditional default via `value($default)`, calling it with zero arguments, so a closure
requiring a parameter would throw if it ever ran. The generator treats that arm as unreachable and never
lets it widen the type:

```php
'notes' => $this->whenNotNull($this->notes, fn ($notes) => strlen($notes)), // notes: string, not string | number
```

A parameter with its own default (`fn ($notes = '') => strlen($notes)`) still runs cleanly with zero
arguments, so that arm keeps widening the type as usual.

#### Enum Properties with `EnumResource`

Use `EnumResource::make()` to expose enum-cast properties as rich enum objects:

```php
'status' => EnumResource::make($this->status),
'currency' => EnumResource::make($this->currency),
```

When `enums.use_tolki_package` is enabled (the default), these generate `AsEnum<typeof EnumName>` types with automatic imports. When disabled, they generate the enum's `Type` alias (e.g., `StatusType`).

#### Nested Resources

Reference other resources using `::make()`, `::collection()`, or `new`:

```php
// Single nested resource (optional when inside whenLoaded)
'author' => UserResource::make($this->whenLoaded('user')),

// Using new instead of ::make() — works identically
'author' => new UserResource($this->whenLoaded('user')),

// Collection of nested resources
'tags' => TagResource::collection($this->whenLoaded('tags')),

// Non-conditional nested resource
'owner' => UserResource::make($this->user),
```

Both `SomeResource::make(...)` and `new SomeResource(...)` are fully supported and behave identically — the analyzer resolves the resource type, tracks the FQCN for imports, and detects conditional arguments for optionality.

Self-referencing resources are also supported:

```php
'parent' => CategoryResource::make($this->whenLoaded('parent')),
'children' => CategoryResource::collection($this->whenLoaded('children')),
```

#### `toResource()` and `toResourceCollection()`

Laravel's `Model::toResource()` and `Collection::toResourceCollection()` are resolved too, three ways:

```php
// 1. Explicit class argument
'owner' => $this->owner->toResource(UserResource::class),

// 2. #[UseResource] / #[UseResourceCollection] on the model
'owner' => $this->owner->toResource(),

// 3. Laravel's naming convention — tries {Model}Resource, then bare {Model}
'owner_guessed' => $this->whenLoaded('owner', fn ($m) => $m->toResource()),
'attachment' => $this->whenLoaded('attachment', fn ($m) => $m->toResource()),
```

Only the third route _invents_ a class name, and it is accepted only when this package will actually emit that resource. If the guessed class is third-party, carries [`#[TsExclude]`](https://tolki.abe.dev/ts/excluding-content.html), or lives outside the scanned directories, the property falls back to `unknown` rather than referencing a module that is never written:

```typescript
owner_guessed?: UserResource; // guessed UserResource is published
attachment?: unknown; // AttachmentResource exists, but is #[TsExclude]d
```

> [!NOTE]
> This gate applies to the naming-convention guess only. A resource you named explicitly — as a class argument, via `#[UseResource]`/`#[UseResourceCollection]`, or through a collection's `#[Collects]`/`$collects` — is a declaration rather than a guess and is always honored, even if this package doesn't publish it. Previously a guessed-but-unpublished resource produced an import of a file that did not exist, which surfaced as a `TS2307 Cannot find module` in the consuming app.

#### Merge Operations

Use `merge`, `mergeWhen`, and `mergeUnless` to spread additional properties into the response:

```php
// Unconditional merge — properties are required (not optional)
$this->merge([
    'full_name' => $this->first_name . ' ' . $this->last_name,
    'total_display' => $this->total,
]),

// Conditional merge — properties are optional
$this->mergeWhen($this->is_featured, [
    'weight' => $this->weight,
    'dimensions' => $this->dimensions,
]),
```

Both `merge` and `mergeWhen` also accept closures and arrow functions instead of array literals:

```php
// merge with closure
$this->merge(fn () => [
    'currency_label' => $this->currency,
]),

// mergeWhen with closure
$this->mergeWhen($this->paid_at !== null, fn () => [
    'shipped_at' => $this->shipped_at,
    'tracking' => $this->tracking_number,
]),
```

| Method                            | Optionality    | Description                              |
| --------------------------------- | -------------- | ---------------------------------------- |
| `$this->merge([...])`             | Required       | Properties are always present            |
| `$this->mergeWhen(cond, [...])`   | Optional (`?`) | Properties included conditionally        |
| `$this->mergeUnless(cond, [...])` | Optional (`?`) | Properties included when `cond` is false |

#### Closure & Arrow Function Values

The analyzer resolves closures and arrow functions used as value arguments. Simple closures that return a single expression are analyzed recursively:

```php
// Arrow function — return expression analyzed directly
'status' => $this->when(true, fn () => $this->status),

// Arrow function returning a nested resource
'user' => $this->when(true, fn () => UserResource::make($this->user)),

// Full closure — first return statement is analyzed
'notes' => $this->when(true, function () {
    return $this->notes;
}),
```

This works anywhere a value expression is expected — including `when`, `whenLoaded`, `whenNotNull`, `merge`, and `mergeWhen`.

#### Parent `toArray()` Spread

Extend a parent resource using `...parent::toArray($request)`. Parent properties appear first, and the child can override any key:

```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => EnumResource::make($this->status),
        ];
    }
}

class ApiPostResource extends PostResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'status' => $this->status,       // Overrides parent's EnumResource type
        ];
    }
}
```

The child `ApiPostResource` inherits all parent properties (`id`, `title`, `status`), with `status` overridden to use the plain enum value instead of `EnumResource::make()`.

If the parent itself extends `JsonResource` (the base class), the spread automatically delegates to the model's database attributes — see [JsonResource Base Delegation](#jsonresource-base-delegation).

Writing the spread out by hand remains the idiomatic form, and both spellings — `...parent::toArray($request)` inside an array literal, and a bare `return parent::toArray($request);` — are fully supported. A child that declares **no** `toArray()` at all now inherits the parent's as well; see [Inheriting a Parent `toArray()`](#inheriting-a-parent-toarray).

#### Inheriting a Parent `toArray()`

A resource that extends another resource and declares no `toArray()` of its own inherits the parent's shape:

```php
/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => EnumResource::make($this->status),
        ];
    }
}

// No toArray(), no @mixin — both are inherited from OrderResource
class BodylessOrderResource extends OrderResource {}
```

```typescript
export interface BodylessOrderResource {
  id: number;
  status: AsEnum<typeof OrderStatus>;
}
```

The lookup walks up the parent chain and stops at the nearest ancestor that actually declares a `toArray()` body, so multi-level inheritance works too. The backing model is inherited alongside it — a resource with no `@mixin`/`@extends` of its own falls back to the nearest ancestor that has one (step 3 of [How the Backing Model Is Resolved](#how-the-backing-model-is-resolved)). Without that, the inherited shape would resolve no model and every column would degrade to `unknown`.

If **no** class in the chain declares a `toArray()`, nothing changes: the resource still falls back to [JsonResource Base Delegation](#jsonresource-base-delegation), or to `#[TsExtends]`-only output when no model resolves either. Body-less `ResourceCollection` subclasses are likewise unaffected and still resolve their element type through `$collects` or the naming convention.

> [!NOTE]
> Previously, a child resource with no `toArray()` of its own produced an empty interface whenever no model could be resolved for it either. If you added a pass-through `toArray()` purely to work around that, you can now delete it.

#### Trait Method Spread

Spread trait method return values into `toArray()` with `...$this->traitMethod()`. The analyzer reads `@return array{key: type}` PHPDoc annotations to resolve property types:

```php
trait IncludesMorphValue
{
    /**
     * @return array{morphValue: string}
     */
    protected function includeMorphValue(): array
    {
        return ['morphValue' => $this->resource->getMorphClass()];
    }
}

class PostResource extends JsonResource
{
    use IncludesMorphValue;

    public function toArray(Request $request): array
    {
        return [
            ...$this->includeMorphValue(),
            'id' => $this->id,
            'title' => $this->title,
        ];
    }
}
```

Generates:

```typescript
export interface Post {
  morphValue: string; // From trait PHPDoc
  id: number;
  title: string;
}
```

Multiline `@return` shapes are also supported:

```php
/**
 * @return array{
 *     firstName: string,
 *     lastName: string,
 *     isActive: bool,
 * }
 */
protected function includeProfile(): array
{
    // ...
}
```

Another option for defining the return types of a trait method is to use the `#[TsCasts]` attribute on the trait method itself with the same syntax as the `#[TsCasts]` attribute for models:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

trait IncludesExtras
{
    #[TsCasts([
        'location' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
        'flag' => ['type' => 'string | null', 'optional' => true],
        'extra' => 'Record<string, unknown>',
    ])]
    protected function includeCastedExtras(): array
    {
        return [
            'location' => strtoupper('x'),
            'flag' => strtolower('y'),
        ];
    }
}
```

> [!TIP]
> Trait spreads also flow through parent inheritance. If a parent resource spreads a trait method and a child extends it with `...parent::toArray($request)`, the child inherits the trait-contributed properties.

> [!NOTE]
> When a trait method has no `@return array{...}` PHPDoc or `#[TsCasts]` attribute, its properties will be typed as `unknown`.

#### Model `toArray()` Spread

Spreading a **model's** own `toArray()` inside an array literal — alongside the literal's other keys — intersects the model's generated interface with those keys instead of collapsing to `unknown[]`:

```php
'members' => $this->whenLoaded('members', fn ($members) => $members->map(
    fn (User $member) => [...$member->toArray(), 'flag' => true]
)),
```

```typescript
members?: (Omit<User, "flag"> & { flag: boolean })[];
```

The `Omit<>` is not cosmetic. PHP lets the later assignment win, so `'flag'` overwrites anything the spread contributed; TypeScript's `&` would instead intersect both and collapse a conflicting key to `never`. Subtracting the overridden keys from the earlier arm is what makes the emitted type mean what the PHP means. Several spreads in one literal are each `Omit<>`'d against every key a later arm or an explicit sibling key will overwrite, in source order.

> [!NOTE]
> The arm emits a **reference** to the `{Model}` interface rather than a re-derived shape, which is the honest floor rather than an exact match for `toArray()`'s runtime output. `Model::toArray()` is `attributesToArray()` merged with `relationsToArray()`, and bare `{Model}` covers only the first of those two — so two gaps, one in each direction:
>
> - **Relations are missing.** A relation loaded on the model before the spread is in the JSON payload but not in the type. That isn't knowable statically, and under the [`model-split` template](https://tolki.abe.dev/ts/models.html#model-templates) relations live in `{Model}Relations`, which the arm doesn't reference.
> - **`$hidden` columns are extra.** They're stripped at runtime but remain in `{Model}` unless [`models.exclude_hidden`](https://tolki.abe.dev/ts/models.html#what-gets-published-hidden-attributes-write-only-accessors) is enabled.
>
> `$appends` are **not** a gap: an appended accessor is part of `attributesToArray()` at runtime and is generated into bare `{Model}` alongside the columns, so the two agree. (`{Model}Mutators` holds the accessors a model did _not_ append.)
>
> Spreading a **resource** (`...UserResource::make($m)->resolve($request)`) works the same way and has neither gap, since the resource interface is the response shape.

#### Bare Method-Call Return

`toArray()` doesn't have to spread a method's return value into an array literal — returning the method call directly is supported too:

```php
public function toArray(Request $request): array
{
    return $this->data();          // now supported
    // return [...$this->data()];  // already supported
}
```

This resolves transitively: if `data()` itself returns another method call, the analyzer keeps following the chain until it reaches an array literal (or an `only()`/`except()` filter — see [Attribute Filters](#attribute-filters-only--except) below):

```php
class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->data();
    }

    protected function data(): array
    {
        return $this->nested();
    }

    protected function nested(): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
        ];
    }
}
```

Generates:

```typescript
export interface TeamResource {
  id: number;
  slug: string;
}
```

The chain can pass through a trait and parent-declared methods the same way a `...$this->method()` spread does — see [Trait Method Spread](#trait-method-spread) above.

#### JsonResource Base Delegation

Resources that have **no `toArray()` method** or whose `toArray()` simply returns `parent::toArray($request)` automatically generate properties from the backing model's database schema:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    // No toArray() — properties auto-generated from User model
}
```

You can also spread the base properties and add computed keys:

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'full_name' => strtoupper($this->name),
        ];
    }
}
```

The model is resolved from `#[TsResource(model:)]`, `@mixin` PHPDoc, or use statements. When no model can be detected, the resource produces an empty interface.

#### Attribute Filters (`only` / `except`)

Resources that use `$this->only([...])` or `$this->except([...])` to filter model attributes are supported — both as a direct return value and as a spread:

```php
// As the return value
public function toArray(Request $request): array
{
    return $this->only(['id', 'name', 'email']);
}

// As a spread in a return array
public function toArray(Request $request): array
{
    return [
        ...$this->except(['password', 'remember_token']),
        'role' => EnumResource::make($this->role),
    ];
}
```

Both methods delegate to the backing model's full database schema and filter by the listed keys. Properties retain their original types from the model.

> [!NOTE]
> Currently only `only` and `except` are supported as attribute filter methods. Other collection-style methods are not analyzed. If you find you need additional methods, open an issue, or better yet, submit a PR with the added functionality! See [`FiltersModelAttributes`](https://github.com/abetwothree/laravel-ts-publish/blob/main/src/Analyzers/Concerns/FiltersModelAttributes.php).

#### Relation Filters

The same two methods work on a **related** model — `$this->author->only([...])`, `$this->post?->except([...])` — and are typed one of two ways.

Two conditions have to hold for that reference form, not one: the relation must resolve to a **single** model, _and_ every filtered key must be a real database column. When both hold, the property references the related model's own generated interface with `Pick<>` — `only()` picks the keys you named, `except()` picks their **complement**, every other column on the model:

```php
'author' => $this->author->only(['id', 'name']),
'post' => $this->post?->except(['created_at', 'updated_at']),
```

```typescript
author: Pick<User, "id" | "name">;
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

That is the preferred shape: it keeps the model's own `#[TsCasts]` and `@property` refinements authoritative instead of re-deriving them into a detached inline object. Both branches emit `Pick<>`, never `Omit<>` — naming the surviving columns instead of the excluded ones keeps the reference accurate regardless of how many other members (mutators, relations, counts) the model's generated interface happens to carry beyond its columns.

> [!TIP]
> `except()`'s complement is always your model's columns minus the named keys — so this reference form is exactly as wide as `only()` naming every other column by hand, and no wider. If your model gains a column, an existing `except([...])` picks it up automatically; nothing needs regenerating by hand.

When the reference can't be used — a filter key that isn't a column, or an accessor typed as a union of two or more models — the shape is expanded inline instead, and the two methods deliberately produce **different** property sets:

- **`only([...])`** expands exactly the keys you named. `HasAttributes::only()` calls `getAttribute()` per key, which resolves accessors and relations alike, so naming either one works: `$this->author->only(['name', 'initials', 'posts'])` emits `{ name: string; initials: string; posts: Post[] }`.
- **`except([...])`** expands the related model's **database columns** minus the named keys — never an accessor, never a relation. `HasAttributes::except()` iterates `getAttributes()`, which holds stored column values only; a get-only `Attribute` accessor is never merged back into it, and relations live in a separate bag entirely.

An accessor that union-types two or more models — `@return Attribute<Image|User|null, never>` — never reaches the reference form at all, so every arm is expanded inline even when every key you named is a real column.

> [!NOTE]
> The split mirrors Eloquent rather than inventing a rule. `HasAttributes::except()` iterates `getAttributes()`, the raw stored-attribute bag, and reads `getAttribute()` only for keys already in it, so a get-only `Attribute` accessor is never merged back in and relations live in a separate bag entirely. `HasAttributes::only()` iterates the names _you_ passed and calls `getAttribute()` on each, which does resolve accessors and relations. Typing the two the same way would promise members the JSON payload never carries.

So for `'author' => $this->author?->except(['id', 'name'])`, where `User` declares the accessors
`initials`/`is_premium` and the relations `profile`/`posts`, the emitted type is columns only:

```typescript
author: { email: string; phone: string | null } | null;
```

Naming a relation or an accessor in the exclusion list is a no-op, since that key was never in the
set being subtracted from. Reach for `only([...])` when you want one, or give it its own entry in
`toArray()`.

`except()`'s reference form used to name the excluded keys with `Omit<>` — `Omit<Post, "created_at" | "updated_at">` — rather than picking the survivors. That was accurate under the default model template, but re-widened under a template where the model's bare interface carries mutators, relations, counts, and exists alongside its columns, since `Omit<>` only ever subtracts from whatever `keyof Model` happens to be:

```typescript
// Before: Omit<> — width depends on the model template
post: Omit<Post, "created_at" | "updated_at"> | null;

// After: Pick<> of the complement — the same columns regardless of template
post: Pick<Post, "id" | "title" | "content" | "user_id"> | null;
```

No action needed — the two forms carry the same columns under the default template, and the picked
member list is now visible directly in the type instead of needing to be worked out from what the
model interface excludes.

`except()` used to expand to every attribute **and** every relation on the related model, minus the
excluded keys, which is a shape `Model::except()` never returns at runtime. Accessors and relations
that appeared in an `except()`-filtered type are gone:

```typescript
// Before: every attribute and every relation, minus the named keys
author: {
  email: string;
  phone: string | null;
  initials: string; // accessor
  is_premium: boolean; // accessor
  profile: Profile | null; // relation
  posts: Post[]; // relation
} | null;

// After: database columns only
author: { email: string; phone: string | null } | null;
```

If you relied on one of those arriving through an `except()`-filtered relation, name it explicitly.
Switch the property to `only([...])`, or add the key as its own entry in `toArray()`. TypeScript
will point at every site that reads a now-missing key.

#### `exclude_hidden` and attribute filters

`ts-publish.models.exclude_hidden` (see [Models § What gets published](https://tolki.abe.dev/ts/models.html#what-gets-published-hidden-attributes-write-only-accessors)) governs resources too, not just the model's own interface:

```php
$this->only(['password'])   // kept: you named it
$this->except(['id'])       // password dropped: the set is derived
```

That split isn't arbitrary — it mirrors what `Model::only()` versus `toArray()`/`except()` already do at runtime. `Model::only()` resolves each key through `getAttribute()`, which returns a `$hidden` attribute regardless of visibility; `toArray()` and `Model::except()` both go through `getArrayableItems()`, which strips `$hidden` attributes before your excluded keys are even considered. This package's analyzer follows the same split:

| Pattern                                                                                 | Property set                               | A `$hidden` column, with `exclude_hidden` enabled |
| --------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| `'password' => $this->password`                                                         | the property you wrote by hand             | **kept** — you named it                           |
| `$this->only(['id', 'password'])`                                                       | exactly the keys you named                 | **kept** — you named it                           |
| `$this->relation->only(['id', 'password'])`                                             | exactly the keys you named                 | **kept** — you named it                           |
| `$this->whenHas('password')`                                                            | the attribute you named                    | **kept** — you named it                           |
| `$this->except(['id'])`                                                                 | every model attribute minus the named keys | **dropped** — the set is derived                  |
| `$this->relation->except(['id'])`                                                       | every database column minus the named keys | **dropped** — the set is derived                  |
| `parent::toArray($request)`, `[...parent::toArray($request)]`, or no `toArray()` at all | every model attribute                      | **dropped** — the set is derived                  |

`'password' => $this->password` is worth calling out on its own: it's the plainest, most common way to expose a column, and it behaves exactly like a named `only()` key — a `$hidden` column you access directly is never silently dropped.

If you want a `$hidden` column published through one of the derived paths, name it explicitly — switch that property to `only([...])`, access it directly as `$this->column`, or drop it from the model's `$hidden` array entirely if it no longer needs to be hidden.

#### Resource Collections

`ResourceCollection` subclasses are supported. The analyzer resolves `$this->collection` to the singular resource type as an array:

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'has_admin' => true,
        ];
    }
}
```

Generates:

```typescript
import type { UserResource } from "./";

export interface UserCollection {
  data: UserResource[];
  has_admin: unknown;
}
```

The singular resource is resolved from:

1. **Explicit `$collects` property** — if defined on the collection class
2. **Naming convention** — `UserCollection` → `UserResource` (strips "Collection", appends "Resource")

```php
class OrderCollection extends ResourceCollection
{
    // Explicit: use OrderResource as the singular resource
    public $collects = OrderResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }
}
```

When the singular resource cannot be resolved (e.g., `MiscCollection` with no matching `MiscResource`), `$this->collection` falls back to `unknown`.

##### Key-Preserving Collections

A `ResourceCollection` normally serializes as a JSON array, so the generated type is `R[]`. Laravel
supports opting a collection out of that and keeping its original keys instead, which makes the
payload a JSON object — two ways to opt in, both recognized:

```php
use Illuminate\Http\Resources\Attributes\PreserveKeys;
use Illuminate\Http\Resources\Json\ResourceCollection;

#[PreserveKeys] // Laravel 13+
class TeamCollection extends ResourceCollection
{
    public $collects = TeamResource::class;
}
```

```php
use Illuminate\Http\Resources\Json\ResourceCollection;

class TeamCollection extends ResourceCollection
{
    public $preserveKeys = true; // works on every supported Laravel version

    public $collects = TeamResource::class;
}
```

Either form generates:

```typescript
export interface TeamCollection {
  data: Record<string, TeamResource>;
}
```

Larger support for `ResourceCollection` features (e.g., pagination metadata, `additional()` method, etc.) may be added in a future release.

### Anatomy of a Generated Resource

Given this resource:

```php
/**
 * User account resource.
 *
 * @mixin User
 */
#[TsResource(model: User::class)]
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => EnumResource::make($this->role),
            'profile' => $this->whenLoaded('profile'),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'phone' => $this->whenHas('phone'),
            'avatar' => $this->whenNotNull($this->avatar),
            'posts_count' => $this->whenCounted('posts'),
            'comments_count' => $this->whenCounted('comments'),
        ];
    }
}
```

The package generates the following TypeScript interface:

```typescript
import { type AsEnum } from "@tolki/ts";

import { Role } from "../../enums";
import type { Profile } from "../../models";
import type { PostResource } from ".";

/**
 * User account resource.
 *
 * @see Workbench\App\Http\Resources\UserResource
 */
export interface UserResource {
  id: number;
  name: string;
  email: string;
  role: AsEnum<typeof Role> | null;
  profile?: Profile | null;
  posts?: PostResource[];
  phone?: string | null;
  avatar?: string;
  posts_count?: number;
  comments_count?: number;
}
```

Notice how:

- Direct properties (`id`, `name`, `email`) are **required**
- `whenLoaded`, `whenHas`, `whenNotNull`, and `whenCounted` properties are **optional** (`?`)
- `EnumResource::make()` generates `AsEnum<typeof Role>` with the proper import, and `| null` since the underlying column is nullable
- `PostResource::collection()` is typed as `PostResource[]`, imported from the same directory's barrel
- Bare `whenLoaded('profile')` resolves to the model relation type (`Profile | null`)
- PHPDoc class descriptions are preserved as JSDoc comments, alongside an auto-added `@see` back-reference to the PHP class

#### Classes Sharing a Name Across Namespaces

When two classes in different namespaces share a class name — `App\Models\User` and `Crm\Models\User` — the generated file imports both under distinct aliases, and each occurrence of the name inside a property's type resolves to its own alias, in source order:

```typescript
import type { User as CrmUser } from "../../../crm/models";
import type { User as ModelsUser } from "../../models";

export interface WarehouseResource {
  regional_hub_contacts: {
    primaryContact: CrmUser | null;
    manager: ModelsUser | null;
    secondaryContact: CrmUser | null;
  } | null;
}
```

> [!NOTE]
> Previously, a property naming the same class name more times than it had **distinct** classes could alias an arm to the wrong class, or leave the final occurrence as a bare `User` that matched no import — a `TS2304 Cannot find name`. Both are fixed; the interleaved case above (`Crm`, `App`, `Crm`) is the shape that pins it.

### Resource Attributes

Three attributes are available for configuring resource TypeScript generation. See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full `#[TsExclude]` reference.

| Attribute       | Target                   | Description                                                                  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `#[TsResource]` | Resource class           | Override the interface name, specify the backing model, or add a description |
| `#[TsCasts]`    | Resource class or method | Override or add property types with custom TypeScript types                  |
| `#[TsExclude]`  | Resource class           | Exclude the entire resource from the TypeScript output.                      |

#### `#[TsResource]` — Configure Resource Generation

Use this attribute to override the generated interface name, explicitly specify the backing model, or add a description:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsResource;
use App\Models\User;

#[TsResource(name: 'UserData', model: User::class, description: 'User API response')]
class UserResource extends JsonResource
{
    // ...
}
```

| Parameter     | Type            | Default       | Description                                   |
| ------------- | --------------- | ------------- | --------------------------------------------- |
| `name`        | `?string`       | Class name    | Override the TypeScript interface name        |
| `model`       | `?class-string` | Auto-detected | Explicitly specify the backing Eloquent model |
| `description` | `string`        | `''`          | Added as a JSDoc comment above the interface  |

> [!TIP]
> When `name` is set, it also affects the output filename. For example, `#[TsResource(name: 'Address')]` generates `address.ts` instead of `address-resource.ts`.

#### `#[TsCasts]` — Override Property Types

Use this attribute to override inferred types or add virtual properties with custom TypeScript types:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts([
    'metadata' => 'Record<string, unknown>',
    'coordinates' => ['type' => 'GeoPoint', 'import' => '@/types/geo'],
    'flagged_at' => ['type' => 'string | null', 'optional' => true],
])]
class CommentResource extends JsonResource
{
    // ...
}
```

Each entry can be:

| Format                | Example                                             | Description                            |
| --------------------- | --------------------------------------------------- | -------------------------------------- |
| Plain string          | `'Record<string, unknown>'`                         | Override the type only                 |
| Array with `import`   | `['type' => 'GeoPoint', 'import' => '@/types/geo']` | Custom type with an import statement   |
| Array with `optional` | `['type' => 'string', 'optional' => true]`          | Override the type and mark as optional |

Properties defined in `#[TsCasts]` that don't exist in `toArray()` are appended to the generated interface. Properties that do exist have their types overridden.

Generated TypeScript with the `coordinates` example:

```typescript
import type { GeoPoint } from "@/types/geo";

export interface CommentResource {
  id: number;
  content: string;
  is_flagged: boolean;
  flagged_at?: string | null;
  metadata: Record<string, unknown>;
  author?: UserResource;
  post?: PostResource;
  coordinates: GeoPoint;
}
```

##### On Trait Methods

`#[TsCasts]` can also be applied to **trait methods** that are spread into `toArray()`. This lets you control types for trait-contributed properties without modifying the resource class — see [Trait Method Spread](#trait-method-spread) above.

The attribute works identically to the class-level version — overriding types, marking properties optional, adding imports, and appending new properties.

> [!NOTE]
> `#[TsCasts]` replaces the former `#[TsResourceCasts]` attribute, which was removed. If you were using `TsResourceCasts`, replace it with `TsCasts` — the syntax is identical.

### Nullable Relations

When `whenLoaded('relation')` resolves a relation type, the package determines whether it should include `| null` based on the relation kind and the database schema.

This is controlled by the `nullable_relations` config option (enabled by default). The strategy for each relation type is:

| Relation Type                         | Strategy   | Description                                          |
| ------------------------------------- | ---------- | ---------------------------------------------------- |
| `HasOne`, `MorphOne`, `HasOneThrough` | `nullable` | Always nullable — the related record may not exist   |
| `BelongsTo`                           | `fk`       | Checks the foreign key column's DB-level nullability |
| `MorphTo`                             | `morph`    | Checks both the morph type and FK column nullability |
| `HasMany`, `BelongsToMany`, etc.      | `never`    | Collection relations — typed as arrays, never null   |

For example, a `BelongsTo` relation with a nullable foreign key:

```php
// Migration: $table->foreignId('user_id')->nullable();

// Resource:
'user' => UserResource::make($this->whenLoaded('user')),
```

Generates `user?: UserResource | null` — optional (from `whenLoaded`) and nullable (from the nullable FK).

You can disable nullable relation detection globally:

```php
// config/ts-publish.php
'models' => [
    'nullable_relations' => false,
],
```

Or override the strategy for specific relation types using `models.relation_nullability_map`:

```php
// config/ts-publish.php
'models' => [
    'relation_nullability_map' => [
        \Illuminate\Database\Eloquent\Relations\HasOne::class => 'never',
    ],
],
```

Valid strategies are `'nullable'`, `'never'`, `'fk'`, and `'morph'`.

> [!NOTE]
> This is the same `models.*` nullability configuration used by [Models](https://tolki.abe.dev/ts/models.html) — resources and models share one nullability-detection strategy since resources ultimately resolve relation types from the same backing model.

### Filtering & Excluding

You can customize which resources are discovered using the same include/exclude pattern as [enums](https://tolki.abe.dev/ts/enums.html) and [models](https://tolki.abe.dev/ts/models.html):

```php
// config/ts-publish.php

'resources' => [
    // Only publish these specific resources (leave empty to include all)
    'included' => [
        App\Http\Resources\UserResource::class,
        App\Http\Resources\PostResource::class,
    ],

    // Exclude specific resources from publishing
    'excluded' => [
        App\Http\Resources\InternalResource::class,
    ],

    // Search additional directories for resources
    'additional_directories' => [
        'modules/Blog/Http/Resources',
    ],
],
```

> [!TIP]
> Like models and enums, include and exclude settings accept both fully-qualified class names and directory paths.

`#[TsExclude]` also works at the class level — see [Resource Attributes](#resource-attributes) above and [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html).

You can disable resource publishing entirely in the config file:

```php
// config/ts-publish.php

'resources' => [
    'enabled' => false,
],
```

Or publish only resources for a single run using the command flag:

```bash
php artisan ts:publish --only-resources
```

The `--only-resources` flag cannot be combined with any other `--only-*` flag (`--only-enums`, `--only-models`, `--only-routes`, `--only-form-requests`, `--only-broadcast-channels`, `--only-broadcast-events`).

### Configuration Reference

The full list of `resources.*` config keys lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Broadcast Channels

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) compiles every channel name registered in `routes/channels.php` into a single `broadcast-channels.ts` file — a `BroadcastChannel` template-literal type union plus a `BroadcastChannels` const with a nested accessor function for every dynamic segment, so you build channel names the same way you'd call a route helper instead of hand-typing `{placeholder}` strings.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), broadcast channels don't need the `@tolki/ts` runtime package — the output is a plain TypeScript union type and a plain object of accessor functions/strings.

### How Broadcast Channel Types Are Generated

Broadcast channels are architecturally different from [enums](https://tolki.abe.dev/ts/enums.html), [models](https://tolki.abe.dev/ts/models.html), [resources](https://tolki.abe.dev/ts/api-resources.html), and [form requests](https://tolki.abe.dev/ts/form-requests.html): there's no per-class collection, filtering, or attributes involved. Instead:

- The collector reads `Illuminate\Broadcasting\BroadcastManager::getChannels()->keys()` directly — the exact set of channel name strings registered via `Broadcast::channel(...)` in `routes/channels.php`.
- **Both registration styles collect identically.** Whether a channel is registered with a closure or a channel class (`Broadcast::channel('orders.{orderId}', OrderChannel::class)`), only the channel _name string_ drives the TypeScript output — the authorization callback/class is never inspected.
- Every registered channel is compiled into **one** combined output file (`broadcast_channels.filename`, default `broadcast-channels.ts`) — there's no barrel `index.ts`, no modular per-item files, and no `included` / `excluded` / `additional_directories` filtering, since there's no per-item PHP class to filter by.
- There's no `#[TsExclude]` or `#[TsCasts]` support for the same reason — see [No Per-Channel Attributes](#no-per-channel-attributes).

### Anatomy of the Generated File

Given these registrations:

```php
// routes/channels.php
use Illuminate\Support\Facades\Broadcast;
use Workbench\App\Broadcasting\PublicAnnouncementsChannel;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Both a terminal channel and a prefix of channels below — see "$channel" Accessor.
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    return true;
});

Broadcast::channel('chat.{roomId}.messages', function ($user, $roomId) {
    return true;
});

// Class-based registration — only the name string matters for the TS output.
Broadcast::channel('public-announcements', PublicAnnouncementsChannel::class);
```

The package generates:

```typescript
export type BroadcastChannel =
  | `orders.${string | number}`
  | `user.${string | number}.notifications`
  | `chat.${string | number}`
  | `chat.${string | number}.messages`
  | `public-announcements`;

export const BroadcastChannels = {
  orders: (orderId: string | number) => `orders.${orderId}` as const,
  user: (userId: string | number) => ({
    notifications: `user.${userId}.notifications` as const,
  }),
  chat: (roomId: string | number) => ({
    $channel: `chat.${roomId}` as const,
    messages: `chat.${roomId}.messages` as const,
  }),
  "public-announcements": `public-announcements` as const,
};
```

- **`BroadcastChannel`** is a union of [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) — every `{param}` segment becomes `${string | number}`, regardless of whether the wildcard is bound to a model, an enum, or a plain scalar on the PHP side (the channel name string is the only thing that matters).
- **`BroadcastChannels`** mirrors the dot-notation structure: a channel with no dynamic segments is a plain string constant; a channel with a `{param}` at the end is a function returning the built string; a channel with a `{param}` _and_ nested children (like `user.{userId}.notifications`) is a function returning an object of its children.
- Static segments that aren't valid JavaScript identifiers (like `public-announcements`, containing a hyphen) are automatically quoted — see [Quoted Keys](#quoted-keys).

### The Dot-Notation Tree Algorithm

Each channel name is processed independently and then merged into a shared tree, mirroring [Laravel Wayfinder's](https://github.com/laravel/wayfinder) approach:

1. **Split** the channel name on `.` — `user.{userId}.notifications` → `['user', '{userId}', 'notifications']`.
2. **Reverse-iterate** the segments to associate each _static_ segment with the `{param}` names that immediately preceded it: `notifications` gets no params, `user` gets `['userId']`.
3. **Forward-iterate** to build a flat dot-notation map with parent keys always appearing before child keys (`user`, then `user.notifications`), so merging later doesn't overwrite a parent with a child.
4. **Merge** every channel's flat entries and un-flatten them into a single nested tree.
5. **Render** the tree recursively: a leaf segment becomes a template-literal string (wrapped in a function if it or an ancestor has params); a branch segment becomes a nested object (also wrapped in a function if it or an ancestor has params).

### Both Registration Styles

Laravel supports registering a channel with either a closure or a dedicated channel class with a `join()` method:

```php
// Closure-based
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

// Class-based — the class only affects PHP-side authorization
Broadcast::channel('order.{orderId}', OrderChannel::class);
```

Both produce identical TypeScript output for the same channel name pattern, since the collector only ever reads the channel name string from `BroadcastManager` — it never inspects the closure or class.

### The `"$channel"` Accessor for Overlapping Prefixes

When a channel name is _both_ a complete, subscribable channel **and** a dot-notation prefix of other channels (like `chat.{roomId}` alongside `chat.{roomId}.messages`), the generated accessor object needs a way to expose the parent channel string alongside its children. That's what `$channel` is for:

```typescript
BroadcastChannels.chat(42).$channel; // 'chat.42'         — the chat room itself
BroadcastChannels.chat(42).messages; // 'chat.42.messages' — the room's message stream
```

Without `$channel`, there would be no way to reach the plain `chat.{roomId}` channel string once `chat` becomes a function returning an object with `messages` as a key.

### Quoted Keys

Static segments containing characters that aren't valid in a bare JavaScript object key (like hyphens) are automatically wrapped in quotes:

```typescript
export const BroadcastChannels = {
  "public-announcements": `public-announcements` as const,
  "order-status": (statusId: string | number) =>
    `order-status.${statusId}` as const,
};
```

```typescript
BroadcastChannels["public-announcements"];
BroadcastChannels["order-status"](3);
```

### The `BroadcastChannel` Type

Every registered channel name contributes one member to the `BroadcastChannel` union — useful for typing a helper that accepts any valid channel string without hard-coding a specific one:

```typescript
import type { BroadcastChannel } from "@js/types/data/broadcast-channels";

function subscribe(channel: BroadcastChannel) {
  return Echo.private(channel);
}

subscribe(BroadcastChannels.orders(42)); // ✓
subscribe("not-a-real-channel"); // ✗ type error
```

### No Per-Channel Attributes

Because channels are collected as plain name strings (not reflected PHP classes), the attribute-based customization available for [enums](https://tolki.abe.dev/ts/enums.html#enum-attributes), [models](https://tolki.abe.dev/ts/models.html#model-attributes), and [form requests](https://tolki.abe.dev/ts/form-requests.html#tscasts-overriding-field-types) doesn't apply here:

- **No `#[TsExclude]`** — to omit a channel from the output, remove or conditionally skip its `Broadcast::channel(...)` registration in `routes/channels.php` (e.g. behind an `if (! app()->isProduction())` check) instead.
- **No `#[TsCasts]`** — there's no per-channel type to override; every dynamic segment is always `string | number`, matching how a channel name is resolved at broadcast-auth time regardless of what PHP type it's bound to.
- **No `included` / `excluded` / `additional_directories` config** — every channel registered anywhere Laravel loads `routes/channels.php` is included; there's no directory to search since channels aren't backed by individual class files.

### Configuration Reference

The full list of `broadcast_channels.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Broadcast Events

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates one TypeScript interface per `ShouldBroadcast` / `ShouldBroadcastNow` event class, plus a combined `broadcast-events.ts` index file with a `BroadcastEvent` union type and a flat `BroadcastEvents` const of every Echo event name — and, optionally, a module-augmentation file that makes Laravel Echo's `Events` interface fully typed.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), broadcast events don't need the `@tolki/ts` runtime package — the output is plain TypeScript interfaces and a plain `const` object.

### How Broadcast Event Types Are Generated

Unlike [broadcast channels](https://tolki.abe.dev/ts/broadcast-channels.html), broadcast events use the same modular, per-class pipeline as [enums](https://tolki.abe.dev/ts/enums.html), [models](https://tolki.abe.dev/ts/models.html), and [form requests](https://tolki.abe.dev/ts/form-requests.html):

- `BroadcastEventsCollector` discovers every class implementing `ShouldBroadcast` or `ShouldBroadcastNow`, by default in `app/Events` (configurable, and it extends the shared `CoreCollector`, so it supports `included` / `excluded` / `additional_directories` and `#[TsExclude]` — see [Filtering & Excluding](#filtering--excluding)).
- Each event class is statically analyzed by the package's own [analyzer](https://tolki.abe.dev/ts/analyzer-api.html) to resolve its payload shape — see [Property Resolution](#property-resolution-broadcastwith-vs-public-properties).
- One `.ts` file is written per event, at a namespace-derived path mirroring the event's FQCN (just like models and enums).
- After every event file is generated, `BroadcastEventsIndexWriter` combines them into a single `broadcast-events.ts` index — see [The Combined Index File](#the-combined-index-file-broadcast-eventsts).
- Optionally, `BroadcastEventsEchoWriter` generates `echo-broadcast-events.d.ts`, a module augmentation for Laravel Echo — see [Echo Module Augmentation](#echo-module-augmentation).

### Anatomy of a Generated Event File

Given this event:

```php
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("orders.{$this->orderId}");
    }
}
```

The package generates `app/events/OrderShipped.ts`:

```typescript
/** @see App\Events\OrderShipped */
export interface OrderShipped {
  orderId: number;
  trackingNumber: `${string}-${string}-${string}`;
  carrier: string;
  metadata?: Record<string, unknown>;
}
```

- The **interface name** is always the event's short PHP class name.
- A `@see` JSDoc comment links back to the fully-qualified PHP class.
- Public properties become required fields. A nullable property is typed `| null`; nullability alone never makes a key optional.
- Here, `trackingNumber`'s template-literal type, `metadata`'s `Record<string, unknown>` type, and the `?` on `metadata` all come from a `#[TsCasts]` override on the class — see [`#[TsCasts]`](#tscasts-overriding-property-types) below. Without it, both properties would be their raw inferred types (`string` and `unknown[] | null`), and `metadata` would be required.

### Property Resolution: `broadcastWith()` vs. Public Properties

By default, every public property becomes an interface field, in declaration order — constructor-promoted parameters and class-body declarations alike. A `@var` docblock wins over the native type, so `/** @var list<string> */ public array $tags` is typed `string[]` rather than `unknown[]`. Every trait-declared property is skipped, whatever the trait — reflection reports them as the event's own, so nothing distinguishes them, and a [`#[TsExtends]`](https://tolki.abe.dev/ts/extending-interfaces.html) trait's fields already arrive through the `extends` clause.

Define `broadcastWith()` to send (and type) a different shape — commonly to exclude private/internal fields:

```php
class TeamMessageSent implements ShouldBroadcast
{
    public function __construct(
        public int $teamId,
        public string $content,
        private string $senderToken,
    ) {}

    /**
     * @return array{teamId: int, content: string}
     */
    public function broadcastWith(): array
    {
        return [
            'teamId' => $this->teamId,
            'content' => $this->content,
        ];
    }

    public function broadcastOn(): Channel
    {
        return new Channel("teams.{$this->teamId}");
    }
}
```

```typescript
/** @see Workbench\App\Events\TeamMessageSent */
export interface TeamMessageSent {
  teamId: number;
  content: string;
}
```

`senderToken` never appears in the generated interface. The analyzer reads `broadcastWith()`'s body, resolving each `$this->…` reference against the event's own declared properties, so the `@return array{teamId: int, content: string}` docblock above is documentation rather than a requirement — the same interface comes out without it.

When `broadcastWith()` exists it is the only source of the payload; the public properties are not consulted at all. A key it renames, computes, or drops is reflected exactly, so `['team' => $this->teamId, 'kind' => 'message', 'count' => count($this->items)]` becomes `{ team: number; kind: string; count: number }` with no `teamId` in sight.

### Model & Enum-Aware Properties

Properties typed as an Eloquent model or a PHP enum resolve to the same types used elsewhere in the package, with imports added automatically:

```php
class MultiModelEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Post $post,
        public readonly User $user,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("multi.{$this->post->id}");
    }
}
```

```typescript
import type { Post, User } from "../models";

/** @see Workbench\App\Events\MultiModelEvent */
export interface MultiModelEvent {
  post: Partial<Post>;
  user: Partial<User>;
}
```

- An **Eloquent model** property resolves to `Partial<Model>` (partial, since a broadcast payload may not include every column) with an automatic import from the generated [models](https://tolki.abe.dev/ts/models.html) output.
- A **PHP enum** property resolves to the enum's `{Name}Type` alias (its raw backing-value type) with an automatic import from the generated [enums](https://tolki.abe.dev/ts/enums.html) output. An enum renamed with [`#[TsEnum]`](https://tolki.abe.dev/ts/enums.html#tsenum) keeps that rename here, so the alias always names a type the enum output actually declares:

```php
class EnumBroadcastEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Status $status,
        public readonly Color $color,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('enum-events');
    }
}
```

```typescript
import type { ColorType, StatusType } from "../enums";

/** @see Workbench\App\Events\EnumBroadcastEvent */
export interface EnumBroadcastEvent {
  status: StatusType;
  color: ColorType;
}
```

> [!TIP]
> When two properties (or two events combined into the index — see [import-conflict aliasing](#the-combined-index-file-broadcast-eventsts)) would import a same-named model or enum from different namespaces, each is automatically aliased with a namespace-derived prefix (e.g. `AppUser` / `CrmUser`) so both imports coexist without a collision.

### Custom Echo Event Names with `broadcastAs()`

By default, the Echo event name is Laravel's own `.Fully.Qualified.ClassName` convention (leading dot, backslashes replaced with dots). Override it with `broadcastAs()`:

```php
class ServerCreated implements ShouldBroadcast
{
    public function __construct(
        public int $serverId,
        public string $serverName,
    ) {}

    public function broadcastAs(): string
    {
        return 'server.created';
    }

    public function broadcastOn(): Channel
    {
        return new Channel('servers');
    }
}
```

```typescript
/** @see Workbench\App\Events\ServerCreated */
export interface ServerCreated extends BroadcastableEvent {
  serverId: number;
  serverName: string;
}
```

The literal string returned by `broadcastAs()` (`'server.created'`) becomes this event's key everywhere it's referenced — the `BroadcastEvent` union member, the `BroadcastEvents` const value, and the Echo augmentation key. Without `broadcastAs()`, it would instead be `'.Workbench.App.Events.ServerCreated'`.

`broadcastAs()` has to return one whole string literal for that to happen. A name built at runtime — `return 'order.'.$this->kind;` — has no single value to publish, so the event falls back to the `.Fully.Qualified.ClassName` convention. The alternative is shipping the literal prefix `'order.'` as a key Echo will never receive, which is worse than a key you can predict.

(The `extends BroadcastableEvent` here comes from a per-class `#[TsExtends]` attribute — see [Extending Interfaces](#extending-interfaces-global-config-vs-tsextends) below.)

### `#[TsCasts]` — Overriding Property Types

Override an inferred type, or add a virtual property, the same way as [models](https://tolki.abe.dev/ts/models.html#tscasts) and [form requests](https://tolki.abe.dev/ts/form-requests.html):

```php
#[TsCasts([
    'trackingNumber' => '`${string}-${string}-${string}`',
    'metadata' => ['type' => 'Record<string, unknown>', 'optional' => true],
])]
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    // ...
}
```

This is what produces `trackingNumber`'s template-literal type and `metadata`'s `Record<string, unknown>` type in the [Anatomy](#anatomy-of-a-generated-event-file) example above. As with models and resources, each entry can be a plain type string, or an array with `type`, `optional`, and/or `import` keys for a custom type that needs its own import statement.

### Extending Interfaces: Global Config vs. `#[TsExtends]`

Every generated event interface can `extends` one or more shared interfaces, using either mechanism (both apply together when present):

**Global config** — applies to _every_ generated event, via `ts_extends.broadcast_events` in `config/ts-publish.php`:

```php
// config/ts-publish.php
'ts_extends' => [
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

```typescript
import type { HasTimestamps } from "@/types/common";

/** @see Workbench\App\Events\UserNotification */
export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

**`#[TsExtends]` attribute** — applies to one specific event class:

```php
#[TsExtends('BroadcastableEvent', '@/types/broadcast')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

See [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces.html) for the full attribute and config syntax.

### The Combined Index File (`broadcast-events.ts`)

After every event file is generated, they're combined into a single index:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { MultiModelEvent } from "./app/events/MultiModelEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";
import type { TeamMessageSent } from "./app/events/TeamMessageSent";
import type { UserSynced as CrmUserSynced } from "./crm/events/UserSynced";
import type { UserSynced as AppUserSynced } from "./app/events/UserSynced";

export type BroadcastEvent =
  | ".Workbench.App.Events.EnumBroadcastEvent"
  | ".Workbench.App.Events.MultiModelEvent"
  | ".Workbench.App.Events.OrderShipped"
  | "server.created"
  | ".Workbench.App.Events.TeamMessageSent"
  | ".Workbench.Crm.Events.UserSynced"
  | ".Workbench.App.Events.UserSynced";

export const BroadcastEvents = Object.freeze({
  EnumBroadcastEvent: ".Workbench.App.Events.EnumBroadcastEvent",
  MultiModelEvent: ".Workbench.App.Events.MultiModelEvent",
  OrderShipped: ".Workbench.App.Events.OrderShipped",
  ServerCreated: "server.created",
  TeamMessageSent: ".Workbench.App.Events.TeamMessageSent",
  CrmUserSynced: ".Workbench.Crm.Events.UserSynced",
  AppUserSynced: ".Workbench.App.Events.UserSynced",
} as const);

export type {
  EnumBroadcastEvent,
  MultiModelEvent,
  OrderShipped,
  ServerCreated,
  TeamMessageSent,
  CrmUserSynced,
  AppUserSynced,
};
```

- **`BroadcastEvent`** is a union of every event's Echo name (its `broadcastAs()` string, or the default dot-FQCN).
- **`BroadcastEvents`** is a flat, frozen const mapping each event's short class name to its Echo name — flat, unlike [Wayfinder](https://github.com/laravel/wayfinder)'s deeply-nested namespace tree, since events are addressed by "what event is this?" rather than by where they live in the codebase.
- Every event's interface is also re-exported from the index, so you can import either from the index or directly from the per-event file.
- **Import-conflict aliasing**: when two different event classes share the same short name (like `App\Events\UserSynced` and `Crm\Events\UserSynced` above), both the import and the const key are aliased with a namespace-derived prefix (`AppUserSynced` / `CrmUserSynced`) so both coexist without a collision — the same conflict-resolution strategy used for [model/enum property imports](#model--enum-aware-properties) within a single event file.

An empty event set (no `ShouldBroadcast` classes found) produces `export {};` instead.

### Echo Module Augmentation

When `broadcast_events.echo_augmentation.enabled` is `true` (the default), the package also writes `echo-broadcast-events.d.ts`:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";

declare module "@laravel/echo" {
  interface Events {
    ".Workbench.App.Events.EnumBroadcastEvent": EnumBroadcastEvent;
    ".Workbench.App.Events.OrderShipped": OrderShipped;
    "server.created": ServerCreated;
  }
}
```

This augments Laravel Echo's own `Events` interface, so `Echo.private(channel).listen(eventName, ...)` and `useEcho()` (from `@laravel/echo-vue` / `@laravel/echo-react`) infer the correct payload type from the event name string, with no manual type annotation needed.

The `declare module` target is resolved with this priority:

1. `broadcast_events.echo_augmentation.echo_package` config value, if set.
2. Auto-detected from your `package.json` dependencies — `@laravel/echo-vue`, then `@laravel/echo-react`, then `@laravel/echo-svelte`.
3. Falls back to `@laravel/echo` (the base package every Echo setup depends on).

The same import-conflict aliasing described above applies here too, so identically-named events from different namespaces resolve correctly.

### Filtering & Excluding

Broadcast events support the same discovery controls as enums, models, and form requests:

```php
// config/ts-publish.php
'broadcast_events' => [
    'included' => [],               // only these event classes (empty = all)
    'excluded' => [],                // exclude these event classes
    'additional_directories' => [],  // extra directories beyond app/Events
],
```

`#[TsExclude]` also works at the class level, since `BroadcastEventsCollector` extends the shared `CoreCollector`:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Entirely excluded from collection and publishing.
}
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full attribute reference.

### Configuration Reference

The full list of `broadcast_events.*` config keys — including the Echo augmentation sub-options and pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Casing Configurations

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) provides three independent config options to control the casing of generated property and method names — one for model relationship names, one for enum method names, and one for route action names. All three accept `'snake'`, `'camel'`, or `'pascal'`, and each only affects its own feature; there's no single global casing setting.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), these are plain config values with no attribute or runtime component involved.

### `models.relationship_case`

Controls relationship names in generated model TypeScript interfaces — see [Models](https://tolki.abe.dev/ts/models.html) for the full relation-generation behavior.

```php
// config/ts-publish.php

'models' => [
    'relationship_case' => 'snake', // default
],
```

| Config Value | Relationship `hasMany(Post::class)` | Count         | Exists         |
| ------------ | ----------------------------------- | ------------- | -------------- |
| `'snake'`    | `posts: Post[]`                     | `posts_count` | `posts_exists` |
| `'camel'`    | `posts: Post[]`                     | `postsCount`  | `postsExists`  |
| `'pascal'`   | `Posts: Post[]`                     | `PostsCount`  | `PostsExists`  |

> [!NOTE]
> For each relationship defined on a model, this package automatically generates `_count` and `_exists` properties alongside the relation itself. These correspond to [Laravel's `withCount` and `withExists`](https://laravel.com/docs/eloquent-relationships#counting-related-models) features and are included in every generated model interface.

### `enums.method_case`

Controls the casing of enum method and static method key names in the generated TypeScript output — see [Enums](https://tolki.abe.dev/ts/enums.html) for the full method-inclusion behavior (`#[TsEnumMethod]`, `#[TsEnumStaticMethod]`, and the `auto_include_methods` / `auto_include_static_methods` config).

```php
// config/ts-publish.php

'enums' => [
    'method_case' => 'camel', // default
],
```

| Config Value | Method `getLabel()` | Static Method `AllLabels()` |
| ------------ | ------------------- | --------------------------- |
| `'snake'`    | `get_label`         | `all_labels`                |
| `'camel'`    | `getLabel`          | `allLabels`                 |
| `'pascal'`   | `GetLabel`          | `AllLabels`                 |

> [!TIP]
> This setting applies to all enum methods — both instance methods (via `#[TsEnumMethod]` or `enums.auto_include_methods`) and static methods (via `#[TsEnumStaticMethod]` or `enums.auto_include_static_methods`). You can still override an individual method's name using the `name` parameter on the attribute, regardless of this setting.

### `routes.method_casing`

Controls the casing of each generated route action's exported identifier — see [Routing](https://tolki.abe.dev/ts/routing.html) for the full route-generation behavior. This only affects the generated variable/export name; it never changes the underlying Laravel route name (`route()`/`Ziggy` calls still use the original route name).

```php
// config/ts-publish.php

'routes' => [
    'method_casing' => 'camel', // default
],
```

| Config Value | Controller method `updateProfile()` | Controller method `store()` |
| ------------ | ----------------------------------- | --------------------------- |
| `'snake'`    | `update_profile`                    | `store`                     |
| `'camel'`    | `updateProfile`                     | `store`                     |
| `'pascal'`   | `UpdateProfile`                     | `Store`                     |

> [!NOTE]
> If the casing transformation produces a reserved JavaScript/TypeScript keyword (e.g. a method named `delete`), the export name is automatically suffixed with `Method` (e.g. `deleteMethod`) to stay a valid identifier.

### Configuration Reference

| Config Key                 | Type     | Default   | Description                                                         |
| -------------------------- | -------- | --------- | ------------------------------------------------------------------- |
| `models.relationship_case` | `string` | `'snake'` | Casing for relation names and their `_count` / `_exists` properties |
| `enums.method_case`        | `string` | `'camel'` | Casing for enum instance/static method key names                    |
| `routes.method_casing`     | `string` | `'camel'` | Casing for each route action's exported identifier                  |

The full list of `models.*`, `enums.*`, and `routes.*` config keys lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Enum API Resource

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) ships with `EnumResource` — a Laravel [JSON resource](https://laravel.com/docs/eloquent-resources) that transforms a single PHP enum case into a flat, API-friendly array. It runs the enum through the exact same `EnumTransformer` pipeline used by `ts:publish`, so every `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` you've configured for TypeScript generation is automatically included in the JSON response too — no separate API-serialization logic to maintain.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), the companion `AsEnum` TypeScript type (from `@tolki/ts`) is what gives you full type safety when consuming a response produced by this class — see [Typing API Responses with `AsEnum`](#typing-api-responses-with-asenum) below.

### Basic Usage

Return an enum case directly from a controller or route:

```php
use AbeTwoThree\LaravelTsPublish\EnumResource;
use App\Enums\Status;

return new EnumResource(Status::Published);
```

Or embed it inside another resource's `toArray()` to transform an enum-cast model property (or any enum case, not just model properties):

```php
namespace App\Http\Resources;

use AbeTwoThree\LaravelTsPublish\EnumResource;
use App\Enums\MembershipLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // Assuming "status" is a model property cast to the Status enum
            'status' => new EnumResource($this->status),
            // Can also create enum resources from any enum case, not just model properties
            'membership_level' => new EnumResource(MembershipLevel::Free),
        ];
    }
}
```

> [!TIP]
> Inside an API Resource's `toArray()`, you'll typically use the static `EnumResource::make($this->status)` form instead — this is also what generates the `AsEnum<typeof Status>` TypeScript property type automatically. See [Enum Properties with `EnumResource`](https://tolki.abe.dev/ts/api-resources.html#enum-properties-with-enumresource) in the API Resources docs.

`EnumResource` disables Laravel's default resource wrapping (`public static $wrap = ''`), so the response is the flat object shown below — not wrapped in a `data` key. If the enum is `null`, the resource resolves to `null` rather than an array.

### Response Shape

Every response includes these base keys, resolved from the matching case's (possibly `#[TsCase]`-overridden) name and value:

| Key      | Type            | Description                                       |
| -------- | --------------- | ------------------------------------------------- |
| `name`   | `string`        | The enum case name                                |
| `value`  | `string \| int` | The backed value, or the case name for unit enums |
| `backed` | `bool`          | Whether the enum is a backed enum                 |

```json
{
  "name": "Published",
  "value": 1,
  "backed": true,
  "icon": "check",
  "color": "green"
}
```

Instance methods (decorated with `#[TsEnumMethod]`, or included automatically via `enums.auto_include_methods`) are flattened as top-level keys, with the resolved value computed **for the specific case instance** passed to the resource — the same invocation results already computed once per case during TypeScript generation. Static methods (`#[TsEnumStaticMethod]` / `enums.auto_include_static_methods`) are included as top-level keys with the static method's return value.

This means an `EnumResource` response always mirrors the shape of the published TypeScript enum for that case — calling `.from()` on the generated enum with the matching value produces an object with the identical keys.

### Unit Enums

Unit enums (enums without a backed type) are fully supported. Since they have no backed value, `value` mirrors the case `name`, and `backed` is `false`:

```php
return new EnumResource(Role::Admin);
```

```json
{
  "name": "Admin",
  "value": "Admin",
  "backed": false
}
```

### Relationship to TypeScript Publishing

`EnumResource` uses the same `EnumTransformer` pipeline as the `ts:publish` command — see [Enums](https://tolki.abe.dev/ts/enums.html) for the full attribute/auto-include reference. This means:

- Only methods marked with `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` (or all public methods, when auto-include is enabled) are included.
- Methods with required parameters but no `params` on the attribute are excluded.
- The `enums.method_case` config setting applies to the method key names in the response — see [Casing Configurations](https://tolki.abe.dev/ts/casing-configuration.html).
- `#[TsExclude]` on a method excludes it from both the TypeScript output and the API response identically — see [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html).

This guarantees the JSON response shape is always consistent with the TypeScript types this package generates — there's no separate serialization logic to keep in sync.

### Typing API Responses with `AsEnum`

The `@tolki/ts` package exports an `AsEnum` utility type that resolves the exact `EnumResource` JSON response shape for any published enum, giving you full type safety when consuming enum API responses on the frontend.

```typescript
import type { AsEnum } from "@tolki/ts";
import type { Status } from "@/types/enums";

// Full discriminated union of all cases
type StatusResponse = AsEnum<typeof Status>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
// | { name: 'Published'; value: 1; backed: true; icon: 'check'; color: 'green'; ... }
```

The optional second type parameter pre-narrows to a specific case by value:

```typescript
// Narrowed to a single case
type DraftResponse = AsEnum<typeof Status, 0>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
```

Use it to type your API responses directly:

```typescript
const response = await fetch(`/api/articles/${id}`);
const article: { id: number; status: AsEnum<typeof Status> } =
  await response.json();

if (article.status.value === 0) {
  // TypeScript knows this is the Draft case
  console.log(article.status.icon); // 'pencil'
}
```

See [Type Reference](https://tolki.abe.dev/ts/enums.html#type-reference) in the Enums docs for the full `AsEnum` signature alongside every other `@tolki/ts` export.

### Auto-Generated `{Model}Resource` Interfaces

When `enums.use_tolki_package` is enabled (the default), any model with enum-cast columns automatically gets a `{Model}Resource` companion set of interfaces. These replace each enum-backed property with `AsEnum<typeof EnumName>`, so you don't have to hand-compose `Omit<>` + `AsEnum<>` yourself whenever a property has been resolved to a full enum instance — whether via `Status::from($user->status)` in your own code, or because an API response already serialized it with `EnumResource`.

For a `Post` model that casts the database columns `status`, `visibility`, and `priority` to enums:

```typescript
export interface Post {
  id: number;
  title: string;
  content: string;
  status: StatusType; // Original enum type
  visibility: VisibilityType | null; // Original enum type
  priority: PriorityType | null; // Original enum type
}

// Auto-generated — no manual typing needed
export interface PostResource extends Omit<
  Post,
  "status" | "visibility" | "priority"
> {
  status: AsEnum<typeof Status>;
  visibility: AsEnum<typeof Visibility> | null;
  priority: AsEnum<typeof Priority> | null;
}
```

```typescript
import type { PostResource } from "@js/types/data/models";

const response = await fetch("/api/posts/1");
const post: PostResource = await response.json();

post.status.value; // 0 | 1
post.status.icon; // 'pencil' | 'check'
```

The interfaces are generated for both the `model-full` and `model-split` templates. In split mode, a `PostResource` interface is generated alongside the properties interface, and a separate `PostMutatorsResource` interface alongside the mutators interface, since mutators can also be enum-cast:

```typescript
export interface PostResource extends Omit<
  Post,
  "status" | "visibility" | "priority"
> {
  status: AsEnum<typeof Status>;
  // ...
}

export interface PostMutators {
  due_notice: DueAtNoticeType;
}

export interface PostMutatorsResource extends Omit<PostMutators, "due_notice"> {
  due_notice: AsEnum<typeof DueAtNotice>;
}
```

Naming conflicts are handled automatically — if two enum FQCNs share the same base name, namespace-prefixed aliases are used for both the type and const imports (e.g. `AppStatus`, `CrmStatus`). See [Enum-Typed Columns](https://tolki.abe.dev/ts/models.html#enum-typed-columns-modelresource) in the Models docs for the base/resolved interface distinction in full detail.

### Configuration Reference

`EnumResource` has no dedicated config of its own — it reuses the same `enums.*` settings (`method_case`, `auto_include_methods`, `auto_include_static_methods`) documented in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Excluding Content

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can exclude a specific enum, model, resource, form request, broadcast event, or controller — or one of their individual methods, accessors, relations, or actions — from the TypeScript output entirely, using the `#[TsExclude]` attribute.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), this is a lightweight, attribute-only mechanism — there's no runtime component from `@tolki/ts` involved.

### `#[TsExclude]` Attribute

```php
namespace AbeTwoThree\LaravelTsPublish\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class TsExclude {}
```

It takes no parameters — applying it to a class or method is enough to exclude that target. It can be placed on:

| Target                | Effect                                                            |
| --------------------- | ----------------------------------------------------------------- |
| Enum class            | Entire enum is excluded from collection and publishing            |
| Enum method           | Method is excluded from the TypeScript output                     |
| Model class           | Entire model is excluded from collection and publishing           |
| Model accessor        | Mutator/accessor is excluded from the TypeScript output           |
| Model relation        | Relation is excluded from the TypeScript output                   |
| Resource class        | Entire resource is excluded from collection and publishing        |
| Form Request class    | Entire form request is excluded from collection and publishing    |
| Broadcast Event class | Entire broadcast event is excluded from collection and publishing |
| Controller class      | Entire controller is excluded from collection and publishing      |
| Controller action     | The action is excluded from the generated route file              |

> [!NOTE]
> `#[TsExclude]` always wins. Even when an explicit inclusion attribute like `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` is also present, or when `enums.auto_include_methods` / `enums.auto_include_static_methods` would otherwise include a method automatically, `#[TsExclude]` takes priority and the member is left out.

### How It's Enforced

Every collector for a per-class type (enums, models, resources, form requests, broadcast events, controllers) extends the shared `CoreCollector`, which filters out any class carrying `#[TsExclude]` **before** it's ever handed to a transformer — an excluded class is never analyzed, never written to disk, and never appears in a barrel `index.ts`. This is why class-level exclusion has no config equivalent: there's nothing partial about it.

Method/accessor/relation/action-level exclusion is checked independently by each transformer, on the specific reflected method — this is what allows the rest of the class to publish normally while one member is omitted.

Broadcast Channels is the one feature that does **not** support `#[TsExclude]` — it collects plain channel-name strings from `routes/channels.php` rather than reflecting PHP classes, so there's no class or method to attach the attribute to. See [Broadcast Channels](https://tolki.abe.dev/ts/broadcast-channels.html#no-per-channel-attributes) for how to omit a channel instead.

### Excluding an Entire Class

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
enum ExcludedEnum: string
{
    case Foo = 'foo';
    case Bar = 'bar';
}
```

`ExcludedEnum` is skipped entirely during collection — it never appears in any generated `.ts` file, and it's absent from the enums barrel `index.ts`. The same applies to models, resources, form requests, broadcast events, and controllers:

```php
#[TsExclude]
class ExcludedModel extends Model
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalResource extends JsonResource
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalRequest extends FormRequest
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Entirely excluded from collection and publishing.
}

#[TsExclude]
class ExcludedController
{
    public function index(): void {}

    // No routes for this controller are published, regardless of this method.
}
```

### Excluding Enum Methods

`#[TsExclude]` on a method wins even when the method also carries an explicit inclusion attribute:

```php
enum ExcludableEnum: string
{
    case Alpha = 'alpha';
    case Beta = 'beta';

    /** Included — no exclusion attribute */
    public function label(): string
    {
        return match ($this) {
            self::Alpha => 'Alpha Label',
            self::Beta => 'Beta Label',
        };
    }

    /** Excluded via #[TsExclude] — should not appear in TS output */
    #[TsExclude]
    public function secret(): string
    {
        return 'hidden';
    }

    /** Excluded — #[TsExclude] wins over #[TsEnumMethod] */
    #[TsEnumMethod]
    #[TsExclude]
    public function overridden(): string
    {
        return 'should not appear';
    }

    /** Excluded via #[TsExclude] — should not appear in TS output */
    #[TsExclude]
    public static function internalOnly(): array
    {
        return ['internal'];
    }

    /** Excluded — #[TsExclude] wins over #[TsEnumStaticMethod] */
    #[TsEnumStaticMethod]
    #[TsExclude]
    public static function overriddenStatic(): array
    {
        return ['should not appear'];
    }
}
```

Generates (with `enums.auto_include_methods` off, the default):

```typescript
import { defineEnum } from "@tolki/ts";

export const ExcludableEnum = defineEnum({
  Alpha: "alpha",
  Beta: "beta",
  backed: true,
  _cases: ["Alpha", "Beta"],
} as const);

export type ExcludableEnumType = "alpha" | "beta";
export type ExcludableEnumKind = "Alpha" | "Beta";
```

`overridden()` and `overriddenStatic()` both carry an explicit `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` attribute — which would normally include them regardless of the `auto_include` config — but since they're _also_ decorated with `#[TsExclude]`, neither appears in the output at all. See [Enums](https://tolki.abe.dev/ts/enums.html) for the full method-inclusion behavior.

### Excluding Model Accessors and Relations

```php
class ExcludableModel extends Model
{
    /** Included mutator — should appear in TS output */
    protected function displayName(): Attribute
    {
        return Attribute::make(get: fn (): string => strtoupper($this->name ?? ''));
    }

    /** Excluded mutator — should NOT appear in TS output */
    #[TsExclude]
    protected function secretToken(): Attribute
    {
        return Attribute::make(get: fn (): string => 'hidden-token');
    }

    /** Included relation — should appear in TS output */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    /** Excluded relation — should NOT appear in TS output */
    #[TsExclude]
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'user_id');
    }

    /** Excluded old-style mutator — should NOT appear in TS output */
    #[TsExclude]
    public function getLegacyTokenAttribute(): string
    {
        return 'old-style-hidden';
    }
}
```

Generates:

```typescript
export interface ExcludableModel {
  id: number;
  name: string;
  // ... remaining database columns
}

export interface ExcludableModelMutators {
  /** Included mutator — should appear in TS output */
  display_name: string;
}

export interface ExcludableModelRelations {
  // Relations
  /** Included relation — should appear in TS output */
  posts: Post[];
  // Counts
  posts_count: number;
  // Exists
  posts_exists: boolean;
}
```

`secretToken` and `comments` are both absent from `ExcludableModelMutators` / `ExcludableModelRelations`, and `getLegacyTokenAttribute` — the **old-style** `get{Name}Attribute()` accessor convention — is excluded the same way as the modern `Attribute::make()` style. See [Models](https://tolki.abe.dev/ts/models.html) for the full accessor/relation resolution rules.

### Excluding Controller Actions

```php
class ExcludableController
{
    /** This action is included */
    public function show(): void
    {
        // ...
    }

    /** This action is excluded */
    #[TsExclude]
    public function secret(): void
    {
        // ...
    }
}
```

Generates:

```typescript
import { defineRoute } from "@tolki/ts";

/** This action is included */
export const show = defineRoute({
  name: "excludable.show",
  url: "/excludable/{id}",
  methods: ["get"] as const,
  args: [{ name: "id", required: true }] as const,
});

/** @see Workbench\App\Http\Controllers\ExcludableController */
const ExcludableController = {
  show,
};

export default ExcludableController;
```

The `secret` action is entirely absent from the generated controller file, while `show` publishes normally. See [Routing](https://tolki.abe.dev/ts/routing.html#filtering--excluding-routes) for the full route-filtering reference (name patterns, middleware exclusion, and named-routes-only mode).

### Configuration Reference

`#[TsExclude]` has no config equivalent — it's an attribute-only mechanism. For the broader `included` / `excluded` / `additional_directories` filtering options available per feature, see that feature's own documentation ([Enums](https://tolki.abe.dev/ts/enums.html), [Models](https://tolki.abe.dev/ts/models.html), [API Resources](https://tolki.abe.dev/ts/api-resources.html), [Form Requests](https://tolki.abe.dev/ts/form-requests.html), [Broadcast Events](https://tolki.abe.dev/ts/broadcast-events.html), [Routing](https://tolki.abe.dev/ts/routing.html#filtering--excluding-routes)) or the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Extending Interfaces

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can add a TypeScript `extends` clause to any generated model, resource, form request, or broadcast event interface, so it can extend a hand-written interface for properties this package can't infer, or share common fields across many classes without duplication.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), this works alongside every other feature — [models](https://tolki.abe.dev/ts/models.html), [API resources](https://tolki.abe.dev/ts/api-resources.html), [form requests](https://tolki.abe.dev/ts/form-requests.html), and [broadcast events](https://tolki.abe.dev/ts/broadcast-events.html) all support it identically, since they share the same underlying mechanism.

There are two ways to add an `extends` clause, and both apply together when present:

1. The **`#[TsExtends]` attribute** — scoped to one class (and inherited by anything that extends or uses it).
2. The **`ts_extends.*` config array** — applied globally to every generated interface of that type.

### `#[TsExtends]` Attribute

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExtends;

#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class TsExtends
{
    public function __construct(
        public string $extends,
        public ?string $import = null,
        public ?array $types = null,
    ) {}
}
```

| Parameter | Type            | Default  | Description                                                                                                          |
| --------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `extends` | `string`        | required | The raw TypeScript extends clause — a plain interface name, or a generic wrapper like `Pick<X, "a"\|"b">`.           |
| `import`  | `?string`       | `null`   | The import path for the type(s) used in `extends`. Omit when the type is a global/ambient type that needs no import. |
| `types`   | `?list<string>` | `null`   | Explicit list of identifiers to import from `import`. When `null`, they're auto-extracted from `extends`.            |

`#[TsExtends]` is **repeatable** — stack as many as you need on the same class — and can be placed on:

- A model, resource, form request, or broadcast event class directly.
- Any **parent class** in its inheritance chain.
- Any **trait** used by the class or any of its parent classes.

Every `#[TsExtends]` attribute reachable from a class — its own, its traits', and (recursively) its parent classes' and their traits' — is combined into that class's single generated `extends` clause.

### Multiple Attributes & Named Arguments

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExtends;

#[TsExtends('HasTimestamps', import: '@/types/common')]
#[TsExtends('Pick<Auditable, "created_by" | "updated_by">', import: '@/types/audit', types: ['Auditable'])]
class Warehouse extends Model
{
    // ...
}
```

Generates:

```typescript
import type { Auditable } from "@/types/audit";
import type { HasTimestamps } from "@/types/common";

export interface Warehouse
  extends HasTimestamps, Pick<Auditable, "created_by" | "updated_by"> {
  // ... columns, mutators, relations
}
```

Notice that `types` is only needed for the `Pick<Auditable, ...>` entry — `HasTimestamps` has no `types` array because when `types` is omitted (`null`), the package auto-extracts the identifier(s) to import directly from the `extends` string. You only need `types` when the extends string wraps the imported type in a generic like `Pick<>`/`Omit<>`/`Partial<>`, where auto-extraction can't reliably isolate the type name.

An entry with no `import` at all (just `extends`) is treated as an ambient/global type that's already available without an import — useful for a type declared in your own global `.d.ts` file.

### Inheriting from Parent Classes & Traits

`#[TsExtends]` attributes on a parent class or a trait are inherited by anything that extends or uses them. Here's a real fixture combining **three separate sources** — the resource's own attribute, a parent class's two attributes, and a trait's two attributes — into one generated `extends` clause:

```php
// The trait
#[TsExtends('ExtendableInterface')]
#[TsExtends('Omit<Timestamps, "created_at" | "updated_at">', '@/types/util', ['Timestamps'])]
trait ExtendsInterfaces {}
```

```php
// The parent class
#[TsExtends('ResourceRoutes', '@/types/resources')]
#[TsExtends('Pick<Routable, "store" | "update">', '@/types/routing', ['Routable'])]
class RoutableResource extends JsonResource {}
```

```php
// The resource itself — extends RoutableResource, uses ExtendsInterfaces, and adds its own attribute
#[TsExtends('BaseResource', import: '@/types/base')]
class WarehouseResource extends RoutableResource
{
    use ExtendsInterfaces;

    public function toArray(Request $request): array
    {
        return [/* ... */];
    }
}
```

All five `#[TsExtends]` attributes — one on `WarehouseResource` itself, two on the `ExtendsInterfaces` trait, and two on the `RoutableResource` parent — are combined into a single `extends` clause:

```typescript
import type { BaseResource } from "@/types/base";
import type { ResourceRoutes } from "@/types/resources";
import type { Routable } from "@/types/routing";
import type { Timestamps } from "@/types/util";

export interface WarehouseResource
  extends
    BaseResource,
    ExtendableInterface,
    Omit<Timestamps, "created_at" | "updated_at">,
    ResourceRoutes,
    Pick<Routable, "store" | "update"> {
  // ... resource properties
}
```

### Deduplication

When the same `#[TsExtends]` attribute is reachable through more than one path — for example, a trait used by both a parent class and its child — it's only added to the `extends` clause **once**:

```php
#[TsExtends('SharedInterface', '@/types/shared')]
trait SharedExtendsInterface {}
```

```php
class BaseSharedResource extends JsonResource
{
    use SharedExtendsInterface;
}

class ChildSharedResource extends BaseSharedResource
{
    use SharedExtendsInterface;
}
```

Even though `ChildSharedResource` reaches `SharedExtendsInterface` through two paths — its own `use` statement and inheriting it again from `BaseSharedResource` — `SharedInterface` only appears once in the generated interface:

```typescript
import type { SharedInterface } from "@/types/shared";

export interface ChildSharedResource extends SharedInterface {}
```

### Global Config: `ts_extends.*`

To extend a shared interface across _every_ generated interface of a given type, without adding `#[TsExtends]` to each class individually, use the `ts_extends` config array. It has one key per supported type — `models`, `resources`, `form_requests`, and `broadcast_events`:

```php
// config/ts-publish.php

'ts_extends' => [
    'models' => [
        'HasTimestamps',
        ['extends' => 'BaseFields', 'import' => '@/types/base'],
        ['extends' => 'Pick<Auditable, "created_by">', 'import' => '@/types/audit', 'types' => ['Auditable']],
    ],
    'resources' => [
        ['extends' => 'BaseResource', 'import' => '@/types/base'],
    ],
    'form_requests' => [
        //
    ],
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

Each entry can be a plain string (a simple, import-free extends clause) or an array with `extends`, `import`, and optionally `types` keys — the same shape as the `#[TsExtends]` attribute's parameters.

Config-level entries combine with `#[TsExtends]` attributes on that same generated interface, and are deduplicated the same way. Take the real `broadcast_events` config entry above — `['extends' => 'HasTimestamps', 'import' => '@/types/common']` — alongside this real event, which uses a trait carrying the _identical_ attribute:

```php
class UserNotification implements ShouldBroadcast
{
    use HasBroadcastTimestamps; // #[TsExtends('HasTimestamps', '@/types/common')]

    public function __construct(
        public int $userId,
        public string $title,
        public string $message,
    ) {}
}
```

Since the config entry and the trait's attribute resolve to the exact same `(extends, import)` pair, they're deduplicated into a single `extends HasTimestamps` — not a duplicate:

```typescript
import type { HasTimestamps } from "@/types/common";

export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

### Naming Conflicts & Aliasing

Occasionally, two different `#[TsExtends]` entries (from any combination of attributes, traits, parent classes, or config) use the **same type name** but import it from **different paths**. Rather than silently colliding, the second occurrence is aliased using its import path's last segment as a prefix, and the extends clause is rewritten to use the alias:

```php
// Both entries reference a type named "Routable", but from different import paths
#[TsExtends('Routable', '@/types/routing')]
#[TsExtends('Routable', '@/types/legacy-routing')]
class Example { /* ... */ }
```

```typescript
import type { Routable } from "@/types/routing";
import type { Routable as RoutingRoutable } from "@/types/legacy-routing";

export interface Example extends Routable, RoutingRoutable {}
```

The deduplication and conflict-resolution rules, in order:

1. Identical `(extends, import)` pairs from any source (attribute, trait, parent class, or config) are kept once.
2. The same type name imported from the same path — across different extends clauses — produces a single import statement.
3. The same type name imported from two _different_ paths gets the second (and subsequent) occurrences aliased, and the affected extends clause(s) rewritten to reference the alias.

### Configuration Reference

| Config Key                    | Type    | Default | Description                                               |
| ----------------------------- | ------- | ------- | --------------------------------------------------------- |
| `ts_extends.models`           | `array` | `[]`    | Global `extends` clauses applied to every model           |
| `ts_extends.resources`        | `array` | `[]`    | Global `extends` clauses applied to every resource        |
| `ts_extends.form_requests`    | `array` | `[]`    | Global `extends` clauses applied to every form request    |
| `ts_extends.broadcast_events` | `array` | `[]`    | Global `extends` clauses applied to every broadcast event |

## Form Requests

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) statically analyzes each `FormRequest`'s `rules()` method and converts it into a TypeScript interface describing the request payload — so the shape of a `useForm()` call, an Axios body, or a route's [request payload type](https://tolki.abe.dev/ts/routing.html#form-request-payload-types) always matches your actual validation rules.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), form requests don't need the `@tolki/ts` runtime package — the output is a plain TypeScript interface (or a `Record<string, unknown>` type alias for [dynamic requests](#dynamic-requests)).

### How Form Request Types Are Generated

- One `.ts` file is generated per `FormRequest` class, at a modular, namespace-derived path (e.g. `App\Http\Requests\StorePostRequest` → `app/http/requests/store-post-request.ts`).
- Barrel `index.ts` files re-export everything (`export * from './store-post-request'`) per namespace directory, the same as [enums](https://tolki.abe.dev/ts/enums.html#how-enums-are-generated) and [models](https://tolki.abe.dev/ts/models.html#how-models-are-generated).
- The analyzer instantiates your `FormRequest` **without a real HTTP request or authenticated user** and calls `rules()` directly — it doesn't run a full validation pass, it just inspects the rule definitions you return.
- A fake stub user is bound during analysis so that `Auth::user()->someMethod()` calls inside `rules()` don't throw (the stub's `__call` returns `false` for any method) — this keeps rules that branch on `Auth::user()->isAdmin()`-style checks statically analyzable. Code that reads a property directly (`$this->user()->id`) or otherwise depends on real request state isn't covered by the stub and triggers the [dynamic fallback](#dynamic-requests) instead.

### Anatomy of a Generated Form Request

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
use Illuminate\Foundation\Http\FormRequest;

#[TsCasts([
    'tags' => 'string[]',
    'rating' => ['type' => 'number | bigint', 'optional' => true],
])]
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'published' => ['boolean'],
            'rating' => ['nullable', 'numeric'],
            'email' => ['required', 'email'],
            'tags' => ['array'],
            'tags.*' => ['string'],
        ];
    }
}
```

```typescript
/** @see Workbench\App\Http\Requests\StorePostRequest */
export interface StorePostRequest {
  title: string;
  body: string;
  published?: boolean;
  rating?: number | bigint | null;
  /** @format email */
  email: string;
  tags?: string[];
}
```

- `title` / `body` are required (the `required` rule), typed `string` (the `string` rule).
- `published` has no `required`/`sometimes` rule, so it's optional — even though `boolean` alone says nothing about presence.
- `rating` demonstrates that a [`#[TsCasts]`](#tscasts-overriding-field-types) override only replaces the _type_ and _optionality_ — the `nullable` rule's `| null` suffix is still appended by the analyzer afterward, giving `number | bigint | null` rather than just `number | bigint`.
- `email` picks up a [JSDoc metadata annotation](#jsdoc-metadata-annotations) (`@format email`) from the `email` rule.
- `tags` is upgraded from the bare `array` rule's `unknown[]` to `string[]` — first automatically (from the sibling `tags.*` wildcard rule), then explicitly overridden to the same value by `#[TsCasts]`.
- `tags.*` does **not** get a property of its own. A dot-notation or wildcard rule key describes a value _inside_ `tags`, so it composes into `tags` instead of being emitted alongside it as a quoted `"tags.*"` key — see [Array & Nested Rules](#array-nested-rules).
- The class docblock (none here) would become the interface's JSDoc comment; individual fields don't support their own docblocks since they come from array keys inside `rules()`, not separate PHP declarations — the [JSDoc metadata annotations](#jsdoc-metadata-annotations) fill that role instead.

### Rule-to-Type Mapping Reference

Rules are checked in this order — the first match wins:

1. `Rule::file()` / `Rule::dimensions()` (`File`/`Dimensions` objects) → **`File`**
2. `Rule::anyOf([...])` → union of each inner rule set's own resolved type
3. `Rule::enum(...)` → union of the enum's backing values (respects `.only()`/`.except()`)
4. `Rule::in(...)` / string `in:a,b,c` → union of literal values (quoted or unquoted — see [Numeric `in:` literals](#numeric-in-literals))
5. Fluent rule objects: `Rule::date()`, `Email`, `Password`, `StringRule` → `string`; `Numeric` → `number`; `Rule::array()`/`Contains`/`DoesntContain` → `unknown[]`; `Rule::notIn(...)` → `string`
6. String rule names (see table below)
7. Anything unrecognized → **`unknown`**

[Strings](#strings) [Numbers](#numbers) [Booleans](#booleans) [Files](#files) [Arrays](#arrays)

##### Strings

`string`, `alpha`, `alpha_dash`, `alpha_num`, `ascii`, `current_password`, `hex_color`, `json`, `date`, `date_equals`, `date_format`, `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `regex`, `not_regex` → **`string`**

##### Numbers

`integer`, `int`, `numeric`, `decimal`, `digits`, `digits_between` → **`number`**

##### Booleans

`boolean`, `accepted`, `accepted_if`, `declined`, `declined_if` → **`boolean`**

##### Files

`file`, `image`, `mimes`, `mimetypes`, `extensions` → **`File`**

##### Arrays

`array`, `list` → **`unknown[]`** (upgraded to `T[]` automatically when a sibling `field.*` wildcard rule resolves to type `T` — see [Array & Nested Rules](#array-nested-rules); upgraded to a keyed object instead when `required_array_keys`/`in_array_keys`/`array:`/`array_keys:` names its keys — see [Key-list rules](#key-list-rules-known-keys-without-a-full-shape))

#### Numeric `in:` literals

`Rule::in([1, 2, 3])` carries real integers, so it emits `1 | 2 | 3`. The string form can't: Laravel's own `ValidationRuleParser::parse()` hands `in:1,2,3` over as strings, so `'legacy_code' => ['string', 'in:1,2,3']` emits the quoted `'1' | '2' | '3'`.

A sibling rule declaring the field numeric is the signal that flips it to unquoted, and that list is exactly the [Numbers](#numbers) list above — `integer`, `int`, `numeric`, `decimal`, `digits`, `digits_between`:

```php
'priority_level' => ['required', 'integer', 'in:1,2,3'],      // 1 | 2 | 3
'digit_grade' => ['digits:1', 'in:1,2,3'],                    // 1 | 2 | 3
'decimal_tier' => ['decimal:1', 'in:1.5,2.5'],                // 1.5 | 2.5
'legacy_code' => ['required', 'string', 'in:1,2,3'],          // '1' | '2' | '3'
```

Previously only `integer`, `int` and `numeric` triggered the unquoted form, so `['digits:1', 'in:1,2,3']` typed as `number` from its own rule while still emitting `'1' | '2' | '3'` for the union — a field that could never satisfy both. One list now backs both checks.

**What to do:** nothing, unless you were comparing one of these fields against a quoted string literal. TypeScript will point at every site that needs `=== 1` instead of `=== '1'`.

Coercion is deliberately conservative even on a numeric field: a value only loses its quotes when it round-trips back to identical text. Laravel's `validateIn()` compares the raw string against the literal param, so a padded or reformatted value has to stay a string — emitting the normalized number would describe a value Laravel itself rejects.

```php
'padded_numeric_code' => ['required', 'numeric', 'in:007,2.50'],  // '007' | '2.50'
'padded_decimal_tier' => ['decimal:2', 'in:1.50,2.50'],           // '1.50' | '2.50'
```

### Presence, Nullability & Exclusion

| Rule                                                                                                 | Effect                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `required` (or any rule starting with `required`, including `Rule::requiredIf()`/`requiredUnless()`) | Field is **required** (no `?`)                                                                                                                                                         |
| `sometimes`                                                                                          | Field is optional, even combined with `required`                                                                                                                                       |
| `nullable`                                                                                           | Adds `\| null` to the field's type                                                                                                                                                     |
| `missing` / `prohibited`                                                                             | Field is **excluded from the interface entirely** — not just marked optional. A nested key is dropped from its parent's shape instead; see [Array & Nested Rules](#array-nested-rules) |

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string'],   // title: string;
        'slug' => ['sometimes', 'required', 'string'], // slug?: string;
        'notes' => ['nullable', 'string'],   // notes?: string | null;
        'internal_id' => ['prohibited'],     // omitted entirely
    ];
}
```

Fields with no `required`/`sometimes` rule at all (e.g. a bare `'published' => ['boolean']`) are optional by default — presence must be declared explicitly, just like in Laravel's own validation.

### Array & Nested Rules

Dot-notation (`meta.description`) and wildcard (`tags.*`) rule keys describe constraints on **nested values**, not top-level JSON keys you'd set directly. They compose into their nearest undotted ancestor and are never emitted as their own quoted property — `"order.id"?: string` would suggest you could send a literal `order.id` key, which Laravel's dot-notation validation never means:

```php
class ArrayRulesRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'tags' => ['array', 'min:1', 'max:10'],
            'tags.*' => ['required', 'string', 'max:50'],

            'selected_ids' => ['required', 'array', 'between:1,5'],
            'selected_ids.*' => ['required', 'integer'],

            'order' => ['required', 'array'],
            'order.id' => ['required', 'uuid'],
            'order.items' => ['required', 'array'],
            'order.items.*.product_id' => ['required', 'integer'],
        ];
    }
}
```

```typescript
export interface ArrayRulesRequest {
  tags?: string[];
  selected_ids: number[];
  /** @format uuid order.id */
  order: { id: string; items: { product_id: number }[] };
}
```

Nesting is unbounded — `order.items.*.product_id` composes through every one of its segments the same way `tags.*` composes through its one. The parent's own presence and nullability rules decide the parent's `?` and `| null` (`selected_ids` is required because its own rule says `required`), while each nested key's own rules decide its optionality inside the composed shape.

#### Nested edge cases

| Rules                                                                                        | Generated type                                            | Why                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'choices' => ['nullable','array']`<br>`'choices.*' => ['nullable','string']`                | `choices?: (string \| null)[] \| null`                    | The element's `nullable` folds into the element type; the array's own `nullable` stays on the array.                                                         |
| `'options' => ['array']`<br>`'options.*' => ['string']`<br>`'options.default' => ['string']` | `options?: { default?: string } & Record<string, string>` | A wildcard beside a named sibling is a map with some pinned keys — emitted as an intersection, which stays valid TypeScript even when the two halves differ. |
| `'meta' => ['array']`<br>`'meta.secret' => ['prohibited']`                                   | `meta?: Record<string, never>`                            | Every named key is prohibited, so no key is allowed — not an empty object you may add keys to.                                                               |
| `'empties' => ['array']`<br>`'empties.*' => ['prohibited']`                                  | `empties?: never[]`                                       | The element may never appear, so the array may never hold anything.                                                                                          |
| `'v1\.0' => ['required','string']`                                                           | `"v1.0": string`                                          | An escaped dot is a literal character in the attribute name, so it stays one field — quoted, since `.` isn't a bare identifier.                              |
| `'items' => ['array']`<br>`'items.0.name' => ['required','string']`                          | `items?: { name: string }[]`                              | Explicit numeric indices describe a list. `{ "0": … }` is a type no real JSON array is assignable to.                                                        |
| `'variants.0.name' => [...]`<br>`'variants.1.email' => [...]`                                | `variants?: ({ name: string } \| { email: string })[]`    | Indices with different shapes union, parenthesized so `[]` applies to the whole union rather than the last member.                                           |

A `prohibited`/`missing` rule on a nested key drops that key from its parent's shape, and drops its own descendants with it: `'order.secret' => ['prohibited']` alongside `'order.secret.token' => ['required','uuid']` leaves nothing of `secret` in `order`.

#### Key-list rules: known keys without a full shape

Four validation rules describe an array's keys without declaring a full nested shape for them.
Each declared key becomes a synthesized `unknown`-typed property instead of the array collapsing
to `unknown[]` — this is the fix for a `config` field that used to come out `unknown[]` even though
`in_array_keys:timezone` tells you exactly which key to expect. The rules differ in whether Laravel's
validator actually guarantees the key is present, and the emitted `?` follows that:

| Rule                      | Meaning                                                                                        | PHP                                                                      | TypeScript                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `required_array_keys:a,b` | all listed keys must be present                                                                | `'permissions' => ['required','array','required_array_keys:read,write']` | `permissions: { read: unknown; write: unknown };`              |
| `in_array_keys:a,b`       | at least one listed key must be present — no single key is guaranteed                          | `'config' => ['required','array','in_array_keys:timezone']`              | `config: { timezone?: unknown };`                              |
| `array:a,b`               | restricts which keys are allowed; says nothing about presence                                  | `'preferences' => ['nullable','array:theme,locale']`                     | `preferences?: { theme?: unknown; locale?: unknown } \| null;` |
| `array_keys:a,b`          | restricts which keys are allowed; requires ≥1 listed key; presence of any given key unenforced | `'attributes_map' => ['required','array_keys:color,size']`               | `attributes_map: { color?: unknown; size?: unknown };`         |

A field can combine a key-list rule with a real declared child, and the two merge instead of the
synthesized keys being dropped. A real child wins the type and optionality on a name collision;
any key with no real child stays synthesized:

```php
'shipping' => ['required', 'array', 'required_array_keys:method,address'],
'shipping.method' => ['nullable', 'in:standard,express'],
```

```typescript
shipping: { method?: 'standard' | 'express' | null; address: unknown };
```

`method` keeps its own declared type and optionality from `'shipping.method'` even though
`required_array_keys` also named it as required; `address` has no declared rule of its own, so it
stays the synthesized `unknown`, required because `required_array_keys` said so.

### JSDoc Metadata Annotations

Certain rules attach a JSDoc comment above the field instead of (or in addition to) affecting its type:

| Rule(s)                                                                                                            | Annotation                            |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `hex_color`                     | `@format {rule}`                      |
| `date`, `date_equals`                                                                                              | `@format date`                        |
| `exists:table,column` / `Rule::exists(...)`                                                                        | `@constraint exists`                  |
| `unique:table,column` / `Rule::unique(...)`                                                                        | `@constraint unique`                  |
| `required_if`, `required_unless`, `required_with`, `required_without`, `required_with_all`, `required_without_all` | `@metadata required-conditionally`    |
| `Rule::requiredIf(...)` / `Rule::requiredUnless(...)`                                                              | `@metadata required-if conditional`   |
| `Rule::prohibitedIf(...)` / `Rule::prohibitedUnless(...)`                                                          | `@metadata prohibited-if conditional` |
| `Rule::excludeIf(...)` / `Rule::excludeUnless(...)`                                                                | `@metadata exclude-if conditional`    |
| `not_in:a,b,c`                                                                                                     | `@not a, b, c`                        |

```php
'category_id' => ['required', 'integer', 'exists:categories,id'],
```

```typescript
/** @constraint exists */
category_id: number;
```

An annotation on a nested rule isn't lost when that rule [composes into its parent](#array-nested-rules) — it's hoisted onto the parent's comment block and suffixed with the full rule key it came from, wildcards included, so you can tell which nested key it describes:

```php
'order.id' => ['required', 'uuid'],
'products.*.contact_email' => ['required', 'email'],
```

```typescript
/** @format uuid order.id */
order: {
  id: string; /* … */
}

/** @format email products.*.contact_email */
products: {
  contact_email: string; /* … */
}
[];
```

The one exception is a `prohibited` nested key: since it and its descendants are dropped from the type, their annotations are dropped too.

### `#[TsCasts]` — Overriding Field Types

Same attribute (and array shape) used by [models](https://tolki.abe.dev/ts/models.html#tscasts) and resources — place it on the `FormRequest` class to override a field's inferred type, mark it optional, or add a field with a custom imported type:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
use Illuminate\Validation\Rule;

#[TsCasts([
    'status' => "'draft' | 'published' | 'archived'",
    'attributes' => ['type' => 'PostAttributes', 'import' => '@js/types/posts'],
])]
class UpdatePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'attributes' => ['sometimes', 'array'],
        ];
    }
}
```

```typescript
import type { PostAttributes } from "@js/types/posts";

export interface UpdatePostRequest {
  title?: string;
  status: "draft" | "published" | "archived";
  attributes?: PostAttributes;
}
```

`#[TsCasts]` only replaces the field's **type** and **optionality** (via the `optional` key) — it does not clear a `nullable` rule already on that field. If the underlying rule includes `nullable`, the override's type still gets `| null` appended, same as in the [Anatomy](#anatomy-of-a-generated-form-request) example above.

`#[TsCasts]` keys match **generated field names**, and a dot-notation rule key never becomes one — it [composes into its parent](#array-nested-rules). A key like `'order.id'` or `'tags.*'` matches nothing and is silently ignored; it does not add a field either. Override the parent (`'order'`, `'tags'`) to replace the whole shape, or make the rule itself precise enough not to need an override. The only dotted key that matches is one whose dot was escaped in the rule (`'v1\.0'` generates the field `"v1.0"`, so `'v1.0'` overrides it).

### `#[TsExtends]`

`FormRequest` classes support `#[TsExtends]` and the `ts_extends.form_requests` config array, the same generic interface-extension mechanism used everywhere else in this package. See [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces.html) for the full attribute reference and config syntax.

### Dynamic Requests

When `rules()` can't be called without real HTTP/session/auth state — for example, reading a property directly off the authenticated user instead of calling a method — the analyzer can't resolve it statically, and the whole class falls back to a `Record<string, unknown>` type alias:

```php
class DynamicRequest extends FormRequest
{
    public function rules(): array
    {
        $userId = $this->user()->id; // throws in the stubbed analysis context

        return [
            'name' => ['required', 'string'],
            'user_id' => ['required', 'integer', 'in:'.$userId],
        ];
    }
}
```

```typescript
/**
 * @see Workbench\App\Http\Requests\DynamicRequest
 * @dynamic Rules could not be resolved statically.
 */
export type DynamicRequest = Record<string, unknown>;
```

Method calls like `Auth::user()->isAdmin()` are safe — the analyzer stubs an authenticated user whose methods all return `false`. It's direct property access or anything else that needs _real_ request/session data that triggers the fallback.

### Filtering & Excluding Form Requests

Same include/exclude pattern used by enums, models, and resources:

```php
// config/ts-publish.php
'form_requests' => [
    'included' => [App\Http\Requests\StorePostRequest::class], // only these (empty = all)
    'excluded' => [App\Http\Requests\InternalRequest::class],   // never publish these
    'additional_directories' => ['modules/Blog/Http/Requests'],
],
```

`#[TsExclude]` on the class excludes the whole request:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalRequest extends FormRequest
{
    // Not published to TypeScript
}
```

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content.html) for the full attribute behavior shared across models, enums, resources, and routes. There's no field-level equivalent for form requests — rules live in a single `rules()` array rather than individual methods, so exclusion is class-only.

### Route Integration

When a controller action type-hints a `FormRequest`, its generated interface is automatically attached to that action's route export via `annotateRequestPayload<T>()` — no configuration needed. See [Form Request Payload Types](https://tolki.abe.dev/ts/routing.html#form-request-payload-types) in the Routing docs for the full `annotateRequestPayload` / `InferRequestPayload` reference.

### Configuration Reference

The full list of `form_requests.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Cache Generation

After the first full publish, `ts:publish` can skip re-generating classes whose source files (and everything they depend on) haven't changed. Unchanged files are never rewritten, so their modification time is preserved — avoiding spurious rebuilds in tools like Vite. The cache is busted automatically whenever the package version or your output-affecting config changes.

```php
// config/ts-publish.php

'cache' => [
    'enabled' => env('TS_PUBLISH_CACHE_ENABLED', true),
    'store' => env('TS_PUBLISH_CACHE_STORE'),
    'directory' => storage_path('framework/cache/ts-publish'),
    'key' => env('TS_PUBLISH_CACHE_KEY'),
],
```

### How a Cache Hit Is Detected

For each class, the orchestrator (`BaseRunner::cachedGenerate()`) runs through this exact sequence:

1. **Requires `RehydratesFromCache`** — if the resolved `*.generator_class` doesn't use the trait (no `fromCache()` method), the class is always rebuilt from scratch — correct, just never cached. See [Cache-Compatible Generators](https://tolki.abe.dev/ts/customizing-the-pipeline.html#cache-compatible-generators-rehydratesfromcache).
2. **Folds in a non-file signature, if the generator provides one** — see [Non-File Signatures](#non-file-signatures-providescachesignature) below.
3. **Recomputes the fingerprint fresh** from the _previously recorded_ dependency file list plus that signature, and compares it to the stored fingerprint — cheap, since it only re-hashes already-known files rather than re-running collection.
4. **Also verifies every previously-written output file still exists on disk** — a manually deleted output file forces a rebuild even if the fingerprint still matches.

Only when all of this matches is the class's transformer snapshot rehydrated and its cached output reused as-is.

### The Fingerprint Algorithm

`Fingerprinter::fromPaths()` computes an order-independent fingerprint from a set of file paths:

1. Paths are deduplicated and sorted, so the fingerprint never changes just because files were discovered in a different order.
2. Each path is hashed with `hash_file('xxh128', $path)`. A **missing** file contributes a stable `'missing'` marker instead of erroring — so a dependency's later appearance (or removal) still changes the fingerprint.
3. An optional non-file `$extra` signature string (see below) is appended as `::extra::{$extra}` when non-empty.
4. The final fingerprint is `hash('xxh128', ...)` over the joined `path@hash` lines.

xxHash128 is used throughout — it's fast, which matters since fingerprinting runs on every class on every publish (cached or not). It's a non-cryptographic hash: the _integrity/tamper-resistance_ of the cache comes from the separate HMAC signing layer (see [Payload Signing & Security](#payload-signing-security)), not from this fingerprint.

### What Gets Recorded as a Dependency

`DependencyRecorder::recordClass()` builds the dependency file list for a class:

- The class's own source file.
- Every trait it uses, recursively — a trait used by another trait is still recorded, since `ReflectionClass::getTraits()` only returns direct traits.
- Every interface it implements.
- The full parent class chain, walking all the way up — and each ancestor's own traits, too.

Recording is guarded by `class_exists()`, so an unresolvable class string can never crash a publish — it's a cache side-channel, and it stays silent on failure rather than risk breaking generation.

### Non-File Signatures (`ProvidesCacheSignature`)

Some cache-relevant inputs don't live in any file at all — the clearest example is **routes**: a route's URI, HTTP methods, name, domain, and middleware live in your route files, not in the controller class file itself, so a route change wouldn't otherwise be visible to the file-based fingerprint.

`RouteGenerator` solves this by implementing `AbeTwoThree\LaravelTsPublish\Cache\Contracts\ProvidesCacheSignature`:

```php
class RouteGenerator extends CoreGenerator implements ProvidesCacheSignature
{
    public static function cacheSignature(string $fqcn): string
    {
        return RouteCacheSignature::for($fqcn);
    }
}
```

`RouteCacheSignature::for($controllerClass)` builds a deterministic signature by collecting every route mapped to that controller, encoding each one as `name|uri|methods|domain|actionMethod|middleware` (methods and middleware sorted for stability), sorting all of them, and hashing the result. `BaseRunner` checks `is_subclass_of($generatorClass, ProvidesCacheSignature::class, true)` and, when true, folds the returned signature into `Fingerprinter::fromPaths()` as the `$extra` argument — so adding, removing, or editing a route (even just its URI) busts exactly the controllers whose routes changed, without needing `--fresh`.

A custom [`*.generator_class`](https://tolki.abe.dev/ts/customizing-the-pipeline.html) can implement the same interface to fold its own non-file signature (an API response, a database timestamp, anything else that affects output but isn't a file) into its cache fingerprint.

### Config Fingerprinting

Beyond individual classes, the entire cache is busted whenever your output-affecting config changes. `ConfigFingerprint::compute()`:

- Reads the full `ts-publish` config array, **excluding the `cache.*` sub-array** — toggling cache settings themselves must never bust every class's cache.
- Recursively sorts every array by key, so the fingerprint is independent of declaration order.
- Hashes the result with `xxh128`.
- Falls back to a random per-run token if the config contains a non-serializable value (e.g. a raw closure) — this guarantees a safe full rebuild that run rather than crashing generation.

### Manifest Lifecycle

`GenerationManifest` is the in-memory index tying it all together:

- **`load()`** — loads stored entries from the repository. If the stored header's package version or config hash no longer matches the current run, the _entire_ cache is flushed and generation starts fresh.
- **`hit()`** — true only when the fingerprint matches AND every one of the class's previously-recorded output files still exists (see [How a Cache Hit Is Detected](#how-a-cache-hit-is-detected) above).
- **`record()`** — stores a freshly-built class's fingerprint, output filename, dependency paths, output paths, and a base64-encoded transformer snapshot.
- **`markSeen()`** / **`save()`** — every class touched during a run is marked seen; `save()` **prunes any entry not seen this run**, so a class removed from your source tree has its stale cache entry cleaned up automatically instead of lingering forever.

### Storage Backends

#### File Backend (Default)

- Each entry is written to `{directory}/{xxh128(key)}.cache` — the key itself is hashed into the filename, so no filesystem-unsafe characters ever reach disk.
- The directory self-manages a `.gitignore` (`*` / `!.gitignore`) on first use.
- **Self-healing on corruption** — if a cache file fails signature verification or fails to parse, it's deleted immediately (`forget()`) so the next run rebuilds it cleanly instead of failing repeatedly.

#### Laravel Cache Store Backend

Setting `cache.store` (e.g. `'redis'`, `'database'`) routes the manifest through any configured Laravel cache store instead of the filesystem:

- The repository maintains its **own in-memory key index** (a `list<string>` stored under `{prefix}:__index__`), since Laravel cache stores have no native "flush only my keys" operation. `flush()` only removes keys _this package itself wrote_ — it never touches unrelated entries in a shared store.
- The index is persisted once via `commit()` after a batch of writes (called once at the end of `GenerationManifest::save()`), not on every individual `put()` — cheap at expected class counts.
- Entries are stored with `forever()` — no TTL, since the manifest tracks its own staleness via fingerprints and pruning rather than relying on cache expiry.

### Payload Signing & Security

Both backends share the same signing logic (`SignsCachePayloads` trait):

- **Signing** — `serialize($value)`, then prepended with `hash_hmac('sha256', $serialized, $key) . ':'` when a key is configured. Falls back to unsigned storage only if no key is resolvable at all (no `cache.key` **and** no `app.key` — effectively only possible on a fresh app before `php artisan key:generate`).
- **Verification** — the HMAC is checked with `hash_equals()` (timing-safe comparison) before anything is trusted. On any failure — missing signature, mismatched signature, corrupt data, or a non-array/non-string-keyed result — the payload is rejected and treated as absent.
- **Deserialization is always `allowed_classes: false`** — even a successfully-signed payload can never instantiate a PHP object during `unserialize()`, closing the object-injection surface entirely on this package's own read path.

> [!WARNING]
> **Using a cache `store` with an untrusted backend.** When `store` points at a Laravel cache store (`redis`, `database`, `file`, …), that store deserializes its own values on read — and by default (Laravel's `cache.serializable_classes` is unset) it does so with PHP classes allowed, _before_ this package's HMAC is checked. The signing still protects payload integrity, but it cannot stop object instantiation at the cache layer. If the store is shared or otherwise not fully trusted, set Laravel's `cache.serializable_classes` to `false` (or an explicit allowlist) and/or use a dedicated, trusted store. The default file backend is unaffected.

### Forcing a Full Rebuild

```bash
php artisan ts:publish --fresh
```

Flushes the cache, regenerates everything, and writes a fresh cache. It's a no-op under `--source` and `--preview`.

### What Bypasses the Cache

- **`--source=...` runs** (single-class republishing) always bypass the cache entirely.
- **`--preview` runs** never use the cache — they write no files, so caching them would record empty outputs and poison later real runs into skipping files that were never actually written.
- Setting `cache.enabled` to `false` disables it everywhere.

### Configuration

| Config Key        | Type      | Default                              | Description                                                                                                                                        |
| ----------------- | --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Turn the generation cache on or off.                                                                                                               |
| `cache.store`     | `?string` | `null`                               | `null` keeps the cache on disk under `directory`. Set to any Laravel cache store name (`redis`, `database`, …) to keep the manifest there instead. |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Where the file-based cache lives.                                                                                                                  |
| `cache.key`       | `?string` | `null`                               | HMAC signing key. Falls back to `app.key` when unset. Rotating the key triggers a one-time full rebuild — safe.                                    |

> [!NOTE]
> The cache keys off your PHP source files. If you **manually edit a generated `.ts` file** without changing its source, the cache won't detect the edit and won't overwrite it — run `php artisan ts:publish --fresh` (or delete the generated file) to restore it.

> [!NOTE]
> **Database schema changes** (migrations) aren't part of the fingerprint — a model's columns are read from the live database, not a source file. The automatic post-migration republish always runs with `--fresh`, so it reflects schema changes. If you change the schema another way, run `php artisan ts:publish --fresh` yourself.

## Inertia

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) analyzes your `HandleInertiaRequests` middleware's `share()` method and generates `inertia-config.d.ts` — a module augmentation for `@inertiajs/core` plus a global `Inertia.SharedData` type. Every Inertia page component gets fully-typed shared props automatically, without hand-maintaining a separate type.

This page covers the shared-data analysis and module augmentation file. For per-route page-prop types (the `component` field and `annotatePageProps` threading on individual routes), see [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration) in the Routing docs — that's a related but separate piece of the pipeline.

### How the Augmentation File Is Generated

- The package searches `inertia.inertia_middleware_path` (or `app_path()` when not set) for a class extending `Inertia\Middleware`.
- It statically analyzes that middleware's `share(Request $request): array` method with the package's own AST engine, resolving every key's value to a TypeScript type without running the application.
- Both composition forms are read, up the whole middleware inheritance chain: a `...parent::share($request)` spread and `array_merge(parent::share($request), [...])`. A later key overrides an earlier one and keeps the earlier one's position, exactly as PHP does.
- `$request->user()` is typed through your live auth configuration — `auth.defaults.guard` → that guard's provider → the provider's `model` — so the prop becomes `User | null` and the model's type import is written into the file for you. `auth()->user()`, `auth()->id()`, `Auth::user()` and `Auth::id()` resolve the same way, and `$request->url()`, `->fullUrl()`, `->path()`, `->integer()`, `->boolean()`, `->string()`, `->cookie()` and `->hasCookie()` are typed from Laravel's own signatures.
- `config('some.key')` with a literal key is typed from the live configuration value, since the package runs inside your booted application; a computed key stays `unknown`.
- Inertia v2's prop wrappers — `Inertia::defer()`, `optional()`, `lazy()`, `always()`, `merge()`, `deepMerge()` — are typed as the value they wrap. The three a partial reload can omit (`defer`, `optional`, `lazy`) produce an optional key.
- `errors` is deliberately left out of the inferred shape: `@inertiajs/core` already declares `page.props.errors` as `Errors & ErrorBag`, and `errorValueType` below is this package's channel for sharpening it. A `#[TsCasts]` or `@return` docblock entry named `errors` still wins if you want one.
- The result is rendered into `inertia-config.d.ts` (filename configurable via `inertia.augmentation_filename`).
- If no `Inertia\Middleware` subclass is found, no file is generated.

### Anatomy of the Generated File

Given this middleware:

```php
class HandleInertiaRequests extends Middleware
{
    protected $withAllErrors = true;

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => ['user' => $request->user()],
            'ziggy' => fn () => ['location' => $request->url()],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state'),
            'appName' => config('app.name'),
        ];
    }
}
```

The package generates `inertia-config.d.ts`:

```typescript
import type { User } from "./app/models";

declare global {
  namespace Inertia {
    type SharedData = {
      auth: { user: User | null };
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
  }
}

declare module "@inertiajs/core" {
  export interface InertiaConfig {
    sharedPageProps: {
      auth: { user: User | null };
      ziggy: { location: string };
      sidebarOpen: boolean;
      appName: string;
    };
    errorValueType: string[];
  }
}

export {};
```

- **`import type { User } from './app/models';`** — every model, resource or enum an inferred prop type names gets its import written above the declarations, resolved relative to the output root. Imports supplied by `#[TsCasts(import: ...)]` are rendered below these. A key whose type an override replaces drops the import that type kept alive.
- **`declare global { namespace Inertia { type SharedData = ...; } }`** makes `Inertia.SharedData` available by bare name in any `.ts` file in your project — including generated controller files that intersect it with page-specific props (see [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration)).
- **`declare module '@inertiajs/core' { ... InertiaConfig ... }`** augments Inertia's own `usePage<T>()` / shared-data typing so `usePage().props` is typed correctly throughout your frontend, without you writing that augmentation by hand.
- **`errorValueType: string[]`** is only added when the middleware has a `protected $withAllErrors = true;` property — it matches the shape Inertia uses for its validation error bag in that mode.
- **A value the analyzer cannot read stays `unknown`.** `'flash' => ['success' => fn () => $request->session()->get('success')]` would emit `flash: { success: unknown }` — `session()` is not one of the typed request methods. Reach for [`#[TsCasts]` or a `@return` docblock](#type-resolution-priority) there.
- **`export {};`** at the end is required — TypeScript only processes a `declare global` block inside a file that's an ES module (i.e., has at least one top-level `import` or `export`). Without it, the `declare global` block would be silently ignored.

### Type Resolution Priority

Each key returned from `share()` resolves to a TypeScript type using this priority order (highest wins):

1. **`#[TsCasts]`** on the middleware class or its `share()` method — the same attribute used by [models](https://tolki.abe.dev/ts/models.html#tscasts), [resources](https://tolki.abe.dev/ts/api-resources.html#tscasts-override-property-types), and [broadcast events](https://tolki.abe.dev/ts/broadcast-events.html#tscasts-overriding-property-types).
2. **`@return array{...}` PHPDoc** on `share()` — a manually-written shape annotation, useful when a key's value can't be statically inferred (e.g. it comes from a method call whose return type says nothing).
3. **The AST engine's inference** — the default, covering plain values, nested arrays, conditionals, closures, spreads, `array_merge()`, `config()`, the request/auth helpers, and Inertia's prop wrappers.

```php
#[TsCasts(['appName' => 'string'])]
class HandleInertiaRequests extends Middleware
{
    /**
     * @return array{flash: array{success: string|null, error: string|null}}
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => $this->resolveFlashMessages($request), // opaque method call
        ];
    }
}
```

Here, `appName`'s type comes from `#[TsCasts]`, `flash`'s type comes from the `@return` docblock (since `resolveFlashMessages()` isn't itself analyzed), and every other key (like `auth`, from `...parent::share($request)`) falls back to the engine's own inference.

### Preserve-Keys Resource Collections in Page Props

This is about per-route page props (see [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration)), not `share()` — noted here because it's the same paginated-collection typing this page's other sections describe.

A `ResourceCollection` (or a resource collected via `Resource::collection()`) that opts into Laravel's key-preserving behavior — the `#[PreserveKeys]` attribute or the older `public $preserveKeys = true;` property — serializes its `data` as a JSON object keyed by the source collection's own keys, not a JSON array. A paginated page prop backed by such a collection types its `data` member to match:

```typescript
import type { JsonResourcePaginator } from "@tolki/types";

// $wrap = null (flat) or Resource::collection($paginator) on a preserve-keys resource:
export type TeamsPageProps = Inertia.SharedData & {
  teams: Omit<JsonResourcePaginator<Team>, "data"> & {
    data: Record<string, Team>;
  };
};
```

`JsonResourcePaginator<T>`'s own `data` is `T[]` (see [API Resources § Pagination](https://tolki.abe.dev/ts/api-resources.html)), so a key-preserving collection can't use it unmodified — the page prop type `Omit`s the array-typed `data` and replaces it with a keyed `Record<string, T>`.

A **named**, non-flat collection (`new TeamCollection($paginator)`, wrapped in a `data` key) doesn't need this rewrite at all: its page prop already references the collection's own generated interface (`TeamCollection & ResourcePagination`), and that interface's `data` member is generated as `Record<string, T>` directly whenever the collection preserves keys — paginated or not. Only the two shapes that would otherwise degrade to a paginator utility type with an array-typed `data` — the flat collection and the anonymous `Resource::collection()` case — need the `Omit<...> & { data: Record<...> }` rewrite.

#### Paginating Inline in the Render Call

A paginator does **not** have to be assigned to a variable first. Both of these produce the same page-prop type:

```php
// Via an intermediate variable
$teams = Team::query()->paginate(10);

return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection($teams),
]);

// Inline, with no intermediate variable
return Inertia::render('Teams/Index', [
    'teams' => new TeamCollection(Team::query()->paginate(10)),
]);
```

```typescript
export type IndexPageProps = Inertia.SharedData & {
  teams: TeamCollection & ResourcePagination;
};
```

`paginate()`, `simplePaginate()`, and `cursorPaginate()` are all recognized, in both the `new SomeCollection(...)` and `SomeResource::collection(...)` forms.

> [!WARNING]
> An unrecognized paginator does not produce a _missing_ type — it produces a **wrong** one. The analyzer defaults an unresolved prop to "not paginated", so the prop still gets a type from the ordinary resource/collection analysis, just without the pagination wrapper. Before inline detection, the second form above typed as a bare `TeamCollection`, silently omitting `ResourcePagination`.

One form is still not followed: a query builder assigned to a variable _before_ the paginator call. The chain has to reach a static call on the model directly.

```php
$q = Post::query();

return Inertia::render('Posts/Index', [
    'posts' => new PostCollection($q->paginate(10)), // not detected
]);
```

### Spread Support (`...parent::share($request)`)

The base `Inertia\Middleware::share()` method's own return type (Laravel's default `errors`/`errors_bag` keys, plus anything your parent middleware layers add) is included automatically when your override spreads it in — same as trait/parent spreading elsewhere in the package.

### Output Location

The augmentation file's output directory is resolved with this priority:

1. `inertia.output_directory`, if set.
2. `routes.output_directory`, if set — since page-prop types generated per-route (see [Inertia Integration](https://tolki.abe.dev/ts/routing.html#inertia-integration)) reference `Inertia.SharedData`, keeping the augmentation file alongside routes by default means both live in a predictable, related location.
3. The global `output_directory`.

### Configuration Reference

The full list of `inertia.*` config keys — including `component_casing` and `ui_table_package`, which apply to the related per-route page-props feature — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Modular Publishing

Every TypeScript file this package generates is written into a namespace-derived directory tree that mirrors your PHP namespace structure. This is not an opt-in feature — there is no flat-output mode, and no configuration toggle to disable it. Models, enums, resources, form requests, broadcast events, and routes are all placed using the same namespace-derived path.

> [!NOTE]
> In V1 of this package, modular output was an opt-in setting alongside a default flat-directory mode. Supporting both styles required nearly duplicate code paths for every feature and was error-prone — especially as the package grew from 3 feature groups to 7+. V2 removed the flat mode entirely; output is always namespace-derived now. See the [V2 upgrade guide](https://github.com/abetwothree/laravel-ts-publish/blob/main/docs/v2-upgrade-guide.md) if you're upgrading from V1.

### Output Structure

The output structure reflects your PHP namespaces, and every feature this package publishes participates in it — not just models and enums. A typical `App\*`-namespaced application, alongside a secondary `Accounting\*` module, produces something like:

```text
resources/js/types/data/
├── app/
│   ├── enums/
│   │   ├── role.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── admin/
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── events/
│   │   ├── OrderShipped.ts
│   │   ├── UserRegisteredEvent.ts
│   │   └── index.ts
│   └── http/
│       ├── controllers/
│       │   ├── post-controller.ts
│       │   └── index.ts
│       ├── requests/
│       │   ├── store-post-request.ts
│       │   └── index.ts
│       └── resources/
│           ├── user-resource.ts
│           └── index.ts
├── accounting/
│   ├── enums/
│   │   ├── invoice-status.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── invoice.ts
│   │   └── index.ts
│   └── http/
│       └── resources/
│           ├── invoice-resource.ts
│           └── index.ts
├── broadcast-channels.ts
├── broadcast-events.ts
├── echo-broadcast-events.d.ts
├── inertia-config.d.ts
├── vite-env.d.ts
├── laravel-ts-collected-files.json
└── laravel-ts-global.d.ts
```

Each namespace directory gets its own barrel `index.ts` file that exports every type within that directory — see [Barrel Files](#barrel-files) below.

> [!NOTE]
> Broadcast event files are the one exception to kebab-casing: they keep their original PHP class name (`OrderShipped.ts`, not `order-shipped.ts`), since that name also has to match the class re-exported from the file. Every other feature (models, enums, resources, form requests, and route/controller files) is kebab-cased.

The root-level files above are combined, non-namespaced output — they aren't tied to any one class, so they don't get a namespace directory. `broadcast-channels.ts`, `broadcast-events.ts`, `laravel-ts-collected-files.json`, `vite-env.d.ts`, and `inertia-config.d.ts` are all generated by default; `echo-broadcast-events.d.ts` requires an Echo package to be installed; `laravel-ts-global.d.ts` requires `globals.enabled` (off by default); and a JSON definitions file (`laravel-ts-definitions.json` by default) requires `json.enabled` (also off by default).

### How It Works

Every namespace path is computed by `LaravelTsPublish::namespaceToPath()`, which:

1. Strips the class name, keeping only the namespace.
2. Applies the configured `namespace_strip_prefix`, if the namespace starts with it (see [Stripping a Namespace Prefix](#stripping-a-namespace-prefix)).
3. Kebab-cases **each namespace segment individually**, then joins them with `/`.

| PHP Class                           | Output File                            |
| ----------------------------------- | -------------------------------------- |
| `App\Models\User`                   | `app/models/user.ts`                   |
| `App\Enums\Role`                    | `app/enums/role.ts`                    |
| `Accounting\Models\Invoice`         | `accounting/models/invoice.ts`         |
| `Shipping\Enums\ShipmentStatus`     | `shipping/enums/shipment-status.ts`    |
| `App\Domain\Billing\Models\Invoice` | `app/domain/billing/models/invoice.ts` |

#### Nested Namespaces

Namespaces of any depth are preserved as nested directories — there's no limit to how deep a namespace can go. For example, `App\Models\Admin\Store` produces a nested `admin/` directory inside `app/models/`:

```text
app/models/
├── admin/
│   ├── store.ts
│   └── index.ts
├── user.ts
└── index.ts
```

### Automatic Relative Imports

Import paths between generated files are computed automatically by `LaravelTsPublish::relativeImportPath()`, based purely on the two namespace paths involved — never hand-written, and never dependent on a path alias being configured:

| From          | To              | Result             |
| ------------- | --------------- | ------------------ |
| `blog/models` | `blog/models`   | `.`                |
| `blog/models` | `blog/enums`    | `../enums`         |
| `app/models`  | `blog/enums`    | `../../blog/enums` |
| `models`      | `models/videos` | `./videos`         |

Same-or-descendant paths are prefixed with `./` (a bare specifier like `videos` would otherwise be treated as a package import by TypeScript, not a relative path); ancestor paths walk up with one `../` per directory level before descending back down to the target.

```typescript
// accounting/models/invoice.ts

import { Payment } from "."; // Same namespace (accounting/models)
import { User } from "../../app/models"; // Cross-module import
import { InvoiceStatusType } from "../enums"; // Sibling namespace (accounting/enums)

export interface Invoice {
  id: number;
  user_id: number;
  number: string;
  status: InvoiceStatusType;
  subtotal: number;
  tax: number;
  total: number;
  // ...
}

export interface InvoiceRelations {
  user: User;
  payments: Payment[];
  // ...
}

export interface InvoiceAll extends Invoice, InvoiceRelations {}
```

### Stripping a Namespace Prefix

If your modules live under a common namespace prefix (e.g. `Modules\`), strip it from the output path with the `namespace_strip_prefix` config option:

```php
// config/ts-publish.php

'namespace_strip_prefix' => 'Modules\\',
```

| PHP Class                        | Without Strip Prefix                | With `'Modules\\'` Strip Prefix |
| -------------------------------- | ----------------------------------- | ------------------------------- |
| `Modules\Blog\Models\Article`    | `modules/blog/models/article.ts`    | `blog/models/article.ts`        |
| `Modules\Shipping\Enums\Carrier` | `modules/shipping/enums/carrier.ts` | `shipping/enums/carrier.ts`     |

This keeps the output directory structure clean by removing the redundant prefix. The default is an empty string, so no prefix is stripped unless you configure one.

### Barrel Files

Each namespace directory receives its own barrel `index.ts` file, alphabetically sorted and deduplicated. For example, `accounting/models/index.ts`:

```typescript
export * from "./invoice";
```

And `app/models/index.ts`:

```typescript
export * from "./address";
export * from "./order";
export * from "./product";
export * from "./user";
// ... all models in this namespace
```

This lets you import from a namespace root instead of a specific file:

```typescript
import { User, Order } from "@js/types/data/app/models";
import { Invoice } from "@js/types/data/accounting/models";
import { InvoiceStatusType } from "@js/types/data/accounting/enums";
```

> [!TIP]
> Barrel files are generated per-feature — models, enums, resources, form requests, and broadcast events each get their own barrel per namespace directory. Running `ts:publish --preview` (or `-v`) prints each one separately, labeled e.g. `Model Barrel Files:` or `Enum Barrel Files:`, alongside the individual per-class file contents.

### Applies Across Every Feature

Namespace-derived output isn't unique to models — it's the same mechanism used everywhere in this package:

- [Models](https://tolki.abe.dev/ts/models.html) — `{Model}`, `{Model}Mutators`, `{Model}Relations`, and enum-resolved `{Model}Resource` interfaces.
- [Enums](https://tolki.abe.dev/ts/enums.html) — the enum object and its generated type aliases.
- [API Resources](https://tolki.abe.dev/ts/api-resources.html) — resource interfaces.
- [Form Requests](https://tolki.abe.dev/ts/form-requests.html) — request payload interfaces.
- [Broadcast Events](https://tolki.abe.dev/ts/broadcast-events.html) — event interfaces.
- [Routing](https://tolki.abe.dev/ts/routing.html) — route helper files, one per controller, placed at `{namespacePath}/{controller-name}.ts`.

Broadcast channels, the global declaration file, JSON output, the watcher file, the Inertia augmentation, and the Vite env augmentation are unaffected — they're single combined files by nature and aren't tied to any one class's namespace.

## Pre-Command Hook

Register a closure with `LaravelTsPublish::callCommandUsing()` to run custom logic right before the `ts:publish` command executes — dynamically configuring directories, swapping pipeline classes, or reacting to feature flags and environment state. The closure only runs when the command actually runs, not at service provider boot time, so it never adds overhead to a normal web request.

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        // This only runs when `php artisan ts:publish` is executed
        config()->set('ts-publish.models.additional_directories', [
            'modules/Blog/Models',
            'modules/Shop/Models',
        ]);
    });
}
```

### When the Hook Runs

`callCommandWith()` is invoked as the very first line of `TsPublishCommand::handle()` — before `--source` is checked, before the `--only-*` flags are validated, before anything else. This means it runs **unconditionally and identically** for every way the command can be invoked:

| Invocation                                        | Hook runs? |
| ------------------------------------------------- | ---------- |
| `php artisan ts:publish` (full publish)           | Yes        |
| `php artisan ts:publish --source=App\Models\User` | Yes        |
| `php artisan ts:publish --preview=true`           | Yes        |
| Automatic post-migration republish                | Yes        |

There's no way to distinguish which invocation triggered the hook from inside the closure itself — if you need different behavior for `--source` reruns (for example, skipping expensive filesystem scans that the [Vite plugin](https://tolki.abe.dev/ts/vite-plugin.html) triggers on every file save), check for cheaper conditions inside the closure (e.g. caching the scan result, or reading an environment variable) rather than relying on the command's own options.

### Registration Behavior

- **Only one closure at a time** — calling `callCommandUsing()` again replaces the previously registered closure entirely; closures don't stack or chain.
- **Re-runs every time** — the same registered closure executes in full on every `callCommandWith()` call (i.e. every command invocation). It does not self-clear after running once.
- **No-op by default** — if nothing has called `callCommandUsing()`, `callCommandWith()` does nothing.
- **Runs with full config already loaded** — the closure can read and write any `ts-publish.*` config key via `config()->set(...)`, since Laravel's config repository is fully booted by the time it runs.

### Use Cases

#### Dynamic Directory Discovery

The most common use case: scanning the filesystem so `additional_directories` stays in sync automatically as modules are added or removed, instead of hand-maintaining a static list.

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Symfony\Component\Finder\Finder;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $modelDirs = collect(Finder::create()->directories()->in(base_path('modules'))->name('Models')->depth(1))
            ->map(fn ($dir) => $dir->getRelativePathname())
            ->values()
            ->all();

        $enumDirs = collect(Finder::create()->directories()->in(base_path('modules'))->name('Enums')->depth(1))
            ->map(fn ($dir) => $dir->getRelativePathname())
            ->values()
            ->all();

        config()->set('ts-publish.models.additional_directories', $modelDirs);
        config()->set('ts-publish.enums.additional_directories', $enumDirs);
    });
}
```

#### Modular Package Integration (e.g. `nwidart/laravel-modules`)

Rather than scanning the filesystem blindly, react to your module manager's own registry so only currently-_enabled_ modules contribute directories:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Nwidart\Modules\Facades\Module;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        $enabledPaths = collect(Module::allEnabled())
            ->map(fn ($module) => $module->getPath())
            ->values()
            ->all();

        config()->set('ts-publish.models.additional_directories', collect($enabledPaths)
            ->map(fn (string $path) => "{$path}/Models")
            ->all());

        config()->set('ts-publish.enums.additional_directories', collect($enabledPaths)
            ->map(fn (string $path) => "{$path}/Enums")
            ->all());
    });
}
```

This way, disabling a module also removes its types from the next publish without editing any config.

#### Conditionally Swapping Pipeline Classes

Since the hook runs before the [pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html) is resolved, it's the right place to swap a `*_class` override based on runtime conditions — for example, using a lighter-weight transformer in CI where full analysis isn't needed:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use App\TypeScript\CiModelTransformer;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (app()->runningInConsole() && env('CI')) {
            config()->set('ts-publish.models.transformer_class', CiModelTransformer::class);
        }
    });
}
```

#### Feature-Flag-Driven Publishing

Combine with [Laravel Pennant](https://laravel.com/docs/pennant) (or any feature-flag system) to only publish a module's types once its feature is active:

```php
use AbeTwoThree\LaravelTsPublish\LaravelTsPublish;
use Laravel\Pennant\Feature;

public function boot(): void
{
    LaravelTsPublish::callCommandUsing(function () {
        if (Feature::active('new-billing-module')) {
            config()->set('ts-publish.models.additional_directories', [
                ...config('ts-publish.models.additional_directories'),
                'modules/Billing/Models',
            ]);
        }
    });
}
```

## Routing

The [`defineRoute`](#anatomy-of-defineroute) function is the runtime companion to the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish)'s route generation. For every controller with at least one publishable route, the Laravel package writes a single TypeScript file exporting one `defineRoute()` call per action — similar in spirit to [Laravel Wayfinder](https://github.com/laravel/wayfinder), but far more compact: all the URL-building, parameter-binding, query-string, and form-spoofing logic lives inside `defineRoute` itself instead of being generated inline for every single route.

As with [enums](https://tolki.abe.dev/ts/enums.html), this package is not meant to be used standalone — install it alongside the Laravel package as described in [Installation & Usage](https://tolki.abe.dev/ts/index.html).

### How Routes Are Generated

- One `.ts` file is generated per controller, at a modular, namespace-derived path (e.g. `App\Http\Controllers\PostController` → `app/http/controllers/post-controller.ts`).
- Each file exports one named `const` per controller action — named after the **controller method**, not the Laravel route name — plus a `default` export containing all of that controller's actions as a single object.
- Barrel `index.ts` files are written per namespace directory, but — unlike models, enums, and resources — route barrels **only re-export each controller's default export**, never named exports:

  ```typescript
  // app/http/controllers/index.ts
  export { default as PostController } from "./post-controller";
  export { default as UserController } from "./user-controller";
  ```

  This avoids collisions between controllers that share method names (`index`, `show`, `store`, ...).

- **Invokable controllers** (a single `__invoke` method) export their one action directly as the default export, so you call the controller itself:

  ```typescript
  import NamedInvokableController from "@js/types/data/app/http/controllers/named-invokable-controller";

  NamedInvokableController(); // { url: '/named-invokable', method: 'get' }
  ```

  If an invokable controller has _additional_ public actions besides `__invoke`, those are attached to the default export via `Object.assign` so you can still call them as properties (`InvokableModelBoundPlusController.extra(...)`).

- Multiple Laravel routes that map to the **same controller method** are de-duplicated into a single export — if one of them is named, the named route wins.
- Every `GET` route also carries `HEAD` in `methods` (Laravel registers `HEAD` implicitly for every `GET` route), so `.head(...)` and `.form.head(...)` are generated alongside `.get(...)` and `.form.get(...)`.
- A method decorated with `#[TsExclude]` (or a controller class decorated with it) is skipped entirely — see [Filtering & Excluding Routes](#filtering--excluding-routes).

### Anatomy of `defineRoute`

Every generated action looks like this:

```typescript
export const show = defineRoute({
  name: "posts.show", // Laravel route name, or omitted if unnamed
  url: "/posts/{post}", // URI template (or `{domain}{uri}` for domain routes)
  domain: "api.example.com", // only present for domain-restricted routes
  methods: ["get", "head"] as const,
  args: [{ name: "post", required: true, _routeKey: "id" }] as const,
  component: "PostShow", // only present for Inertia routes, see below
});
```

The value returned by `defineRoute()` is a callable object with:

| Member                                             | Description                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `route(...)`                                       | Calling it directly returns `{ url, method }`, using the route's primary (first declared) HTTP method.   |
| `route.url(...)`                                   | Same calling conventions as above, returns just the URL string.                                          |
| `route.get(...)`, `route.post(...)`, …             | One method per declared HTTP verb, returning `{ url, method }` for that specific verb.                   |
| `route.form(...)`                                  | Builds `{ action, method }` for an HTML `<form>` — see [Building Forms](#building-forms).                |
| `route.form.put(...)`, `route.form.delete(...)`, … | Per-verb form variants — these add Laravel's `_method` spoofing automatically.                           |
| `route.definition`                                 | The raw metadata object passed to `defineRoute()`.                                                       |
| `route.toString()`                                 | Returns the URL with no parameters substituted — lets you drop a route directly into a template literal. |
| `${route(...)}`                                    | Using a route directly in a template literal calls the route and inserts the URL string.                 |

### Calling a Route

All the conventions below are equivalent — pick whichever reads best at the call site:

```typescript
// Named object
PostController.show({ post: 42 });

// Positional spread
PostController.show(42);

// Positional array
PostController.show([42]);

// A model instance / any object with an `.id` or the bound route key
PostController.show(post); // post = { id: 42, title: '...' }
```

For routes with multiple parameters, the same conventions apply positionally or as named keys:

```typescript
UserPostController.show({ user: 2, post: 42 });
UserPostController.show(2, 42);
UserPostController.show([2, 42]);
UserPostController.show(someUser, somePost);
```

Passing a bare object (`PostController.show(post)`) only works for routes with **exactly one** declared parameter, and only when the object has an `id` property, a `_routeKey` property, or the property named by the route's binding key (e.g. `slug`).

#### Trailing query options

Any of the calling conventions above accept a trailing options object for query parameters (see [Query Parameters](#query-parameters)):

```typescript
PostController.show(42, { query: { preview: true } });
PostController.show({ post: 42 }, { query: { preview: true } });
```

A trailing argument is only treated as "options" (rather than a route parameter) when you pass **more arguments than the route declares** and the last one is a plain object that doesn't contain any of the route's parameter names.

### Model Binding

When a route parameter is type-hinted to an Eloquent model, the generated `args` entry includes a `_routeKey` field naming the column used to resolve it (mirroring Laravel's own [route model binding](https://laravel.com/docs/routing#route-model-binding)):

```typescript
// Route::get('/slug-posts/{slugPost:slug}', ...)
args: [{ name: 'slugPost', required: true, _routeKey: 'slug' }] as const,
```

At the call site, you can pass the raw key value or the object itself — `defineRoute` extracts `value[_routeKey]`, falling back to `value.id`:

```typescript
CustomRouteKeyController.show({ slugPost: "hello-world" });
CustomRouteKeyController.show(post); // post = { slug: 'hello-world', ... }
```

Because the binding is resolved structurally (via the `_routeKey` string), **the generated route file never imports the PHP model's TypeScript type** — you get full type inference (`string | number | { slug: string | number }`) without a single model import.

The column named by `_routeKey` comes from whatever `getRouteKeyName()` returns for that model,
whether that's the method itself overridden, `getKeyName()`/`$primaryKey` overridden, or (Laravel 13+)
a model carrying only the `#[RouteKey('slug')]` class attribute with no method override at all — see
[Models § Laravel 13 Model Attributes](https://tolki.abe.dev/ts/models.html#laravel-13-model-attributes).

### Enum Binding

Route parameters type-hinted to a [backed enum](https://www.php.net/manual/en/language.enumerations.backed.php) resolve the same way, using the enum's backing values instead of a route key:

```typescript
args: [{ name: 'status', required: true, _enumValues: [0, 1] }] as const,
```

```typescript
EnumBoundController.byStatus({ status: 0 }); // raw backing value
EnumBoundController.byStatus({ status: Status.Active }); // enum case value
EnumBoundController.byStatus({ status: Status.from(0) }); // a defineEnum() instance
```

Just like model binding, no enum import is required — TypeScript infers the union of valid backing values directly from `_enumValues`.

### Optional Parameters & `where` Constraints

Parameters from `{param?}` segments are marked `required: false` and become optional in both the named-object and positional forms:

```typescript
export const show = defineRoute({
  url: "/optional/{param?}",
  methods: ["get", "head"] as const,
  args: [{ name: "param", required: false }] as const,
});

OptionalParamController.show(); // '/optional'
OptionalParamController.show({ param: "x" }); // '/optional/x'
```

Parameters constrained with `->where(...)` in Laravel include a `where` regex, validated at runtime — an invalid value throws:

```typescript
args: ([{ name: "id", required: true, where: "[0-9]+" }] as const,
  TypedParamController.showInt({ id: "abc" }));
// throws: Route error: 'id' parameter 'abc' does not match required format '[0-9]+'.
```

### Domain Routes

Domain-restricted routes include a `domain` field, and their compiled URL is protocol-relative (so it works as-is with `fetch()` or an `<a href>`, resolving against whichever protocol the current page uses):

```typescript
export const index = defineRoute({
  url: "api.example.com/domain",
  domain: "api.example.com",
  methods: ["get", "head"] as const,
});

DomainController.index(); // '//api.example.com/domain'
```

### Query Parameters

Any argument key that doesn't match a declared route parameter becomes a query string parameter:

```typescript
PostController.index({ q: "search", page: 2 }); // '/posts?q=search&page=2'
```

- **Booleans** are encoded as `0`/`1` (matching how Laravel parses query input).
- **Arrays** use indexed notation: `tags[0]=a&tags[1]=b`.
- **`_query` escape hatch** — use this when a query key would otherwise collide with a route parameter name:

  ```typescript
  PostController.index({ sort: "created_at", _query: { sort: "desc" } });
  // '/posts/sort/created_at?sort=desc'
  ```

- **`mergeQuery`** — merges (and can delete, via `null`/`undefined` values) keys into the **current page's** query string, useful for updating one filter without losing the others:

  ```typescript
  // current URL: /posts?sort=name&page=3
  PostController.index({}, { mergeQuery: { page: 1 } });
  // '/posts?sort=name&page=1'
  ```

### Route Defaults

Mirrors Laravel's [`URL::defaults()`](https://laravel.com/docs/urls#default-values) — set values once and they're substituted automatically wherever a matching parameter name is required but not supplied:

```typescript
import { setRouteDefaults, addRouteDefault } from "@tolki/ts";

setRouteDefaults({ locale: "en" });
addRouteDefault("locale", "fr"); // overwrite a single key
```

`getRouteDefaults()` reads the current defaults, and `resetRouteDefaults()` clears them (handy in test setup/teardown).

### Building Forms

`.form(...)` builds `{ action, method, toString() }` for classic HTML `<form>` submissions, where `method` is always `'get'` or `'post'` (the only two methods HTML forms support). This matches [Laravel Wayfinder's](https://github.com/laravel/wayfinder) behavior exactly: the bare call already spoofs the route's primary method for you — there's no need to reach for a per-verb variant unless you want to submit as a _different_ verb than the route's first declared method.

```typescript
const { action, method } = PostController.store.form();
// action: '/posts', method: 'post'

PostController.update.form({ post: 42 });
// { action: '/posts/42?_method=PUT', method: 'post' } — primary method (PUT) spoofed automatically

PostController.destroy.form({ post: 42 });
// { action: '/posts/42?_method=DELETE', method: 'post' } — primary method (DELETE) spoofed automatically
```

Per-verb form methods (`.form.put(...)`, `.form.patch(...)`, `.form.delete(...)`, `.form.get(...)`, `.form.head(...)`) are only needed when a route supports multiple verbs and you want to submit as one that isn't the primary one:

```typescript
// A route registered for both PUT and PATCH — primary is 'put'
PostController.update.form(); // spoofs _method=PUT (primary)
PostController.update.form.patch({ post: 42 }); // explicitly spoofs _method=PATCH instead
```

`GET`/`POST` routes never get a spoof added, since HTML forms natively support both. `HEAD` submits as a `'get'` form action with `_method=HEAD` injected, since HTML forms can't submit `HEAD` directly.

### Inertia Integration

When `inertia.enabled` is on in the Laravel package's config, each action that renders an Inertia response automatically gets a `component` field and a page-props type — you never call the annotation helpers yourself, they're already applied in the generated file:

```typescript
export type PostPageProps = Inertia.SharedData & { post: Post };

export const post = annotatePageProps<PostPageProps>()(
  defineRoute({
    name: "inertia.post",
    url: "/inertia/post/{post}",
    methods: ["get", "head"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
    component: "PostShow",
  }),
);
```

Use `InferPageProps<typeof route>` on the frontend to read the page-props type back out — handy for typing a page component's props without a separate import:

```typescript
import type { InferPageProps } from "@tolki/ts";
import { post } from "@js/types/data/app/http/controllers/inertia-controller";

type Props = InferPageProps<typeof post>; // PostPageProps
```

#### Conditional (multi-component) routes

An action that conditionally renders different Inertia components (e.g. based on auth state) generates a `component` object instead of a string, plus a union page-props type:

```typescript
export type ConditionalAuthenticatedPageProps = Inertia.SharedData & {
  user: User | null;
};
export type ConditionalGuestPageProps = Inertia.SharedData & {
  message: string;
};

export const conditional = annotatePageProps<
  ConditionalAuthenticatedPageProps | ConditionalGuestPageProps
>()(
  defineRoute({
    url: "/inertia/conditional",
    methods: ["get", "head"] as const,
    component: {
      authenticated: "Conditional/Authenticated",
      guest: "Conditional/Guest",
    } as const,
  }),
);
```

`route.component` gives you the whole map, and `route.withComponent(componentValue, ...args)` tags a call result with a specific variant (it accepts one of the _values_ from the map, e.g. `'Conditional/Authenticated'`, not the key) — useful for logging or for selecting which frontend component to render based on which variant a given call represents.

Two renders of the **same** component are merged into one page-props type instead of a union, and a key that only one of them sets becomes optional — which is what you want, since a partial branch really can omit it.

#### What the props expression can be

The props argument is read as an expression, not just as a literal array, so the common controller shapes type without an annotation:

```php
public function show(Post $post, Request $request): Response
{
    $comments = Comment::query()->latest()->get();

    return Inertia::render('Posts/Show', [
        ...compact('post', 'comments'),
        'author'  => $request->user(),
        'page'    => $request->integer('page'),
        'related' => Post::query()->paginate(10),
        'tally'   => Inertia::defer(fn () => Comment::query()->count()),
    ]);
}
```

```typescript
export type ShowPageProps = Inertia.SharedData & {
  post: Post;
  comments: Comment[];
  author: User | null;
  page: number;
  related: LengthAwarePaginator<Post>;
  tally?: number;
};
```

- **Eloquent finders and collections** from the model their chain is rooted at: `find()`, `first()` and `firstWhere()` are `Model | null`; `findOrFail()`, `sole()`, `create()` and friends are `Model`; `all()` and `get()` are `Model[]`; `paginate()`, `simplePaginate()` and `cursorPaginate()` are the matching paginator generic; `count()` and `exists()` are `number` and `boolean`.
- **Route-bound model parameters** — a `Post $post` parameter is `Post` wherever the props name it.
- **`$request->user()`**, resolved through your `auth` config the same way [shared data](https://tolki.abe.dev/ts/inertia.html) resolves it, plus the typed `Request` reads (`integer()`, `boolean()`, `string()`, `url()`, …).
- **`compact('post', 'comments')`** and **`array_merge($base, [...])`**, each read as the array literal it is equivalent to.
- **The Inertia v2 prop wrappers** — `defer()`, `optional()` and `lazy()` type as the value they wrap and mark the key optional, since a partial reload can omit it; `always()`, `merge()` and `deepMerge()` type as the value they wrap.
- **API resources and resource collections**, typed from what they wrap, including a `#[PreserveKeys]` collection's keyed `data` member.
- **A props array assigned from a ternary**, and props delegated whole to a collaborator (`Inertia::render('X', $this->service->build())`).

An expression the analyzer cannot resolve types as `unknown` rather than failing the run; reach for `#[TsCasts]` when you want to say what it is.

### Inertia UI Table Props

Routes that render an [Inertia UI Table](https://inertiaui.com/) get a typed page prop without the package ever evaluating the table object's `toArray()` method — the prop type is inferred from the table's statically-declared resource model instead.

```php
use App\Tables\MerchandiseTable;
use Inertia\Inertia;

public function index()
{
    return Inertia::render('Merchandise/MerchandiseIndex', [
        'merchandise' => MerchandiseTable::make()->defaultSort('-id'),
    ]);
}
```

When the table declares a static resource model, the generated page prop uses `TableResource<TModel>`, imported directly from the Inertia UI Table package you have installed. The package is auto-detected from your `package.json` (`@inertiaui/table-vue` or `@inertiaui/table-react`):

```typescript
import type { TableResource } from "@inertiaui/table-vue";
import type { Merchandise } from "../models";

export type IndexPageProps = Inertia.SharedData & {
  merchandise: TableResource<Merchandise>;
};
```

If you use the React table package, the import is generated as `@inertiaui/table-react` instead. To force a specific package (or use a custom alias), set `inertia.ui_table_package` in `config/ts-publish.php`.

Supported model inference (all read statically, never instantiating the table):

- `protected ?string $resource = Merchandise::class;` — the model is read from the property's **default value**.
- A `query(): Builder` method returning `Merchandise::query()`, `Merchandise::class`, or a query chain rooted at the model class.
- Service-layer props where the controller passes `$this->resource->index($request)` and the service method returns an array containing table props.

Dynamic/stateful tables whose model only exists in runtime constructor state are not statically inferable; use `#[TsCasts]` on the controller method for fully custom prop typing.

### Sibling Actions on a Table Controller

A controller that renders a table needs no special handling, and neither do its other actions. Table
props are read by reflection and AST alone — the table class's `$resource` default or its `query()`
method — so `ts:publish` never instantiates a table or calls its `toArray()`, which is what builds the
export definition that reaches the optional Excel/PhpSpreadsheet integration. Every action on the
controller (`create`, `store`, `edit`, `update`) gets its page-prop type inferred from its own
`Inertia::render()` call, exactly like a controller with no table in it.

Earlier releases were not able to do this. A controller that mentioned a table anywhere — even in an
unrelated sibling action — had deep analysis skipped for all of its actions, so those routes got a
route helper but no `PageProps` type. That fallback is gone.

#### Overriding Props with `#[TsCasts]`

Whenever the analyzer cannot see the shape you want — a dynamic table whose model only exists in
runtime constructor state, a prop assembled somewhere the static read cannot follow — annotate the
method with `#[TsCasts([...])]` and the page-prop type is built from your cast map instead:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;

#[TsCasts(['tag' => 'Tag', 'mode' => 'string'])]
public function create(): \Inertia\Response
{
    return Inertia::render('Tags/TagCreate', [
        'tag'  => new Tag,
        'mode' => 'create',
    ]);
}
```

This produces:

```typescript
export type CreatePageProps = Inertia.SharedData & {
  tag: Tag;
  mode: string;
};
```

#### Removing the Route Entirely with `#[TsExclude]`

If you don't want a route helper generated at all, annotate the method with `#[TsExclude]`. This
removes the route from the published output entirely — no route helper and no page-prop type. Use this
only when the route should not appear in the TypeScript output.

### Form Request Payload Types

When a controller action type-hints a Laravel `FormRequest`, the request's generated TypeScript interface is attached the same way — automatically, via `annotateRequestPayload`:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  defineRoute({
    name: "posts.store",
    url: "/posts",
    methods: ["post"] as const,
  }),
);
```

Read it back with `InferRequestPayload<typeof route>`, e.g. to type an Inertia `useForm()` call:

```typescript
import type { InferRequestPayload } from "@tolki/ts";
import { store } from "@js/types/data/app/http/controllers/post-controller";

const form = useForm<InferRequestPayload<typeof store>>({
  title: "",
  body: "",
});
```

`annotatePageProps` and `annotateRequestPayload` are nested together when a single action needs both — again, generated automatically:

```typescript
export const store = annotateRequestPayload<StorePostRequest>()(
  annotatePageProps<StorePageProps>()(
    defineRoute({
      name: "inertia-form-request.store",
      url: "/inertia-form-request",
      methods: ["post"] as const,
      component: "InertiaFormRequest/Success",
    }),
  ),
);
```

### Filtering & Excluding Routes

- **`#[TsExclude]`** on a controller class excludes the whole controller; on a single action method, it excludes just that route.
- **`routes.only` / `routes.except`** — arrays of route-name patterns supporting wildcards (`'posts.*'`) and negation (`'!posts.index'`). Only one of the two should be set.
- **`routes.exclude_middleware`** — skip any route behind the listed middleware.
- **`routes.only_named`** — when `true`, only routes with an explicit `->name(...)` are published.

```php
// config/ts-publish.php
'routes' => [
    'only' => ['posts.*', '!posts.destroy'],
    'exclude_middleware' => ['throttle'],
],
```

### Casing

`routes.method_casing` (`'camel'` (default), `'snake'`, or `'pascal'`) controls the casing of each exported action's identifier — it does not affect the Laravel route name, only the generated variable name.

### Configuration Reference

The full list of `routes.*` and `inertia.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

### Type Reference

Exported from `@tolki/ts` (runtime) and `@tolki/types` (types only):

| Export                                                                                    | Description                                                                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `defineRoute()`                                                                           | Builds a route helper from compact metadata.                                                         |
| `annotatePageProps<T>()`                                                                  | Attaches an Inertia page-props phantom type (auto-applied in generated files).                       |
| `annotateRequestPayload<T>()`                                                             | Attaches a FormRequest payload phantom type (auto-applied in generated files).                       |
| `InferPageProps<T>`                                                                       | Reads the page-props type back off a route.                                                          |
| `InferRequestPayload<T>`                                                                  | Reads the request-payload type back off a route.                                                     |
| `setRouteDefaults()`, `addRouteDefault()`, `getRouteDefaults()`, `resetRouteDefaults()`   | Manage global route parameter defaults.                                                              |
| `formSafeOptions()`                                                                       | The `_method`-spoofing helper used internally by `.form.<verb>()` — exposed for advanced manual use. |
| `RouteArgMeta`, `RouteMetadata`, `RouteQueryOptions`                                      | The metadata shapes accepted by `defineRoute()`.                                                     |
| `DefineRouteResult`, `RouteCallResult`, `RouteFormResult`, `RouteCallResultWithComponent` | The shape of a route helper and its call results.                                                    |

## Vite Env

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) reads the `VITE_`-prefixed variables from your project's `.env` file and generates a `vite-env.d.ts` declaration file that augments Vite's own `ImportMetaEnv` interface — so `import.meta.env.VITE_APP_NAME` is fully typed on the frontend without hand-maintaining a separate declaration file.

As mentioned in [Installation & Usage](https://tolki.abe.dev/ts/index.html), this is the simplest generator in the package: no `@tolki/ts` runtime, no attributes, no per-item filtering — just a source file scan and a template render.

### How the Declaration File Is Generated

1. **Resolve the source file** — `vite_env.source_file` if configured; otherwise `.env` if it exists; otherwise `.env.example`.
2. **Parse `VITE_`-prefixed variables** — read the source file line by line, skip blank lines and `#` comments, extract the variable name before the `=` on each remaining line, and keep only names starting with `VITE_`.
3. **Sort and deduplicate** the variable names.
4. **Render `vite-env.d.ts`** from the variable list. If no `VITE_`-prefixed variables were found (or the source file doesn't exist), nothing is generated — the writer returns an empty string and no file is written.

### Anatomy of the Generated File

Given a `.env` file containing:

```env
APP_NAME=MyApp
DB_CONNECTION=mysql
VITE_APP_NAME="${APP_NAME}"
```

The package generates `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- Only `VITE_APP_NAME` is included — `APP_NAME` and `DB_CONNECTION` are skipped since they don't start with `VITE_`, matching [Vite's own convention](https://vite.dev/guide/env-and-mode.html#env-files) for which environment variables get exposed to client-side code.
- `/// <reference types="vite/client" />` pulls in Vite's own ambient types so the `ImportMetaEnv`/`ImportMeta` declarations here merge with (rather than replace) Vite's base declarations.
- Every variable is typed as `string` — regardless of the value written in the `.env` file (`true`, `123`, etc.), since Vite always provides raw strings at runtime via `import.meta.env`.

### Source File Resolution

The source file is resolved with this priority:

1. **`vite_env.source_file`**, if explicitly configured — an absolute path, or a path relative to the project root.
2. **`.env`**, if it exists at the project root.
3. **`.env.example`**, as the final fallback — useful in CI or a fresh clone where `.env` (gitignored) may not exist yet, but `.env.example` (committed) does.

```php
// config/ts-publish.php
'vite_env' => [
    'source_file' => '.env.production',
],
```

### Parsing Rules

- Lines are processed one at a time; leading/trailing whitespace is trimmed before checking.
- Blank lines and lines starting with `#` (comments) are skipped.
- A line without an `=` is skipped — there's nothing to extract a variable name from.
- The variable name is everything before the first `=` on the line; values, quotes, and inline comments after the value are not parsed or validated, only the name matters.
- Only names starting with `VITE_` are kept; everything else (`APP_NAME`, `DB_CONNECTION`, etc.) is silently ignored.
- The final list is sorted alphabetically and deduplicated before being passed to the template.

### Output Location

The output directory is resolved with this priority:

1. `vite_env.output_directory`, if set.
2. The global `output_directory`.

The filename is controlled by `vite_env.filename` (default `vite-env.d.ts`).

### No Filtering, Attributes, or Per-Item Config

Like [Broadcast Channels](https://tolki.abe.dev/ts/broadcast-channels.html#no-per-channel-attributes), Vite Env is a single-output feature with no per-class collection — there's no `included`/`excluded`/`additional_directories` config, and no `#[TsExclude]` support, since there's no PHP class to reflect on. To exclude a specific variable, simply don't prefix it with `VITE_` (Vite itself won't expose it to client code either), or disable the feature entirely with `vite_env.enabled = false`.

### Configuration Reference

The full list of `vite_env.*` config keys lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Vite Plugin

The `@tolki/ts` package provides a Vite plugin that watches for changes to the PHP files collected by the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) and automatically re-runs `php artisan ts:publish` when they change.

The Laravel package publishes a JSON manifest listing every collected PHP file — this plugin watches those exact files and reacts to changes in them, rather than watching your whole project.

### Command Execution Notes

The plugin runs the configured `command` with Node's `child_process.exec()` from the Vite project root.

This has two important consequences:

1. The command runs in a non-interactive shell.
2. Shell aliases such as `sail` are usually not available.

If you are using Laravel Sail and Vite is running on your host machine, prefer `./vendor/bin/sail artisan ts:publish` instead of `sail artisan ts:publish`.

If Vite is already running inside the PHP container, use `php artisan ts:publish`.

When the publish command rewrites the collected-files manifest, the plugin only reloads the watched file list. It does not run the publish command again for that manifest update, which prevents command loops.

### Usage

To use the Vite plugin, you need to add it to your Vite configuration file. Below is an example of how to add the plugin to your Vite configuration file:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [laravelTsPublish()],
});
```

#### Laravel Sail

Choose the command based on where `vite dev` is running:

- Vite running on the host machine: `./vendor/bin/sail artisan ts:publish`
- Vite running inside the container: `php artisan ts:publish`

Using just `sail artisan ts:publish` often fails because `sail` is commonly defined as a shell alias and aliases are not resolved by `exec()`.

### Default Functionality

By default, the plugin will work in the following way:

1. It will call `php artisan ts:publish` as the republish command when a file changes.
2. It will look for the list of transformed PHP files here: `resources/js/types/data/laravel-ts-collected-files.json`.
3. If that manifest file changes, it will reload the watched file list without calling the publish command again.
4. It will reload the page after a successful publish triggered by a watched PHP file change.
5. It will call the publish command on `vite build` before bundling, with `--only-functional` appended by default (since TypeScript interfaces are type-only and erased at compile time).
6. It will throw an error if the publish command fails on `vite build`.
7. When a single PHP file changes during `vite dev`, it will use `--source` to republish only that file instead of running a full publish.
8. It will append `--quiet` to every command by default, suppressing normal console output since the plugin determines success from the exit code. When the command fails, its captured error output is included in the plugin's error message.

#### Single-File Republishing

The JSON file list manifest uses the `filepath[]` array format (produced by `laravel-ts-publish`), the plugin will automatically use the `--source` flag to republish only the changed file during development:

```bash
# Instead of running the full command:
php artisan ts:publish

# The plugin runs a targeted command:
php artisan ts:publish --source="app/Enums/Status.php"
```

This can reduce per-change latency from seconds to near-instant on large projects with hundreds of files.

The plugin derives the source command automatically from the `command` option by appending `--source="{file}"`. You can customize this with the `sourceCommand` option or disable it entirely by setting `sourceCommand: false`.

Full startup commands (`runOnDevStart`, `runOnBuildStart`) always use the full `command` to ensure all files are generated.

#### Manifest Updates

The collected-files manifest is treated as configuration input for the watcher, not as a publish trigger.

That means when `ts:publish` updates `resources/js/types/data/laravel-ts-collected-files.json`, the plugin will refresh its internal watched-file list and continue. It will not immediately run `ts:publish` again from that manifest write.

### Plugin Options

The plugin accepts an options object to customize its behavior. It is recommended to use `.env` config settings to sync settings between the PHP side and the Vite plugin for the `filename` and `directory` options.

Below are the available options with a description and default values:

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      /**
       * The publish command to run when a watched PHP file changes.
       *
       * This command runs through Node's `exec()` from the Vite project root.
       * Shell aliases like `sail` are usually not available here.
       *
       * If Vite runs on the host machine and your app uses Sail, prefer
       * `./vendor/bin/sail artisan ts:publish`.
       *
       * If Vite already runs inside the PHP container, use
       * `php artisan ts:publish`.
       */
      command: "php artisan ts:publish",
      /**
       * The filename of the JSON manifest listing collected PHP files.
       */
      filename: "laravel-ts-collected-files.json",
      /**
       * The directory where the JSON manifest file exists, relative to the Vite root.
       */
      directory: "resources/js/types/data/",
      /**
       * Whether to run the publish command once when `vite dev` starts.
       *
       * Has no effect during `vite build`.
       */
      runOnDevStart: false,
      /**
       * Whether to run the publish command once before bundling during `vite build`.
       *
       * Has no effect during `vite dev`.
       */
      runOnBuildStart: true,
      /**
       * Whether to trigger a full browser reload after the
       * command runs successfully during `vite dev`.
       *
       * Has no effect during `vite build`.
       */
      reload: true,
      /**
       * Whether to throw an error (aborting the build) when the command fails.
       *
       * When not specified, defaults to `true` during `vite build`
       * and `false` during `vite dev`.
       *
       * When specified, it will apply to both `vite dev` and `vite build`.
       */
      failOnError: undefined,
      /**
       * The command template for single-file republishing during `vite dev`.
       *
       * When a watched PHP file changes, this command is used instead of the
       * full `command`. The `{file}` placeholder is replaced with the relative
       * file path from the manifest for the changed file (exactly as it
       * appears in the manifest array).
       *
       * When not specified, it is auto-derived by appending
       * ` --source="{file}"` to the `command` option.
       *
       * Set to `false` to always run the full command.
       */
      sourceCommand: 'php artisan ts:publish --source="{file}"',
      /**
       * Whether to append `--only-functional` to the command during `vite build`.
       *
       * TypeScript interfaces are type-only and erased at compile time, so
       * generating them during production builds is unnecessary.
       *
       * Has no effect during `vite dev`.
       */
      onBuildOnlyFunctional: true,
      /**
       * Whether to append `--quiet` to every artisan command the plugin runs.
       *
       * The plugin determines success or failure from the exit code, so
       * passing `--quiet` suppresses normal console output and Laravel
       * Prompts rendering, which speeds up execution. When the command
       * fails, its captured error output is still surfaced in the plugin's
       * failure message.
       */
      quiet: true,
    }),
  ],
});
```

#### Example for a Host-Machine Vite Dev Server with Sail

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      command: "./vendor/bin/sail artisan ts:publish",
    }),
  ],
});
```

#### Example for Vite Running Inside the Container

```javascript
import { defineConfig } from "vite";
import { laravelTsPublish } from "@tolki/ts/vite";

export default defineConfig({
  plugins: [
    laravelTsPublish({
      command: "php artisan ts:publish",
    }),
  ],
});
```

## Customizing the Pipeline

Every feature this package publishes — models, enums, resources, routes, form requests, broadcast channels, and broadcast events — runs through the same **Collector → Generator → Transformer → Writer → Template** pipeline, though not every feature uses all five stages. Each stage is swappable independently, per feature, via the config file: extend the built-in class, override the matching config key, and the rest of the pipeline keeps working unmodified.

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

### What Each Stage Does

- **Collector** — discovers the fully-qualified class names to publish (e.g. every model in `app/Models`), applying the feature's `included` / `excluded` / `additional_directories` config.
- **Generator** — orchestrates a single class's publish: builds a `Transformer`, hands it to a `Writer`, and holds the resulting file content. Also the integration point for the [generation cache](#cache-compatible-generators-rehydratesfromcache).
- **Transformer** — converts one PHP class into the structured data (a `Datable` DTO) that describes what should be in the TypeScript output — no string building, just data.
- **Writer** — renders a `Transformer`'s data through a **Template** (a Blade view) and writes the resulting file to disk.
- **Template** — the Blade view responsible for the actual TypeScript syntax. Publishable and editable independently of every other stage.

### Pipeline Stages Per Feature

Not every feature has all four swappable classes — broadcast channels, for example, has no per-class Generator or Transformer stage, since a channel is just a name string, not a PHP class to statically analyze. Each stage is swapped via a `{feature}.{stage}_class` config key (e.g. `models.collector_class`) — the table below shows the resulting default class for each stage.

| Feature            | Collector                    | Generator                 | Transformer                 | Writer                    |
| ------------------ | ---------------------------- | ------------------------- | --------------------------- | ------------------------- |
| Models             | `ModelsCollector`            | `ModelGenerator`          | `ModelTransformer`          | `ModelWriter`             |
| Enums              | `EnumsCollector`             | `EnumGenerator`           | `EnumTransformer`           | `EnumWriter`              |
| Resources          | `ResourcesCollector`         | `ResourceGenerator`       | `ResourceTransformer`       | `ResourceWriter`          |
| Routes             | `RoutesCollector`            | `RouteGenerator`          | `RouteTransformer`          | `RouteWriter`             |
| Form Requests      | `FormRequestsCollector`      | `FormRequestGenerator`    | `FormRequestTransformer`    | `FormRequestWriter`       |
| Broadcast Channels | `BroadcastChannelsCollector` | _(none)_                  | _(none)_                    | `BroadcastChannelsWriter` |
| Broadcast Events   | `BroadcastEventsCollector`   | `BroadcastEventGenerator` | `BroadcastEventTransformer` | `BroadcastEventWriter`¹   |

<sup>1</sup> Broadcast Events also has two additional writer stages beyond the table above: `index_writer_class` (writes the combined index file) and `echo_augmentation.writer_class` (writes the Echo module augmentation).

Its constructor used to take a second argument alongside `$findable` — an `Analyzer` instance from [Surveyor](https://github.com/laravel/surveyor), the library that typed broadcast events at the time. Events are now typed by the package's own [analyzer](https://tolki.abe.dev/ts/analyzer-api.html), and the constructor matches every other transformer:

```php
public function __construct(string $findable);
```

The protected methods a subclass hooks into moved with it, so re-check any existing override:

- **`convertType()` and `resolveArrayType()` are gone**, along with the `$analyzed` property, because all three took Surveyor types. This is the one that bites quietly: an override of a method the parent no longer calls is dead code, not an error, so a subclass that mapped a custom value object through `convertType()` keeps loading while its event types change underneath it.
- **`runAnalysis()`, `resolveBroadcastName()`, `resolveProperties()`, `convertClassType()` and `collectPropertyFqcns()` take or return different types.** These fail loudly — PHP rejects the incompatible declaration when the subclass loads — so you'll know immediately.

The four methods that decided which Eloquent model backs a resource have moved off the transformer into `AbeTwoThree\LaravelTsPublish\Ast\ModelClassResolver`, so the [analyzer](https://tolki.abe.dev/ts/analyzer-api.html) and the publish pipeline resolve a resource's model the same way. `resources.transformer_class` is still a supported override point; only these four names left it.

**Fails quietly — this is the whole of it, so check by hand:**

- **`modelFromDocblock()`, `modelFromAncestorDocblock()`, `guessModelFromConvention()` and `guessModelFromUseResourceAttribute()` are gone.** They were `protected` on `ResourceTransformer`; they are `private` on `ModelClassResolver`, which is `final`. A subclass that overrode any of them still compiles and still loads — the parent simply never calls it again. So a convention override that resolved, say, `App\Http\Resources\PostResource` to `App\Domain\Post` stops applying, every affected resource is silently typed against a different model, and nothing errors.

Nothing on `ResourceTransformer` changed signature, so unlike the transformer above there is no loud half to warn you.

**Migrating an override.** Two paths, in order of preference:

1. **Override `resolveModelClass()`**, still `protected` on `ResourceTransformer` and the single seam all four methods now sit behind. Set `$this->modelClass` and return `$this`:

```php
protected function resolveModelClass(): self
{
    parent::resolveModelClass();

    $this->modelClass ??= MyConvention::modelFor($this->reflectionResource);

    return $this;
}
```

2. **Bind a replacement for `ModelClassResolver`.** The pipeline resolves it from the container on every transform, so `$this->app->bind(ModelClassResolver::class, MyResolver::class)` in a service provider takes effect — but note it is auto-wired rather than registered, so there is no existing binding to decorate, and because the class is `final` a replacement cannot extend it. It must supply its own `resolve(ReflectionClass $resource): ?string`.

Each feature also has its own `*.template` config key (`models.template`, `enums.template`, `routes.template`, `form_requests.template`, `broadcast_channels.template`, and `broadcast_events.template` / `index_template` / `echo_augmentation.template`) pointing at the Blade view responsible for that feature's output syntax — see [Publishing & Editing Templates](#publishing-editing-templates).

#### Shared & Combined Writers

A few writers aren't tied to a single feature — they combine already-transformed data from multiple features, or write a single combined file:

| Writer              | Config Key             | Responsibility                                                                                                                                      |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BarrelWriter`      | `barrel_writer_class`  | Writes every namespace directory's barrel `index.ts` file — see [Modular Publishing](https://tolki.abe.dev/ts/modular-publishing.html#barrel-files) |
| `GlobalsWriter`     | `globals.writer_class` | Writes the global declaration file combining every model/enum interface                                                                             |
| `JsonWriter`        | `json.writer_class`    | Writes the combined JSON definitions file                                                                                                           |
| `WatcherJsonWriter` | `watcher.writer_class` | Writes the collected-file-paths JSON used by file watchers                                                                                          |

#### Features Without a Swappable Pipeline

Inertia and Vite Env are **not** part of this swappable pipeline — they have their own dedicated analysis logic (reading the `HandleInertiaRequests` middleware, or parsing `.env`) and only expose filename/output-directory config, with no `*_class` override keys. See [Inertia](https://tolki.abe.dev/ts/inertia.html) and [Vite Env](https://tolki.abe.dev/ts/vite-env.html) for their configuration options.

There is no config key for it, but the class is resolved from the container, so a subclass bound in a service provider is a real (if undocumented) override point. [Shared data](https://tolki.abe.dev/ts/inertia.html) is now typed by the package's own [analyzer](https://tolki.abe.dev/ts/analyzer-api.html) instead of Surveyor/Ranger, and the class changed with it.

**Fails quietly — check these by hand:**

- **The constructor no longer takes a `Laravel\Ranger\Collectors\InertiaSharedData`.** PHP ignores extra arguments passed to a class with no declared constructor, so `new InertiaSharedDataAnalyzer($collector)` keeps working and silently discards the collector.
- **`analyze()` returns `null` when no `Inertia\Middleware` subclass is discovered**, not when a collector came back empty.
- **`setAppPaths()` keeps its signature but no longer forwards to a collector.** It only records the paths `discoverMiddlewareClass()` scans, so an override that decorated the forwarding call now decorates nothing.
- **`buildTypeStringWithOverrides()` keeps its signature but not its argument shape.** Both parameters are now `array<string, array{type: string, optional: bool}>`; the first used to hold Surveyor `Type` objects, and the second plain type strings.
- **The result array gained a required `typeImports` key.** Anything constructing that array by hand — a test double, a subclass that builds its own result — must supply it, or the Blade template renders against an undefined variable.

**Fails loudly at class load:**

- **`buildResult()` is now `buildResult(string $middlewareClass)`** — the `SharedDataComponent` argument is gone.

New protected members a subclass can hook: `resolveWithAllErrors()`, `collectProps()`, `buildTypeImports()`, `forgetOverriddenChannels()`, and the `FRAMEWORK_OWNED_PROPS` constant that keeps `errors` out of the inferred shape.

Same situation as the shared-data analyzer above: no config key, but it is resolved from the container, so a subclass bound in a service provider is a real (if undocumented) override point. Per-route [page props](https://tolki.abe.dev/ts/routing.html#inertia-integration) are now typed by the package's own [analyzer](https://tolki.abe.dev/ts/analyzer-api.html) instead of Surveyor/Ranger, and this class was rewritten around that.

**Fails loudly:** the constructor no longer takes a `Laravel\Ranger\Collectors\Response`. Its single parameter is an optional `InertiaTableAnalyzer` override, so `new InertiaPageAnalyzer($collector)` raises a `TypeError` the moment it runs. Construct it with no arguments.

**Fails quietly — check these by hand:**

- **The four type-string rewrite passes are gone**: `rewritePaginatorGenerics()`, `rewritePaginatedResourceProps()`, `rewritePaginatedStaticCollectionProps()` and `rewriteResourceCollections()`, along with `buildPageType()` and `resolveSingularResourceFqcn()`. Paginators and resource collections are resolved from the props expression itself now, so an override of any of them is dead code rather than an error.
- **`buildTypeStringWithOverrides()` keeps its signature but not its argument shape.** Its first parameter is now `array<string, array{type: string, optional: bool}>`, where it used to hold Surveyor `Type` objects.
- **`buildPageData()` takes different arguments**: the per-component branch analyses, the analyzer they were produced by, and the `#[TsCasts]` overrides and import map — not a list of Ranger `InertiaResponse` objects and five prop-key maps.

**Also removed:** `InertiaTableAnalyzer::isTainted()` and `resolveComponent()`, and the whole table-taint family behind them. A controller that renders an Inertia UI Table no longer loses page types on its sibling actions — see [Sibling Actions on a Table Controller](https://tolki.abe.dev/ts/routing.html#sibling-actions-on-a-table-controller).

New protected members a subclass can hook: `analyzeAction()`, `analyzerFor()`, `collectComponentBranches()`, `analyzeProps()`, `propsArrayLiterals()`, `analyzeDelegatedProps()`, `collectProps()`, `usedFqcns()` and `forgetOverriddenChannels()`.

Neither had a config key, but both were `public` API in the loosest sense — importable, and referenced by at least one real integration. Both fail loudly, immediately.

- **`Analyzers\Inertia\ControllerPaginatorAnalyzer` is deleted.** It existed to recover paginator and resource-collection shapes that the old type-string rewrite passes could not, and it became callerless once page props moved onto the engine — paginators are resolved from the props expression itself now. Any `use` of it is a fatal `Class "…\ControllerPaginatorAnalyzer" not found`.
- **`Analyzers\SurveyorTypeMapper` is deleted, and its `TOLKI_TYPES_MAP` constant is renamed.** The map of PHP classes that `@tolki/types` declares TypeScript types for now lives at `Support\TolkiTypes::MAP`, on a class that does nothing else. Replace `SurveyorTypeMapper::TOLKI_TYPES_MAP` with `TolkiTypes::MAP`; the contents are unchanged. The rest of that class went with Surveyor.

### Abstract Base Classes

Every built-in class extends one of these four abstract base classes. A custom class must extend the matching one and implement its abstract methods.

#### `CoreCollector<TFindable>`

```php
abstract protected function defaultDirectory(): string;
abstract protected function classFilter(ReflectionClass $reflection): bool;

/** @return array{included: list<string>, excluded: list<string>, additional_directories: list<string>} */
abstract protected function finderSettings(): array;

/** @return Collection<int, class-string<TFindable>> */
public function collect(): Collection; // concrete — orchestrates the above
```

`collect()` itself is concrete and already handles merging `additional_directories`, `included`, and the default directory, filtering by `classFilter()`, and excluding anything matched by `excluded` or marked `#[TsExclude]`. A custom collector typically only needs to implement the three abstract methods.

#### `CoreGenerator<TGeneratable>`

```php
public function __construct(
    public protected(set) string $findable, // class-string<TGeneratable> — auto-calls generate()
) {}

abstract public function generate(): string;
abstract public function filename(): string;
```

The constructor calls `generate()` immediately, so by the time a `Generator` instance exists, `$this->content` should already hold the rendered output (typically by building a `Transformer` internally and delegating to a `Writer`).

#### `CoreTransformer<TTransformable>`

```php
public function __construct(
    protected string $findable, // class-string<TTransformable> — auto-calls transform()
) {}

public function fqcn(): string; // concrete

abstract public function transform(): self;
abstract public function filename(): string;
abstract public function data(): Datable;
```

`data()` returns a `Datable` DTO — plain structured data describing the output, not a rendered string. This is what gets handed to a `Writer` (and what gets cached — see below).

#### `CoreWriter<TTransformer of CoreTransformer>`

```php
public function __construct(
    protected Filesystem $filesystem, // constructor-injected
) {}

abstract public function write(CoreTransformer $transformer): string;
```

A `Writer` takes a `Transformer` instance and returns the rendered file content as a string (and, when `output_to_files` is enabled, is also responsible for actually writing it to disk).

### Cache-Compatible Generators (`RehydratesFromCache`)

The built-in generators (`ModelGenerator`, `EnumGenerator`, `ResourceGenerator`, `RouteGenerator`, `FormRequestGenerator`, `BroadcastEventGenerator`) all use the `AbeTwoThree\LaravelTsPublish\Generators\Concerns\RehydratesFromCache` trait to participate in the [generation cache](https://tolki.abe.dev/ts/generating-cache.html). It adds:

```php
public static function fromCache(string $findable, CoreTransformer $transformer, string $filename): static;

protected function hydrate(string $findable, CoreTransformer $transformer, string $filename): void;
```

`fromCache()` builds a generator instance via `ReflectionClass::newInstanceWithoutConstructor()` — skipping the normal constructor entirely, so `generate()` (and therefore the underlying `transform()` and file write) never runs again for a class the cache already has a valid, unchanged snapshot for. `hydrate()` then restores just enough state (`$findable`, the cached `$transformer`, and the cached `$filename`) for the rest of the pipeline (barrel writers, preview output, etc.) to treat it identically to a freshly generated instance.

Add this trait to a custom `*.generator_class` to opt it into the same behavior. A generator without it is always rebuilt from scratch on every run — correct, just not cached.

### Example: Swapping a Transformer

```php
namespace App\TypeScript;

use AbeTwoThree\LaravelTsPublish\Dtos\Contracts\Datable;
use AbeTwoThree\LaravelTsPublish\Transformers\ModelTransformer;

class CustomModelTransformer extends ModelTransformer
{
    public function transform(): self
    {
        parent::transform();

        // Add or adjust data before it reaches the Writer.

        return $this;
    }
}
```

```php
// config/ts-publish.php

'models' => [
    'transformer_class' => App\TypeScript\CustomModelTransformer::class,
],
```

The same pattern applies to a Collector, Generator, or Writer — extend the built-in class for the feature you want to customize, override just the behavior you need, and set the matching `*_class` config key.

### Publishing & Editing Templates

If you only need to change the generated TypeScript's formatting — not the underlying pipeline logic — publish the Blade templates directly instead of writing PHP classes:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views"
```

Then point the feature's `*.template` config key at your published (or entirely custom) Blade view.

## Analyzer API

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish)'s static analysis engine is also available directly, outside the `ts:publish` pipeline — hand it a class and a method name and get back the same typed property list the pipeline itself generates from. [Customizing the Pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html) covers swapping out a Collector, Generator, Transformer, or Writer; that page swaps pipeline stages; this page calls the analyzer directly.

### Analyzing a Method

`analyzeMethod()` walks a method's return value the same way it walks a `JsonResource`'s `toArray()` — nested array literals, conditionals, closures, and method calls are all understood, whether or not the class is a resource. `$method` defaults to `'toArray'`; pass any public method name to analyze a different one:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AstEngine;

$analysis = resolve(AstEngine::class)->analyzeMethod(App\Services\CartSummary::class, 'toPayload');
```

#### `MethodAnalysis`

Every analyzer entry point returns the same DTO:

```php
public function __construct(
    public array $properties = [],
    public array $enumResources = [],
    public array $nestedResources = [],
    public array $customImports = [],
    public array $directEnumFqcns = [],
    public array $modelFqcns = [],
    public array $inlineEnumFqcns = [],
    public array $inlineModelFqcns = [],
    public array $multiEnumResourceFqcns = [],
    public array $inlineEnumResourceFqcns = [],
    public ?string $flatTypeAlias = null,
    public ?string $flatTypeAliasFqcn = null,
) {}
```

`properties` is what most callers actually want: a `list<{name, type, optional, description}>` — one entry per key the method returns, with `type` already rendered as a TypeScript type string and `optional` set wherever the source pattern (a conditional method, a `mergeWhen()`, and so on) makes the key possibly-absent.

Everything else on the DTO is a bookkeeping channel, not something you read directly — `enumResources`, `directEnumFqcns`, `nestedResources`, `modelFqcns`, and their `inline*`/`multi*` siblings each record which property names reference which PHP class, so that class can be turned into an import. That's exactly what [`AnalysisImports`](#imports) below does with them. `flatTypeAlias` / `flatTypeAliasFqcn` are set only when the analyzed class collapses to a flat `export type X = Y[]` alias instead of an interface — a `ResourceCollection` with no extra keys beyond its wrapped items, for instance.

### Analyzing Public Properties

`analyzePublicProperties()` skips a method body entirely and reads a class's properties directly instead — every promoted constructor parameter, plus every public class-body property, `@var` docblock first and the reflected native type second. It's the shape a broadcast event or a plain DTO starts from:

```php
namespace App\Events;

class OrderShipped implements ShouldBroadcast
{
    /** @var list<string> */
    public array $tags = [];

    public function __construct(
        public int $orderId,
        public ?string $trackingNumber = null,
    ) {}

    public function broadcastOn(): Channel
    {
        // ...
    }
}
```

```php
$analysis = resolve(AstEngine::class)->analyzePublicProperties(App\Events\OrderShipped::class);

// $analysis->properties:
// [
//     ['name' => 'tags', 'type' => 'string[]', 'optional' => false, 'description' => ''],
//     ['name' => 'orderId', 'type' => 'number', 'optional' => false, 'description' => ''],
//     ['name' => 'trackingNumber', 'type' => 'string | null', 'optional' => false, 'description' => ''],
// ]
```

Two rules are worth calling out explicitly:

- **Nullable is always `| null`, never `?`.** `trackingNumber` above is a nullable native type, and it comes back `string | null` with `optional: false`. Whether the _key_ itself is allowed to be missing is a separate concern this method never decides — that's a `#[TsCasts]`-level choice for whatever builds a template from the result.
- **Trait-declared properties are excluded.** A property declared on a trait the class uses never appears in `properties` — including one supplied by a [`#[TsExtends]`](https://tolki.abe.dev/ts/extending-interfaces.html) trait, so its field isn't emitted both as a plain property here and again through the trait's own `extends` clause.

### Resources Get Resource Semantics

Call `analyzeMethod()` with a `JsonResource` subclass and no third argument, and the default `$method` (`'toArray'`) plus automatic backing-model resolution turn it into exactly what a resource's collector run through `ts:publish` produces:

```php
$analysis = resolve(AstEngine::class)->analyzeMethod(App\Http\Resources\PostResource::class);
```

Every pattern documented in [API Resources](https://tolki.abe.dev/ts/api-resources.html) resolves identically here — the `when()` conditional-method family, `EnumResource::make()`, nested and collection resources, `merge()` / `mergeWhen()`, and relation filters (`$this->author->only([...])`) all produce the same properties, FQCN channels, and optionality a full publish would. The only thing missing is the file: `analyzeMethod()` stops at the `MethodAnalysis` DTO, nothing is written to disk or folded into a barrel file.

### Imports

A `MethodAnalysis`'s FQCN channels aren't import paths by themselves — `AnalysisImports` turns them into resolved import paths for one specific generated file:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AnalysisImports;

$imports = new AnalysisImports()->build($analysis, 'app/services');

// $imports['typeImports']  => import path => list<type name>
// $imports['valueImports'] => import path => list<const name>  (enum-wrapping only)
```

The second argument is the _importing_ file's own namespace path — every path in the result is already resolved relative to it, using the same algorithm [Modular Publishing](https://tolki.abe.dev/ts/modular-publishing.html) documents. Two FQCN channels that land on the same import path are merged into one entry instead of one overwriting the other.

`build()` only resolves _what_ to import — never what to call it once it's imported. If two FQCNs feeding one `MethodAnalysis` share a bare type name across different namespaces (two classes both named `User`, say), both of their paths still come back in the result; turning that collision into two distinct aliases is the caller's job, not this method's.

### What It Cannot Do

**It analyzes a method, not an expression in a controller action.** [Inertia page props](https://tolki.abe.dev/ts/routing.html#inertia-integration) do run on this engine, but they come from an `Inertia::render()` call's _props argument_ rather than from a method's return shape, and they are resolved with a controller-tuned handler set over a scope seeded from the action's own signature — route-bound models, `Request` parameters, local variables. `analyzeMethod()` against a controller action therefore returns that method's return type analysis, not the action's page-prop type; there is no public entry point for the expression path. Inertia **shared data** is a plain `analyzeMethod()` call: `ts:publish` runs `analyzeMethod($middleware, 'share')`, so calling it on your `HandleInertiaRequests` returns exactly the shape `Inertia.SharedData` is built from. One presentation rule is applied on top of that analysis rather than by the engine: `analyzeMethod()` does return the `errors` key inherited from `Inertia\Middleware::share()`, and `InertiaSharedDataAnalyzer` drops it afterwards, since `@inertiajs/core` types `page.props.errors` itself.

[Broadcast Events](https://tolki.abe.dev/ts/broadcast-events.html) show the same split: `ts:publish` calls `analyzeMethod($event, 'broadcastWith')` when the event has that method — inherited or trait-supplied counts, the same as Laravel's own dispatch — and [`analyzePublicProperties()`](#analyzing-public-properties) when it doesn't, so both entry points return exactly the properties the published interface is built from. Two presentation rules are still applied on top of the analysis by the transformer rather than by the engine: `#[TsCasts]` overrides, and rendering a model property as `Partial<Model>`.

**No form-request rule parsing.** A `FormRequest`'s `rules()` method is typed by its own dedicated analyzer, not this engine — see [Form Requests](https://tolki.abe.dev/ts/form-requests.html). Neither `analyzeMethod()` nor `analyzePublicProperties()` has any special handling for a validation rule array.

**`unknown` is an honest floor, not a bug.** Every pattern this page documents is one the analyzer specifically recognizes; anything else — an expression it can't trace, a reassigned local, an unresolvable closure default — degrades to `unknown` rather than guessing. See [API Resources § Local Variables](https://tolki.abe.dev/ts/api-resources.html#local-variables) for what that looks like from the resource side.

Every feature that infers a type now runs on this engine — resources, broadcast events, and both Inertia features. What each one adds on top of the analysis is on its own feature page, linked above.

### Configuration Reference

The engine adds no config keys of its own — it reads whatever `enums.*` and `models.*` values are already set for [Enums](https://tolki.abe.dev/ts/enums.html), [Models](https://tolki.abe.dev/ts/models.html), and [API Resources](https://tolki.abe.dev/ts/api-resources.html). The full list lives in the [Configuration Reference](https://tolki.abe.dev/ts/configuration-reference.html).

## Configuration Reference

A complete reference of every option in `config/ts-publish.php`, grouped by feature.

### General Settings

| Config Key                    | Type     | Default                   | Description                                               |
| ----------------------------- | -------- | ------------------------- | --------------------------------------------------------- |
| `run_after_migrate`           | `bool`   | `true`                    | Re-publish types after running migrations                 |
| `output_to_files`             | `bool`   | `true`                    | Write generated TypeScript to `.ts` files                 |
| `output_directory`            | `string` | `resources/js/types/data` | Directory where TypeScript files are written              |
| `namespace_strip_prefix`      | `string` | `''`                      | Strip this prefix from namespaces in modular output       |
| `timestamps_as_date`          | `bool`   | `false`                   | Map date/datetime/timestamp to `Date` instead of `string` |
| `custom_ts_mappings`          | `array`  | `[]`                      | Override or extend PHP-to-TypeScript type mappings        |
| `ts_extends.models`           | `array`  | `[]`                      | Global `extends` clauses for all models                   |
| `ts_extends.resources`        | `array`  | `[]`                      | Global `extends` clauses for all resources                |
| `ts_extends.form_requests`    | `array`  | `[]`                      | Global `extends` clauses for all form requests            |
| `ts_extends.broadcast_events` | `array`  | `[]`                      | Global `extends` clauses for all broadcast events         |
| `barrel_writer_class`         | `string` | `BarrelWriter`            | Class that writes barrel `index.ts` files                 |

### Models (`models.*`)

| Config Key                        | Type     | Default                           | Description                                                                                                                                                                                                                                                                             |
| --------------------------------- | -------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `models.enabled`                  | `bool`   | `true`                            | Enable or disable model publishing                                                                                                                                                                                                                                                      |
| `models.namespace`                | `string` | `'models'`                        | Namespace label used in the global declaration file                                                                                                                                                                                                                                     |
| `models.relationship_case`        | `string` | `'snake'`                         | Case style for relationships: `snake`, `camel`, or `pascal`                                                                                                                                                                                                                             |
| `models.nullable_relations`       | `bool`   | `true`                            | Append `\| null` to singular relation types based on smart detection                                                                                                                                                                                                                    |
| `models.exclude_hidden`           | `bool`   | `false`                           | Omit Eloquent `$hidden` attributes — from model interfaces always, and from resource property sets wherever they're derived implicitly (see [API Resources § `exclude_hidden` and attribute filters](https://tolki.abe.dev/ts/api-resources.html#exclude-hidden-and-attribute-filters)) |
| `models.relation_nullability_map` | `array`  | `[]`                              | Override nullability strategy per relation type                                                                                                                                                                                                                                         |
| `models.template`                 | `string` | `laravel-ts-publish::model-split` | Blade template for model TypeScript output                                                                                                                                                                                                                                              |
| `models.included`                 | `array`  | `[]`                              | Only publish these models (empty = all)                                                                                                                                                                                                                                                 |
| `models.excluded`                 | `array`  | `[]`                              | Exclude these models from publishing                                                                                                                                                                                                                                                    |
| `models.additional_directories`   | `array`  | `[]`                              | Extra directories to search for models                                                                                                                                                                                                                                                  |
| `models.collector_class`          | `string` | `ModelsCollector`                 | Discovers PHP model classes                                                                                                                                                                                                                                                             |
| `models.generator_class`          | `string` | `ModelGenerator`                  | Orchestrates transforming and writing                                                                                                                                                                                                                                                   |
| `models.transformer_class`        | `string` | `ModelTransformer`                | Converts PHP class into TypeScript data                                                                                                                                                                                                                                                 |
| `models.writer_class`             | `string` | `ModelWriter`                     | Writes TypeScript model files                                                                                                                                                                                                                                                           |

### Enums (`enums.*`)

| Config Key                          | Type     | Default                    | Description                                                   |
| ----------------------------------- | -------- | -------------------------- | ------------------------------------------------------------- |
| `enums.enabled`                     | `bool`   | `true`                     | Enable or disable enum publishing                             |
| `enums.namespace`                   | `string` | `'enums'`                  | Namespace label used in the global declaration file           |
| `enums.method_case`                 | `string` | `'camel'`                  | Case style for enum methods: `snake`, `camel`, or `pascal`    |
| `enums.auto_include_methods`        | `bool`   | `false`                    | Include all public non-static enum methods without attributes |
| `enums.auto_include_static_methods` | `bool`   | `false`                    | Include all public static enum methods without attributes     |
| `enums.metadata_enabled`            | `bool`   | `true`                     | Include `_cases`, `_methods`, `_static` metadata on enums     |
| `enums.use_tolki_package`           | `bool`   | `true`                     | Wrap enums in `defineEnum()` from `@tolki/ts`                 |
| `enums.template`                    | `string` | `laravel-ts-publish::enum` | Blade template for enum TypeScript output                     |
| `enums.included`                    | `array`  | `[]`                       | Only publish these enums (empty = all)                        |
| `enums.excluded`                    | `array`  | `[]`                       | Exclude these enums from publishing                           |
| `enums.additional_directories`      | `array`  | `[]`                       | Extra directories to search for enums                         |
| `enums.collector_class`             | `string` | `EnumsCollector`           | Discovers PHP enum classes                                    |
| `enums.generator_class`             | `string` | `EnumGenerator`            | Orchestrates transforming and writing                         |
| `enums.transformer_class`           | `string` | `EnumTransformer`          | Converts PHP enum into TypeScript data                        |
| `enums.writer_class`                | `string` | `EnumWriter`               | Writes TypeScript enum files                                  |

### Resources (`resources.*`)

| Config Key                         | Type     | Default                        | Description                                         |
| ---------------------------------- | -------- | ------------------------------ | --------------------------------------------------- |
| `resources.enabled`                | `bool`   | `true`                         | Enable or disable resource publishing               |
| `resources.namespace`              | `string` | `'resources'`                  | Namespace label used in the global declaration file |
| `resources.template`               | `string` | `laravel-ts-publish::resource` | Blade template for resource TypeScript output       |
| `resources.included`               | `array`  | `[]`                           | Only publish these resources (empty = all)          |
| `resources.excluded`               | `array`  | `[]`                           | Exclude these resources from publishing             |
| `resources.additional_directories` | `array`  | `[]`                           | Extra directories to search for resources           |
| `resources.collector_class`        | `string` | `ResourcesCollector`           | Discovers PHP resource classes                      |
| `resources.generator_class`        | `string` | `ResourceGenerator`            | Orchestrates transforming and writing               |
| `resources.transformer_class`      | `string` | `ResourceTransformer`          | Converts PHP resource into TypeScript data          |
| `resources.writer_class`           | `string` | `ResourceWriter`               | Writes TypeScript resource files                    |

### Globals (`globals.*`)

| Config Key                 | Type      | Default                       | Description                                  |
| -------------------------- | --------- | ----------------------------- | -------------------------------------------- |
| `globals.enabled`          | `bool`    | `false`                       | Generate a `global.d.ts` namespace file      |
| `globals.output_directory` | `?string` | `null`                        | Directory for the global declaration file    |
| `globals.filename`         | `string`  | `laravel-ts-global.d.ts`      | Filename for the global declaration file     |
| `globals.template`         | `string`  | `laravel-ts-publish::globals` | Blade template for global declaration output |
| `globals.writer_class`     | `string`  | `GlobalsWriter`               | Writes global declaration file               |

### JSON (`json.*`)

| Config Key              | Type      | Default                       | Description                           |
| ----------------------- | --------- | ----------------------------- | ------------------------------------- |
| `json.enabled`          | `bool`    | `false`                       | Output all definitions as a JSON file |
| `json.filename`         | `string`  | `laravel-ts-definitions.json` | Filename for the JSON output          |
| `json.output_directory` | `?string` | `null`                        | Directory for the JSON output         |
| `json.writer_class`     | `string`  | `JsonWriter`                  | Writes JSON definitions file          |

### Watcher (`watcher.*`)

| Config Key                 | Type      | Default                           | Description                                                 |
| -------------------------- | --------- | --------------------------------- | ----------------------------------------------------------- |
| `watcher.enabled`          | `bool`    | `true`                            | Output collected PHP file paths as JSON (for file watchers) |
| `watcher.filename`         | `string`  | `laravel-ts-collected-files.json` | Filename for the collected files JSON                       |
| `watcher.output_directory` | `?string` | `null`                            | Directory for the collected files JSON                      |
| `watcher.writer_class`     | `string`  | `WatcherJsonWriter`               | Writes collected files JSON for watchers                    |

### Routes (`routes.*`)

| Config Key                  | Type      | Default                     | Description                             |
| --------------------------- | --------- | --------------------------- | --------------------------------------- |
| `routes.enabled`            | `bool`    | `true`                      | Enable or disable route publishing      |
| `routes.method_casing`      | `string`  | `'camel'`                   | Case style for route method names       |
| `routes.output_path`        | `?string` | `null`                      | Custom output path for route files      |
| `routes.only`               | `array`   | `[]`                        | Only publish these routes (empty = all) |
| `routes.except`             | `array`   | `[]`                        | Exclude these routes from publishing    |
| `routes.exclude_middleware` | `array`   | `[]`                        | Exclude routes with these middleware    |
| `routes.only_named`         | `bool`    | `false`                     | Only publish named routes               |
| `routes.collector_class`    | `string`  | `RoutesCollector`           | Discovers PHP routes                    |
| `routes.generator_class`    | `string`  | `RouteGenerator`            | Orchestrates transforming and writing   |
| `routes.transformer_class`  | `string`  | `RouteTransformer`          | Converts routes into TypeScript data    |
| `routes.writer_class`       | `string`  | `RouteWriter`               | Writes TypeScript route files           |
| `routes.template`           | `string`  | `laravel-ts-publish::route` | Blade template for route output         |

### Form Requests (`form_requests.*`)

| Config Key                             | Type      | Default                            | Description                                         |
| -------------------------------------- | --------- | ---------------------------------- | --------------------------------------------------- |
| `form_requests.enabled`                | `bool`    | `true`                             | Enable or disable form request publishing           |
| `form_requests.namespace`              | `string`  | `'form-requests'`                  | Namespace label used in the global declaration file |
| `form_requests.template`               | `string`  | `laravel-ts-publish::form-request` | Blade template for form request TypeScript output   |
| `form_requests.output_directory`       | `?string` | `null`                             | Custom output directory for form request files      |
| `form_requests.included`               | `array`   | `[]`                               | Only publish these form requests (empty = all)      |
| `form_requests.excluded`               | `array`   | `[]`                               | Exclude these form requests from publishing         |
| `form_requests.additional_directories` | `array`   | `[]`                               | Extra directories to search for form requests       |
| `form_requests.collector_class`        | `string`  | `FormRequestsCollector`            | Discovers PHP FormRequest classes                   |
| `form_requests.generator_class`        | `string`  | `FormRequestGenerator`             | Orchestrates transforming and writing               |
| `form_requests.transformer_class`      | `string`  | `FormRequestTransformer`           | Converts PHP FormRequest into TypeScript data       |
| `form_requests.writer_class`           | `string`  | `FormRequestWriter`                | Writes TypeScript form request files                |

### Broadcast Channels (`broadcast_channels.*`)

| Config Key                            | Type      | Default                                  | Description                                    |
| ------------------------------------- | --------- | ---------------------------------------- | ---------------------------------------------- |
| `broadcast_channels.enabled`          | `bool`    | `true`                                   | Enable or disable broadcast channel publishing |
| `broadcast_channels.filename`         | `string`  | `broadcast-channels.ts`                  | Filename for the generated channels file       |
| `broadcast_channels.template`         | `string`  | `laravel-ts-publish::broadcast-channels` | Blade template for the channels output         |
| `broadcast_channels.output_directory` | `?string` | `null`                                   | Custom output directory for the channels file  |
| `broadcast_channels.collector_class`  | `string`  | `BroadcastChannelsCollector`             | Discovers registered channel names             |
| `broadcast_channels.writer_class`     | `string`  | `BroadcastChannelsWriter`                | Writes the `broadcast-channels.ts` file        |

### Broadcast Events (`broadcast_events.*`)

| Config Key                                            | Type      | Default                                      | Description                                                            |
| ----------------------------------------------------- | --------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `broadcast_events.enabled`                            | `bool`    | `true`                                       | Enable or disable broadcast event publishing                           |
| `broadcast_events.index_filename`                     | `string`  | `broadcast-events.ts`                        | Filename for the combined index file                                   |
| `broadcast_events.index_template`                     | `string`  | `laravel-ts-publish::broadcast-events-index` | Blade template for the index file                                      |
| `broadcast_events.template`                           | `string`  | `laravel-ts-publish::broadcast-event`        | Blade template for each per-event interface file                       |
| `broadcast_events.output_directory`                   | `?string` | `null`                                       | Custom output directory for event files                                |
| `broadcast_events.included`                           | `array`   | `[]`                                         | Only publish these event classes (empty = all)                         |
| `broadcast_events.excluded`                           | `array`   | `[]`                                         | Exclude these event classes from publishing                            |
| `broadcast_events.additional_directories`             | `array`   | `[]`                                         | Extra directories to search for event classes                          |
| `broadcast_events.collector_class`                    | `string`  | `BroadcastEventsCollector`                   | Discovers `ShouldBroadcast` classes                                    |
| `broadcast_events.generator_class`                    | `string`  | `BroadcastEventGenerator`                    | Orchestrates transforming and writing                                  |
| `broadcast_events.transformer_class`                  | `string`  | `BroadcastEventTransformer`                  | Converts a PHP event class into TypeScript data                        |
| `broadcast_events.writer_class`                       | `string`  | `BroadcastEventWriter`                       | Writes per-event TypeScript files                                      |
| `broadcast_events.index_writer_class`                 | `string`  | `BroadcastEventsIndexWriter`                 | Writes the combined index file                                         |
| `broadcast_events.echo_augmentation.enabled`          | `bool`    | `true`                                       | Generate the Echo module augmentation file                             |
| `broadcast_events.echo_augmentation.echo_package`     | `?string` | `null`                                       | npm package to augment (auto-detected from `package.json` when `null`) |
| `broadcast_events.echo_augmentation.filename`         | `string`  | `echo-broadcast-events.d.ts`                 | Filename for the Echo augmentation file                                |
| `broadcast_events.echo_augmentation.template`         | `string`  | `laravel-ts-publish::echo-broadcast-events`  | Blade template for the Echo augmentation file                          |
| `broadcast_events.echo_augmentation.output_directory` | `?string` | `null`                                       | Custom output directory for the Echo augmentation file                 |
| `broadcast_events.echo_augmentation.writer_class`     | `string`  | `BroadcastEventsEchoWriter`                  | Writes the Echo augmentation file                                      |

### Inertia (`inertia.*`)

| Config Key                        | Type      | Default               | Description                                                                                                                                       |
| --------------------------------- | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inertia.enabled`                 | `bool`    | `true`                | Enable or disable Inertia shared-data and page-prop analysis                                                                                      |
| `inertia.inertia_middleware_path` | `?string` | `null`                | Directory to search for the `HandleInertiaRequests` middleware (defaults to `app_path()`)                                                         |
| `inertia.augmentation_filename`   | `string`  | `inertia-config.d.ts` | Filename for the generated module augmentation file                                                                                               |
| `inertia.output_directory`        | `?string` | `null`                | Custom output directory (falls back to `routes.output_directory`, then the global `output_directory`)                                             |
| `inertia.component_casing`        | `string`  | `'camel'`             | Casing style for derived page-prop export names (used by the per-route page-props feature — see [Routing](https://tolki.abe.dev/ts/routing.html)) |
| `inertia.ui_table_package`        | `?string` | `null`                | npm package used for InertiaUI Table integration (used by the per-route page-props feature)                                                       |

### Vite Environment (`vite_env.*`)

| Config Key                  | Type      | Default         | Description                                                           |
| --------------------------- | --------- | --------------- | --------------------------------------------------------------------- |
| `vite_env.enabled`          | `bool`    | `true`          | Enable Vite environment type generation                               |
| `vite_env.filename`         | `string`  | `vite-env.d.ts` | Filename for the Vite env declaration file                            |
| `vite_env.output_directory` | `?string` | `null`          | Custom output directory for the Vite env file                         |
| `vite_env.source_file`      | `?string` | `null`          | Source `.env` file (defaults to `.env`, falls back to `.env.example`) |

### Cache Generation (`cache.*`)

| Config Key        | Type      | Default                              | Description                                                            |
| ----------------- | --------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `cache.enabled`   | `bool`    | `true`                               | Skip re-generating unchanged classes after the first run               |
| `cache.store`     | `?string` | `null`                               | `null` = file cache under `directory`; or a Laravel cache store name   |
| `cache.directory` | `string`  | `storage/framework/cache/ts-publish` | Directory for the file-based cache manifest                            |
| `cache.key`       | `?string` | `null`                               | HMAC signing key for the cache (file and store); defaults to `app.key` |

See the [Cache Generation documentation](https://tolki.abe.dev/ts/generating-cache.html) for the full behavior, busting rules, and the `--fresh` flag.

> [!NOTE]
> Pipeline class config keys (`*.collector_class`, `*.generator_class`, `*.transformer_class`, `*.writer_class`) are included in their respective tables above. See [Customizing the Pipeline](https://tolki.abe.dev/ts/customizing-the-pipeline.html) for the full contract each class must implement.

See the [full configuration file](https://github.com/abetwothree/laravel-ts-publish/blob/main/config/ts-publish.php) for detailed comments on each option.

<!-- AUTO-GENERATED-DOCS:END -->
