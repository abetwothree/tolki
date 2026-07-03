# Extending Interfaces

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can add a TypeScript `extends` clause to any generated model, resource, form request, or broadcast event interface, so it can extend a hand-written interface for properties this package can't infer, or share common fields across many classes without duplication.

As mentioned in [Installation & Usage](./index.md), this works alongside every other feature — [models](./models.md), [API resources](./api-resources.md), [form requests](./form-requests.md), and [broadcast events](./broadcast-events.md) all support it identically, since they share the same underlying mechanism.

There are two ways to add an `extends` clause, and both apply together when present:

1. The **`#[TsExtends]` attribute** — scoped to one class (and inherited by anything that extends or uses it).
2. The **`ts_extends.*` config array** — applied globally to every generated interface of that type.

## `#[TsExtends]` Attribute

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

| Parameter | Type            | Default | Description                                                                                            |
|-----------|------------------|---------|----------------------------------------------------------------------------------------------------------|
| `extends` | `string`         | required | The raw TypeScript extends clause — a plain interface name, or a generic wrapper like `Pick<X, "a"\|"b">`. |
| `import`  | `?string`        | `null`  | The import path for the type(s) used in `extends`. Omit when the type is a global/ambient type that needs no import. |
| `types`   | `?list<string>`  | `null`  | Explicit list of identifiers to import from `import`. When `null`, they're auto-extracted from `extends`. |

`#[TsExtends]` is **repeatable** — stack as many as you need on the same class — and can be placed on:

- A model, resource, form request, or broadcast event class directly.
- Any **parent class** in its inheritance chain.
- Any **trait** used by the class or any of its parent classes.

Every `#[TsExtends]` attribute reachable from a class — its own, its traits', and (recursively) its parent classes' and their traits' — is combined into that class's single generated `extends` clause.

## Multiple Attributes & Named Arguments

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
import type { Auditable } from '@/types/audit';
import type { HasTimestamps } from '@/types/common';

export interface Warehouse extends HasTimestamps, Pick<Auditable, "created_by" | "updated_by">
{
    // ... columns, mutators, relations
}
```

Notice that `types` is only needed for the `Pick<Auditable, ...>` entry — `HasTimestamps` has no `types` array because when `types` is omitted (`null`), the package auto-extracts the identifier(s) to import directly from the `extends` string. You only need `types` when the extends string wraps the imported type in a generic like `Pick<>`/`Omit<>`/`Partial<>`, where auto-extraction can't reliably isolate the type name.

An entry with no `import` at all (just `extends`) is treated as an ambient/global type that's already available without an import — useful for a type declared in your own global `.d.ts` file.

## Inheriting from Parent Classes & Traits

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
import type { BaseResource } from '@/types/base';
import type { ResourceRoutes } from '@/types/resources';
import type { Routable } from '@/types/routing';
import type { Timestamps } from '@/types/util';

export interface WarehouseResource extends BaseResource, ExtendableInterface, Omit<Timestamps, "created_at" | "updated_at">, ResourceRoutes, Pick<Routable, "store" | "update">
{
    // ... resource properties
}
```

## Deduplication

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
import type { SharedInterface } from '@/types/shared';

export interface ChildSharedResource extends SharedInterface
{
}
```

## Global Config: `ts_extends.*`

To extend a shared interface across *every* generated interface of a given type, without adding `#[TsExtends]` to each class individually, use the `ts_extends` config array. It has one key per supported type — `models`, `resources`, `form_requests`, and `broadcast_events`:

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

Config-level entries combine with `#[TsExtends]` attributes on that same generated interface, and are deduplicated the same way. Take the real `broadcast_events` config entry above — `['extends' => 'HasTimestamps', 'import' => '@/types/common']` — alongside this real event, which uses a trait carrying the *identical* attribute:

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
import type { HasTimestamps } from '@/types/common';

export interface UserNotification extends HasTimestamps {
    userId: number;
    title: string;
    message: string;
}
```

## Naming Conflicts & Aliasing

Occasionally, two different `#[TsExtends]` entries (from any combination of attributes, traits, parent classes, or config) use the **same type name** but import it from **different paths**. Rather than silently colliding, the second occurrence is aliased using its import path's last segment as a prefix, and the extends clause is rewritten to use the alias:

```php
// Both entries reference a type named "Routable", but from different import paths
#[TsExtends('Routable', '@/types/routing')]
#[TsExtends('Routable', '@/types/legacy-routing')]
class Example { /* ... */ }
```

```typescript
import type { Routable } from '@/types/routing';
import type { Routable as RoutingRoutable } from '@/types/legacy-routing';

export interface Example extends Routable, RoutingRoutable
{
}
```

The deduplication and conflict-resolution rules, in order:

1. Identical `(extends, import)` pairs from any source (attribute, trait, parent class, or config) are kept once.
2. The same type name imported from the same path — across different extends clauses — produces a single import statement.
3. The same type name imported from two *different* paths gets the second (and subsequent) occurrences aliased, and the affected extends clause(s) rewritten to reference the alias.

## Configuration Reference

| Config Key                 | Type    | Default | Description                                           |
|-----------------------------|---------|---------|--------------------------------------------------------|
| `ts_extends.models`          | `array` | `[]`    | Global `extends` clauses applied to every model         |
| `ts_extends.resources`       | `array` | `[]`    | Global `extends` clauses applied to every resource      |
| `ts_extends.form_requests`   | `array` | `[]`    | Global `extends` clauses applied to every form request  |
| `ts_extends.broadcast_events`| `array` | `[]`    | Global `extends` clauses applied to every broadcast event |
