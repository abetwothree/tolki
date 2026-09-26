# Enum API Resource

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) ships `EnumResource`, a Laravel [JSON resource](https://laravel.com/docs/eloquent-resources) that turns one PHP enum case into a flat, API-friendly object. It follows the same rules as `ts:publish`, so every `#[TsEnumMethod]` and `#[TsEnumStaticMethod]` you set up for TypeScript also appears in the JSON response, and you don't maintain separate serialization logic.

On the frontend, the `AsEnum` type from `@tolki/ts` matches this response shape, so you can type any response that uses `EnumResource`. See [Typing API Responses With `AsEnum`](#typing-api-responses-with-asenum).

## Basic Usage

Return an enum case directly from a controller or route:

```php
use AbeTwoThree\LaravelTsPublish\EnumResource;
use App\Enums\Status;

return new EnumResource(Status::Published);
```

You can also use it inside another resource's `toArray()`, for an enum-cast model property or for any enum case:

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
            // Any enum case works, not only model properties
            'membership_level' => new EnumResource(MembershipLevel::Free),
        ];
    }
}
```

::: tip
Inside another resource, `EnumResource::make($this->status)` and `new EnumResource($this->status)` both publish the property as `AsEnum<typeof Status>`. See [Enum Properties With `EnumResource`](./api-resources.md#enum-properties-with-enumresource) on the API Resources page.

The same rewrite applies to [Inertia shared data](./inertia.md). With `enums.use_tolki_package` on (the default), an `EnumResource::make()` returned from your middleware's `share()` publishes as `AsEnum<typeof Role>` in `inertia-config.d.ts`, with `import { type AsEnum } from '@tolki/ts'` and an import of the `Role` const above the declarations. A shared key whose ternary picks between two different enums isn't rewritten. It publishes as `RoleType | StatusType` with neither enum imported, so TypeScript reports both names as missing (`TS2304`). Give both arms the same enum. See the `EnumResource` note in [How the Augmentation File Is Generated](./inertia.md#how-the-augmentation-file-is-generated).
:::

`EnumResource` turns off Laravel's resource wrapping (`public static $wrap = ''`), so the response is the flat object shown below, not wrapped in a `data` key. When the enum is `null`, the resource returns `null` instead of an object.

## Response Shape

Every response has these keys, taken from the matching case, with any `#[TsCase]` override applied:

| Key      | Type               | Description                                       |
| -------- | ------------------ | ------------------------------------------------- |
| `name`   | `string`           | The enum case name                                |
| `value`  | `string \| number` | The backed value, or the case name for unit enums |
| `backed` | `boolean`          | Whether the enum is a backed enum                 |

The response for `Status::Published`, with two instance methods, looks like this:

```json
{
  "name": "Published",
  "value": 1,
  "backed": true,
  "icon": "check",
  "color": "green"
}
```

Each instance method, marked with `#[TsEnumMethod]` or included by `enums.auto_include_methods`, adds a top-level key that holds the method's value for this case. Each static method, marked with `#[TsEnumStaticMethod]` or included by `enums.auto_include_static_methods`, adds a top-level key that holds its return value.

The response therefore has the same keys as the object you get when you call `.from()` on the published enum with the same value.

## Unit Enums

Unit enums work too. A unit enum has no backed value, so `value` repeats the case `name`, and `backed` is `false`:

```php
return new EnumResource(Role::Admin);
```

That call returns this response:

```json
{
  "name": "Admin",
  "value": "Admin",
  "backed": false
}
```

## Relationship to TypeScript Publishing

`EnumResource` follows the same rules as the `ts:publish` command. See [Enums](./enums.md) for the full attribute and auto-include reference. In practice:

- By default, only methods marked with `#[TsEnumMethod]` or `#[TsEnumStaticMethod]` are included. With auto-include on, public methods are included automatically.
- A method with required parameters and no `params` on its attribute is left out.
- `enums.method_case` sets the casing of the method keys in the response. See [`enums.method_case`](./casing-configuration.md#enums-method-case) on the Casing Configurations page.
- `#[TsExclude]` on a method removes it from both the TypeScript output and the response. See [Excluding Enum Methods](./excluding-content.md#excluding-enum-methods).

Because both follow the same rules, the JSON response has the same keys as the TypeScript enum this package publishes, with no second serializer to keep in sync.

## Typing API Responses With `AsEnum`

`@tolki/ts` exports an `AsEnum` type that describes the exact `EnumResource` response for any published enum, so you can type enum API responses on the frontend:

```typescript
import type { AsEnum } from "@tolki/ts";
import type { Status } from "@js/types/data/app/enums";

// Full discriminated union of all cases
type StatusResponse = AsEnum<typeof Status>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
// | { name: 'Published'; value: 1; backed: true; icon: 'check'; color: 'green'; ... }
```

The optional second type parameter narrows the type to one case, by value:

```typescript
// Narrowed to a single case
type DraftResponse = AsEnum<typeof Status, 0>;
// { name: 'Draft'; value: 0; backed: true; icon: 'pencil'; color: 'gray'; ... }
```

Use it to type an API response directly:

```typescript
const response = await fetch(`/api/articles/${id}`);
const article: { id: number; status: AsEnum<typeof Status> } =
  await response.json();

if (article.status.value === 0) {
  // TypeScript knows this is the Draft case
  console.log(article.status.icon); // 'pencil'
}
```

The [Type Reference](./enums.md#type-reference) on the Enums page lists the full `AsEnum` signature next to every other `@tolki/ts` export.

## Auto-Generated `{Model}Resource` Interfaces

With `enums.use_tolki_package` on (the default), a model with enum-cast columns also gets `{Model}Resource` interfaces. They replace each property typed as a single enum, or a list of one, either optionally `| null`, with `AsEnum<typeof EnumName>`, or `AsEnum<typeof EnumName>[]` for a list. An accessor typed as a shape, or as a union with other types, keeps its own type. Use these interfaces when a property holds a full enum instance, because your code resolved it with `Status.from(post.status)` or because an API response serialized it with `EnumResource`. You don't compose `Omit<>` and `AsEnum<>` yourself.

For a `Post` model that casts the columns `status`, `visibility` and `priority` to enums, the package publishes both interfaces:

```typescript
export interface Post {
  id: number;
  title: string;
  content: string;
  status: StatusType; // Original enum type
  visibility: VisibilityType | null; // Original enum type
  priority: PriorityType | null; // Original enum type
}

// Generated for you
export interface PostResource extends Omit<
  Post,
  "status" | "visibility" | "priority"
> {
  status: AsEnum<typeof Status>;
  visibility: AsEnum<typeof Visibility> | null;
  priority: AsEnum<typeof Priority> | null;
}
```

Type the API response with the `Resource` interface:

```typescript
import type { PostResource } from "@js/types/data/app/models";

const response = await fetch("/api/posts/1");
const post: PostResource = await response.json();

post.status.value; // 0 | 1
post.status.icon; // 'pencil' | 'check'
```

Both [model templates](./models.md#model-templates) generate these interfaces. The `model-full` template generates one `{Model}Resource` that covers columns and accessors together. The `model-split` template generates a `PostResource` beside the columns interface, and a separate `PostMutatorsResource` beside the mutators interface, since accessors can be enum-typed too:

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

When two enums share a class name, both imports get a namespace prefix, for the type and for the const. `App\Enums\Status` and `App\Crm\Enums\Status` import as `EnumsStatus` and `CrmStatus`, with `EnumsStatusType` and `CrmStatusType` for the types. See [Enum-Typed Columns](./models.md#enum-typed-columns-model-resource) on the Models page for how the main and `Resource` interfaces differ.

## Configuration Reference

`EnumResource` has no config of its own. It uses the same `enums.*` settings (`method_case`, `auto_include_methods` and `auto_include_static_methods`) listed in the [Configuration Reference](./configuration-reference.md).
