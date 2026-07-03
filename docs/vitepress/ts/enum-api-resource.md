# Enum API Resource

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) ships with `EnumResource` — a Laravel [JSON resource](https://laravel.com/docs/eloquent-resources) that transforms a single PHP enum case into a flat, API-friendly array. It runs the enum through the exact same `EnumTransformer` pipeline used by `ts:publish`, so every `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` you've configured for TypeScript generation is automatically included in the JSON response too — no separate API-serialization logic to maintain.

As mentioned in [Installation & Usage](./index.md), the companion `AsEnum` TypeScript type (from `@tolki/ts`) is what gives you full type safety when consuming a response produced by this class — see [Typing API Responses with `AsEnum`](#typing-api-responses-with-asenum) below.

## Basic Usage

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
> Inside an API Resource's `toArray()`, you'll typically use the static `EnumResource::make($this->status)` form instead — this is also what generates the `AsEnum<typeof Status>` TypeScript property type automatically. See [Enum Properties with `EnumResource`](./api-resources.md#enum-properties-with-enumresource) in the API Resources docs.

`EnumResource` disables Laravel's default resource wrapping (`public static $wrap = ''`), so the response is the flat object shown below — not wrapped in a `data` key. If the enum is `null`, the resource resolves to `null` rather than an array.

## Response Shape

Every response includes these base keys, resolved from the matching case's (possibly `#[TsCase]`-overridden) name and value:

| Key      | Type            | Description                                         |
|----------|-----------------|------------------------------------------------------|
| `name`   | `string`        | The enum case name                                    |
| `value`  | `string \| int` | The backed value, or the case name for unit enums      |
| `backed` | `bool`          | Whether the enum is a backed enum                      |

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

## Unit Enums

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

## Relationship to TypeScript Publishing

`EnumResource` uses the same `EnumTransformer` pipeline as the `ts:publish` command — see [Enums](./enums.md) for the full attribute/auto-include reference. This means:

- Only methods marked with `#[TsEnumMethod]` / `#[TsEnumStaticMethod]` (or all public methods, when auto-include is enabled) are included.
- Methods with required parameters but no `params` on the attribute are excluded.
- The `enums.method_case` config setting applies to the method key names in the response — see [Casing Configurations](./casing-configuration.md).
- `#[TsExclude]` on a method excludes it from both the TypeScript output and the API response identically — see [Excluding Content](./excluding-content.md).

This guarantees the JSON response shape is always consistent with the TypeScript types this package generates — there's no separate serialization logic to keep in sync.

## Typing API Responses with `AsEnum`

The `@tolki/ts` package exports an `AsEnum` utility type that resolves the exact `EnumResource` JSON response shape for any published enum, giving you full type safety when consuming enum API responses on the frontend.

```typescript
import type { AsEnum } from '@tolki/ts';
import type { Status } from '@/types/enums';

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
const article: { id: number; status: AsEnum<typeof Status> } = await response.json();

if (article.status.value === 0) {
    // TypeScript knows this is the Draft case
    console.log(article.status.icon); // 'pencil'
}
```

See [Type Reference](./enums.md#type-reference) in the Enums docs for the full `AsEnum` signature alongside every other `@tolki/ts` export.

## Auto-Generated `{Model}Resource` Interfaces

When `enums.use_tolki_package` is enabled (the default), any model with enum-cast columns automatically gets a `{Model}Resource` companion set of interfaces. These replace each enum-backed property with `AsEnum<typeof EnumName>`, so you don't have to hand-compose `Omit<>` + `AsEnum<>` yourself whenever a property has been resolved to a full enum instance — whether via `Status::from($user->status)` in your own code, or because an API response already serialized it with `EnumResource`.

For a `Post` model that casts the database columns `status`, `visibility`, and `priority` to enums:

```typescript
export interface Post {
    id: number;
    title: string;
    content: string;
    status: StatusType;                // Original enum type
    visibility: VisibilityType | null; // Original enum type
    priority: PriorityType | null;      // Original enum type
}

// Auto-generated — no manual typing needed
export interface PostResource extends Omit<Post, 'status' | 'visibility' | 'priority'>
{
    status: AsEnum<typeof Status>;
    visibility: AsEnum<typeof Visibility> | null;
    priority: AsEnum<typeof Priority> | null;
}
```

```typescript
import type { PostResource } from '@js/types/data/models';

const response = await fetch('/api/posts/1');
const post: PostResource = await response.json();

post.status.value; // 0 | 1
post.status.icon;  // 'pencil' | 'check'
```

The interfaces are generated for both the `model-full` and `model-split` templates. In split mode, a `PostResource` interface is generated alongside the properties interface, and a separate `PostMutatorsResource` interface alongside the mutators interface, since mutators can also be enum-cast:

```typescript
export interface PostResource extends Omit<Post, 'status' | 'visibility' | 'priority'>
{
    status: AsEnum<typeof Status>;
    // ...
}

export interface PostMutators
{
    due_notice: DueAtNoticeType;
}

export interface PostMutatorsResource extends Omit<PostMutators, 'due_notice'>
{
    due_notice: AsEnum<typeof DueAtNotice>;
}
```

Naming conflicts are handled automatically — if two enum FQCNs share the same base name, namespace-prefixed aliases are used for both the type and const imports (e.g. `AppStatus`, `CrmStatus`). See [Enum-Typed Columns](./models.md#enum-typed-columns-modelresource) in the Models docs for the base/resolved interface distinction in full detail.

## Configuration Reference

`EnumResource` has no dedicated config of its own — it reuses the same `enums.*` settings (`method_case`, `auto_include_methods`, `auto_include_static_methods`) documented in the [Configuration Reference](./configuration-reference.md).
