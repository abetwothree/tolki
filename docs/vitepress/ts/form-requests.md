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
}
```

- `title` / `body` are required (the `required` rule), typed `string` (the `string` rule).
- `published` has no `required`/`sometimes` rule, so it's optional — even though `boolean` alone says nothing about presence.
- `rating` demonstrates that a [`#[TsCasts]`](#tscasts-overriding-field-types) override only replaces the _type_ and _optionality_ — the `nullable` rule's `| null` suffix is still appended by the analyzer afterward, giving `number | bigint | null` rather than just `number | bigint`.
- `email` picks up a [JSDoc metadata annotation](#jsdoc-metadata-annotations) (`@format email`) from the `email` rule.
- `tags` is upgraded from the bare `array` rule's `unknown[]` to `string[]` — first automatically (from the sibling `tags.*` wildcard rule), then explicitly overridden to the same value by `#[TsCasts]`.
- `tags.*` does **not** get a property of its own. A dot-notation or wildcard rule key describes a value _inside_ `tags`, so it composes into `tags` instead of being emitted alongside it as a quoted `"tags.*"` key — see [Array & Nested Rules](#array-nested-rules).
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

`array`, `list` → **`unknown[]`** (upgraded to `T[]` automatically when a sibling `field.*` wildcard rule resolves to type `T` — see [Array & Nested Rules](#array-nested-rules); upgraded to a keyed object instead when `required_array_keys`/`in_array_keys`/`array:` names its keys — see [Key-list rules](#key-list-rules-known-keys-without-a-full-shape))

## Presence, Nullability & Exclusion

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

::: tip
Fields with no `required`/`sometimes` rule at all (e.g. a bare `'published' => ['boolean']`) are optional by default — presence must be declared explicitly, just like in Laravel's own validation.
:::

## Array & Nested Rules

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

### Nested edge cases

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

### Key-list rules: known keys without a full shape

Three validation rules describe an array's keys without declaring a full nested shape for them.
Each declared key becomes a synthesized `unknown`-typed property instead of the array collapsing
to `unknown[]` — this is the fix for a `config` field that used to come out `unknown[]` even though
`in_array_keys:timezone` tells you exactly which key to expect. The rules differ in whether Laravel's
validator actually guarantees the key is present, and the emitted `?` follows that:

| Rule                      | Meaning                                                               | PHP                                                                      | TypeScript                                                     |
| ------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `required_array_keys:a,b` | all listed keys must be present                                       | `'permissions' => ['required','array','required_array_keys:read,write']` | `permissions: { read: unknown; write: unknown };`              |
| `in_array_keys:a,b`       | at least one listed key must be present — no single key is guaranteed | `'config' => ['required','array','in_array_keys:timezone']`              | `config: { timezone?: unknown };`                              |
| `array:a,b`               | restricts which keys are allowed; says nothing about presence         | `'preferences' => ['nullable','array:theme,locale']`                     | `preferences?: { theme?: unknown; locale?: unknown } \| null;` |

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

## JSDoc Metadata Annotations

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
import type { PostAttributes } from "@js/types/posts";

export interface UpdatePostRequest {
  title?: string;
  status: "draft" | "published" | "archived";
  attributes?: PostAttributes;
}
```

::: warning
`#[TsCasts]` only replaces the field's **type** and **optionality** (via the `optional` key) — it does not clear a `nullable` rule already on that field. If the underlying rule includes `nullable`, the override's type still gets `| null` appended, same as in the [Anatomy](#anatomy-of-a-generated-form-request) example above.
:::

::: warning
`#[TsCasts]` keys match **generated field names**, and a dot-notation rule key never becomes one — it [composes into its parent](#array-nested-rules). A key like `'order.id'` or `'tags.*'` matches nothing and is silently ignored; it does not add a field either. Override the parent (`'order'`, `'tags'`) to replace the whole shape, or make the rule itself precise enough not to need an override. The only dotted key that matches is one whose dot was escaped in the rule (`'v1\.0'` generates the field `"v1.0"`, so `'v1.0'` overrides it).
:::

## `#[TsExtends]`

`FormRequest` classes support `#[TsExtends]` and the `ts_extends.form_requests` config array, the same generic interface-extension mechanism used everywhere else in this package. See [Extending Interfaces](./extending-interfaces.md) for the full attribute reference and config syntax.

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
Method calls like `Auth::user()->isAdmin()` are safe — the analyzer stubs an authenticated user whose methods all return `false`. It's direct property access or anything else that needs _real_ request/session data that triggers the fallback.
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

See [Excluding Content](./excluding-content.md) for the full attribute behavior shared across models, enums, resources, and routes. There's no field-level equivalent for form requests — rules live in a single `rules()` array rather than individual methods, so exclusion is class-only.

## Route Integration

When a controller action type-hints a `FormRequest`, its generated interface is automatically attached to that action's route export via `annotateRequestPayload<T>()` — no configuration needed. See [Form Request Payload Types](./routing.md#form-request-payload-types) in the Routing docs for the full `annotateRequestPayload` / `InferRequestPayload` reference.

## Configuration Reference

The full list of `form_requests.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).
