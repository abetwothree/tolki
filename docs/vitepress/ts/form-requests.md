# Form Requests

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) statically analyzes each `FormRequest`'s `rules()` method and converts it into a TypeScript interface describing the request payload — so the shape of a `useForm()` call, an Axios body, or a route's [request payload type](./routing.md#form-request-payload-types) always matches your actual validation rules.

As mentioned in [Installation & Usage](./index.md), form requests don't need the `@tolki/ts` runtime package — the output is a plain TypeScript interface (or a `Record<string, unknown>` type alias for [dynamic requests](#dynamic-requests)).

## How Form Request Types Are Generated

- One `.ts` file is generated per `FormRequest` class, at a modular, namespace-derived path (e.g. `App\Http\Requests\StorePostRequest` → `app/http/requests/store-post-request.ts`).
- Barrel `index.ts` files re-export everything (`export * from './store-post-request'`) per namespace directory, the same as [enums](./enums.md#how-enums-are-generated) and [models](./models.md#how-models-are-generated).
- The analyzer instantiates your `FormRequest` **without a real HTTP request or authenticated user** and calls `rules()` directly — it doesn't run a full validation pass, it just inspects the rule definitions you return.
- A fake stub user is bound during analysis so that `Auth::user()->someMethod()` calls inside `rules()` don't throw (the stub's `__call` returns `false` for any method) — this keeps rules that branch on `Auth::user()->isAdmin()`-style checks statically analyzable. Code that reads a property directly (`$this->user()->id`) or otherwise depends on real request state isn't covered by the stub and triggers the [dynamic fallback](#dynamic-requests) instead.

## Anatomy of a Generated Form Request

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
    "tags.*"?: string;
}
```

- `title` / `body` are required (the `required` rule), typed `string` (the `string` rule).
- `published` has no `required`/`sometimes` rule, so it's optional — even though `boolean` alone says nothing about presence.
- `rating` demonstrates that a [`#[TsCasts]`](#tscasts-overriding-field-types) override only replaces the *type* and *optionality* — the `nullable` rule's `| null` suffix is still appended by the analyzer afterward, giving `number | bigint | null` rather than just `number | bigint`.
- `email` picks up a [JSDoc metadata annotation](#jsdoc-metadata-annotations) (`@format email`) from the `email` rule.
- `tags` is upgraded from the bare `array` rule's `unknown[]` to `string[]` — first automatically (from the sibling `tags.*` wildcard rule), then explicitly overridden to the same value by `#[TsCasts]`.
- `"tags.*"` gets its own (quoted, since `.` isn't valid in a bare identifier) property describing the *element* constraint — see [Array & Nested Rules](#array-nested-rules) for why nested/wildcard paths always appear as their own optional property.
- The class docblock (none here) would become the interface's JSDoc comment; individual fields don't support their own docblocks since they come from array keys inside `rules()`, not separate PHP declarations — the [JSDoc metadata annotations](#jsdoc-metadata-annotations) fill that role instead.

## Rule-to-Type Mapping Reference

Rules are checked in this order — the first match wins:

1. `Rule::file()` / `Rule::dimensions()` (`File`/`Dimensions` objects) → **`File`**
2. `Rule::anyOf([...])` → union of each inner rule set's own resolved type
3. `Rule::enum(...)` → union of the enum's backing values (respects `.only()`/`.except()`)
4. `Rule::in(...)` / string `in:a,b,c` → union of literal values
5. Fluent rule objects: `Rule::date()`, `Email`, `Password`, `StringRule` → `string`; `Numeric` → `number`; `Rule::array()`/`Contains`/`DoesntContain` → `unknown[]`; `Rule::notIn(...)` → `string`
6. String rule names (see table below)
7. Anything unrecognized → **`unknown`**

<div class="collection-method-list" markdown="1">

[Strings](#strings) [Numbers](#numbers) [Booleans](#booleans) [Files](#files) [Arrays](#arrays)

</div>

#### Strings

`string`, `alpha`, `alpha_dash`, `alpha_num`, `ascii`, `current_password`, `hex_color`, `json`, `date`, `date_equals`, `date_format`, `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `regex`, `not_regex` → **`string`**

#### Numbers

`integer`, `int`, `numeric`, `decimal`, `digits`, `digits_between` → **`number`**

#### Booleans

`boolean`, `accepted`, `accepted_if`, `declined`, `declined_if` → **`boolean`**

#### Files

`file`, `image`, `mimes`, `mimetypes`, `extensions` → **`File`**

#### Arrays

`array`, `list` → **`unknown[]`** (upgraded to `T[]` automatically when a sibling `field.*` wildcard rule resolves to type `T` — see [Array & Nested Rules](#array-nested-rules))

## Presence, Nullability & Exclusion

| Rule | Effect |
|---|---|
| `required` (or any rule starting with `required`, including `Rule::requiredIf()`/`requiredUnless()`) | Field is **required** (no `?`) |
| `sometimes` | Field is optional, even combined with `required` |
| `nullable` | Adds `\| null` to the field's type |
| `missing` / `prohibited` | Field is **excluded from the interface entirely** — not just marked optional |

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

::: tip
Fields with no `required`/`sometimes` rule at all (e.g. a bare `'published' => ['boolean']`) are optional by default — presence must be declared explicitly, just like in Laravel's own validation.
:::

## Array & Nested Rules

Dot-notation (`meta.description`) and wildcard (`tags.*`) rule keys describe constraints on **nested values**, not top-level JSON keys you'd set directly — so they're always optional in the generated interface, and they still appear as their own (quoted) property alongside their parent:

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
        ];
    }
}
```

```typescript
export interface ArrayRulesRequest {
    tags?: string[];
    "tags.*"?: string;
    selected_ids: number[];
    "selected_ids.*"?: number;
}
```

Note that `selected_ids` itself is required (its own `required` rule applies), while `"selected_ids.*"` is still optional — the `.` in the path forces that regardless of the wildcard rule's own `required`.

## JSDoc Metadata Annotations

Certain rules attach a JSDoc comment above the field instead of (or in addition to) affecting its type:

| Rule(s) | Annotation |
|---|---|
| `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `hex_color` | `@format {rule}` |
| `date`, `date_equals` | `@format date` |
| `exists:table,column` / `Rule::exists(...)` | `@constraint exists` |
| `unique:table,column` / `Rule::unique(...)` | `@constraint unique` |
| `required_if`, `required_unless`, `required_with`, `required_without`, `required_with_all`, `required_without_all` | `@metadata required-conditionally` |
| `Rule::requiredIf(...)` / `Rule::requiredUnless(...)` | `@metadata required-if conditional` |
| `Rule::prohibitedIf(...)` / `Rule::prohibitedUnless(...)` | `@metadata prohibited-if conditional` |
| `Rule::excludeIf(...)` / `Rule::excludeUnless(...)` | `@metadata exclude-if conditional` |
| `not_in:a,b,c` | `@not a, b, c` |

```php
'category_id' => ['required', 'integer', 'exists:categories,id'],
```

```typescript
/** @constraint exists */
category_id: number;
```

## `#[TsCasts]` — Overriding Field Types

Same attribute (and array shape) used by [models](./models.md#tscasts) and resources — place it on the `FormRequest` class to override a field's inferred type, mark it optional, or add a field with a custom imported type:

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
import type { PostAttributes } from '@js/types/posts';

export interface UpdatePostRequest {
    title?: string;
    status: 'draft' | 'published' | 'archived';
    attributes?: PostAttributes;
}
```

::: warning
`#[TsCasts]` only replaces the field's **type** and **optionality** (via the `optional` key) — it does not clear a `nullable` rule already on that field. If the underlying rule includes `nullable`, the override's type still gets `| null` appended, same as in the [Anatomy](#anatomy-of-a-generated-form-request) example above.
:::

## `#[TsExtends]`

`FormRequest` classes support `#[TsExtends]` and the `ts_extends.form_requests` config array, the same generic interface-extension mechanism used everywhere else in this package. See [Extending Interfaces](https://tolki.abe.dev/ts/extending-interfaces) for the full attribute reference and config syntax.

## Dynamic Requests

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

::: tip
Method calls like `Auth::user()->isAdmin()` are safe — the analyzer stubs an authenticated user whose methods all return `false`. It's direct property access or anything else that needs *real* request/session data that triggers the fallback.
:::

## Filtering & Excluding Form Requests

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

See [Excluding Content](https://tolki.abe.dev/ts/excluding-content) for the full attribute behavior shared across models, enums, resources, and routes. There's no field-level equivalent for form requests — rules live in a single `rules()` array rather than individual methods, so exclusion is class-only.

## Route Integration

When a controller action type-hints a `FormRequest`, its generated interface is automatically attached to that action's route export via `annotateRequestPayload<T>()` — no configuration needed. See [Form Request Payload Types](./routing.md#form-request-payload-types) in the Routing docs for the full `annotateRequestPayload` / `InferRequestPayload` reference.

## Configuration Reference

The full list of `form_requests.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).
