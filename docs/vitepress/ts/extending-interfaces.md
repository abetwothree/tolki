# Extending Interfaces

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) can add an `extends` clause to a generated model, resource, form request, or broadcast event interface. Use it to pull in a hand-written interface for properties the package can't infer, or to share common fields across many classes without repeating them. All four features support it the same way.

There are two ways to add an `extends` clause, and they combine when you use both:

- **The `#[TsExtends]` attribute**: applies to one class, and to any class that extends it or uses the trait it's on.
- **The `ts_extends.*` config arrays**: apply to every generated interface of one feature, such as every model.

An API resource can also be intersected with a type you write, such as a union an interface can't extend. See [Intersecting a Resource With `#[TsIntersect]`](#intersecting-a-resource-with-tsintersect).

## `#[TsExtends]` Attribute

The attribute takes the clause, an optional import path, and an optional list of names to import:

```php
namespace AbeTwoThree\LaravelTsPublish\Attributes;

use Attribute;

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

Each parameter controls one part of the clause:

| Parameter | Type            | Default  | Description                                                                                                                                                                                                                                                                                     |
| --------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extends` | `string`        | required | The TypeScript for the `extends` clause: an interface name, or a generic such as `Pick<X, "a" \| "b">`.                                                                                                                                                                                         |
| `import`  | `?string`       | `null`   | The path to import the clause's types from. Leave it out for a global type that needs no import.                                                                                                                                                                                                |
| `types`   | `?list<string>` | `null`   | The names to import from `import`. When it's `null`, the package reads the names from `extends`. On a model, form request, or broadcast event, that works only when `extends` has no generic in it. On a resource, see [Names a Resource's Clause Imports](#names-a-resource-s-clause-imports). |

`#[TsExtends]` is repeatable, so you can stack as many as you need. You can put it on any of these:

- A model, resource, form request, or broadcast event class.
- Any parent class in the class's inheritance chain.
- Any trait the class or one of its parent classes uses.

The package combines every `#[TsExtends]` it can reach from a class into that class's one `extends` clause. The class's own attributes come first, then those on its traits and parent classes, nearest first.

## Multiple Attributes & Named Arguments

This model stacks two attributes, and uses named arguments for `import` and `types`:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExtends;

#[TsExtends('HasTimestamps', import: '@/types/common')]
#[TsExtends('Pick<Auditable, "created_by" | "updated_by">', import: '@/types/audit', types: ['Auditable'])]
class Warehouse extends Model
{
    // ...
}
```

This generates:

```typescript
import type { Auditable } from "@/types/audit";
import type { HasTimestamps } from "@/types/common";

export interface Warehouse
  extends HasTimestamps, Pick<Auditable, "created_by" | "updated_by"> {
  // ... columns
}
```

On a model, the clause goes on the main interface, which holds the columns. The model's `WarehouseAll` interface extends that one, so it gets the clause too.

`HasTimestamps` needs no `types` array. When `types` is `null`, the package reads the names to import from the `extends` string itself. On a model, form request, or broadcast event, it can't pick the names out of a generic clause, such as `Pick<>`, `Omit<>`, or `Partial<>`, so without `types` the import comes out missing. Always list them in `types` there. A resource reads them, as [Names a Resource's Clause Imports](#names-a-resource-s-clause-imports) describes.

An entry with no `import` is treated as a global type that's already available, such as one declared in your own global `.d.ts` file.

## Inheriting From Parent Classes & Traits

`#[TsExtends]` on a parent class or a trait applies to every class that extends or uses it. This example combines three sources into one `extends` clause: a trait, a parent class, and the resource itself.

The trait has two attributes:

```php
#[TsExtends('ExtendableInterface')]
#[TsExtends('Omit<Timestamps, "created_at" | "updated_at">', '@/types/util', ['Timestamps'])]
trait ExtendsInterfaces {}
```

The parent class has two more:

```php
#[TsExtends('ResourceRoutes', '@/types/resources')]
#[TsExtends('Pick<Routable, "store" | "update">', '@/types/routing', ['Routable'])]
class RoutableResource extends JsonResource {}
```

The resource extends `RoutableResource`, uses the `ExtendsInterfaces` trait, and adds its own attribute:

```php
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

All five attributes end up in one `extends` clause: the resource's own first, then the trait's, then the parent class's:

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

## Deduplication

When a class can reach the same `#[TsExtends]` more than one way, the clause lists it once. A trait that both a parent class and its child use is the common case:

```php
#[TsExtends('SharedInterface', '@/types/shared')]
trait SharedExtendsInterface {}
```

A parent resource and its child both use the trait:

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

`ChildSharedResource` reaches `SharedExtendsInterface` through its own `use` statement and again through `BaseSharedResource`. `SharedInterface` still appears once in the generated interface:

```typescript
import type { SharedInterface } from "@/types/shared";

export interface ChildSharedResource extends SharedInterface {}
```

## Global Config: `ts_extends.*`

To extend a shared interface on every generated interface of one feature, use the `ts_extends` config array instead of adding `#[TsExtends]` to each class. It has one key per feature: `models`, `resources`, `form_requests`, and `broadcast_events`.

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

Each entry is a string or an array:

- **A string**: an `extends` clause with no import, for a global type.
- **An array**: `extends`, `import`, and optionally `types` keys, which work like the attribute's parameters.

Config entries combine with the `#[TsExtends]` attributes on the same interface. They come after the attributes in the clause, and a duplicate is removed the same way. Take the `broadcast_events` entry above, `['extends' => 'HasTimestamps', 'import' => '@/types/common']`, and an event that uses a trait with the same attribute:

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

The config entry and the trait's attribute have the same `extends` and `import`, so the clause lists `HasTimestamps` once:

```typescript
import type { HasTimestamps } from "@/types/common";

export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

## Naming Conflicts & Aliasing

Two entries can use the same type name from different import paths, from any mix of attributes, traits, parent classes, and config. The package then aliases every use of that name. Each alias is the PascalCase form of the last segment of its own import path, followed by the type name, and each affected clause uses its alias:

```php
// Both entries name a type "Routable", from different import paths.
#[TsExtends('Routable', '@/types/routing')]
#[TsExtends('Routable', '@/types/legacy-routing')]
class Example { /* ... */ }
```

This generates:

```typescript
import type { Routable as LegacyRoutingRoutable } from "@/types/legacy-routing";
import type { Routable as RoutingRoutable } from "@/types/routing";

export interface Example extends RoutingRoutable, LegacyRoutingRoutable {}
```

The package applies these rules in order:

1. Identical `extends` and `import` pairs from any source, whether attribute, trait, parent class, or config, are kept once.
2. The same type name from the same path, across different `extends` clauses, gets one import statement.
3. The same type name from two different paths is aliased everywhere it appears, each with the prefix from its own import path. Every clause that uses it is rewritten to the alias, even inside a generic such as `Pick<>`.

## Names a Resource's Clause Imports

On an API resource, a `#[TsExtends]`, a `#[TsIntersect]`, or a `ts_extends.resources` entry with an `import` and no `types` imports every name its type uses, at any depth. So `#[TsExtends('Pick<Base, "a" | "b">', '@/types/base')]` imports `Base`, and `Record<string, Meta>` imports `Meta`. Three rules decide which of those names the clause imports:

- **TypeScript's own globals stay unimported**: a name the clause only builds on, inside a generic or an object, gets no import when TypeScript or the DOM declares it, such as `Date`, `Record`, or `Response`. If a type of your own has such a name, such as `Error`, `Event`, `Comment`, `Image`, `Node`, or `Document`, list it in `types`.
- **A name the file already imports keeps that import**: a name the clause only builds on that the resource's file already imports, for one of its keys or through a `#[TsCasts]` entry, uses that import.
- **A name the clause names whole keeps its own import**: a clause that is one name, such as `Meta` or `Meta[]`, or a name you list in `types`, imports from the clause's path. If a `#[TsCasts]` entry imports the same name from another path, the clause's import is aliased.

`#[TsExtends]` and `#[TsIntersect]` on one resource share one alias pass, so the same name from two paths across both attributes is aliased as [Naming Conflicts & Aliasing](#naming-conflicts-aliasing) describes. A resource that publishes as a type alias, through [discriminated unions](./api-resources.md#discriminated-unions) or `#[TsIntersect]`, joins each `extends` clause with `&`, as in `export type WarehouseResource = BaseResource & { … }`.

## Intersecting a Resource With `#[TsIntersect]`

An interface can't extend a union, so `#[TsExtends]` can't relate one key of a resource to another. `#[TsIntersect]` intersects the resource's type with a type you write instead. Use it when the package can't read the link from `toArray()` itself, as [Discriminated Unions](./api-resources.md#discriminated-unions) describes. Here `is_draft` comes from a method call, which the package doesn't read as a discriminant:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsIntersect;

#[TsIntersect('PostStatusVariants', '@/types/posts')]
final class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'is_draft' => $this->isDraft(),
            'status' => $this->isDraft()
                ? new DraftStatusResource($this->draft_status)
                : new PublishedStatusResource($this->status),
        ];
    }
}
```

You write the union in your own module:

```typescript
// resources/js/types/posts.ts
import type {
  DraftStatusResource,
  PublishedStatusResource,
} from "@/types/generated/app/http/resources";

export type PostStatusVariants =
  | { is_draft: true; status: DraftStatusResource }
  | { is_draft: false; status: PublishedStatusResource };
```

The resource publishes its keys intersected with your type, so a check on `is_draft` narrows `status`:

<!-- prettier-ignore -->
```typescript
import type { PostStatusVariants } from "@/types/posts";
import type { DraftStatusResource, PublishedStatusResource } from ".";

export type PostResource = {
  id: number;
  is_draft: boolean;
  status: DraftStatusResource | PublishedStatusResource;
} & (PostStatusVariants);
```

`#[TsIntersect]` takes three parameters like `#[TsExtends]`'s: `type`, an optional `import` path, and an optional `types` list, read as [Names a Resource's Clause Imports](#names-a-resource-s-clause-imports) describes. It's repeatable, and a parent class or a trait can carry it, in the same order as `#[TsExtends]`. It has no config array. Each intersected type prints after the resource's own keys and any variants, in parentheses.

## Configuration Reference

Each `ts_extends` key applies to one feature's interfaces:

| Config Key                    | Type    | Default | Description                                               |
| ----------------------------- | ------- | ------- | --------------------------------------------------------- |
| `ts_extends.models`           | `array` | `[]`    | Global `extends` clauses applied to every model           |
| `ts_extends.resources`        | `array` | `[]`    | Global `extends` clauses applied to every resource        |
| `ts_extends.form_requests`    | `array` | `[]`    | Global `extends` clauses applied to every form request    |
| `ts_extends.broadcast_events` | `array` | `[]`    | Global `extends` clauses applied to every broadcast event |
