# Form Requests

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) turns each `FormRequest` into a TypeScript interface for its payload, built from the rules your `rules()` method returns. The shape of a `useForm()` call, an Axios body or a route's [request payload type](./routing.md#form-request-payload-types) then matches your validation rules. You don't maintain a second type by hand.

Form requests don't need the `@tolki/ts` runtime. Each one publishes as a plain TypeScript interface, or as a `Record<string, unknown>` alias for a [dynamic request](#dynamic-requests). See [Installing `@tolki/ts`](./index.md#installing-tolki-ts) for the features that do.

## How Form Request Types Are Generated

The package looks for form requests in `app/Http/Requests` and publishes each one it finds. The output follows these rules:

- **One file per request**: the path comes from the namespace, so `App\Http\Requests\StorePostRequest` becomes `app/http/requests/store-post-request.ts`.
- **Barrels**: each namespace directory gets an `index.ts` that re-exports every file (`export * from './store-post-request'`), the same as for [enums](./enums.md#how-enums-are-generated) and [models](./models.md#how-models-are-generated).
- **Rules come from `rules()`**: the package builds your form request without a real HTTP request and calls `rules()`. It reads the rules you return and runs no validation. [Dynamic Requests](#dynamic-requests) covers what `rules()` can and can't do during a publish.

## Anatomy of a Generated Form Request

This request uses the common rule types and a `#[TsCasts]` override:

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

The package publishes this interface:

```typescript
/** @see App\Http\Requests\StorePostRequest */
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

Each field shows one rule at work:

- **`title` and `body`** are required, from the `required` rule, and typed `string`, from the `string` rule.
- **`published`** has no `required` rule, so it's optional, even though `boolean` alone says nothing about presence.
- **`rating`** shows that a [`#[TsCasts]`](#overriding-field-types-with-tscasts) override replaces only the type and the `?`. The `nullable` rule still adds `| null`, giving `number | bigint | null` rather than `number | bigint`.
- **`email`** gets a [JSDoc annotation](#jsdoc-metadata-annotations), `@format email`, from the `email` rule.
- **`tags`** is `string[]` instead of the bare `array` rule's `unknown[]`. The sibling `tags.*` rule sets that type, and `#[TsCasts]` then sets it to the same value.
- **`tags.*`** gets no property of its own. A dot-notation or wildcard rule key describes a value inside `tags`, so it composes into `tags` instead of appearing as a quoted `"tags.*"` key. See [Array & Nested Rules](#array-nested-rules).

The interface's JSDoc comment is the description in the docblock of `rules()`, or in the class docblock when `rules()` has none. Fields have no docblocks of their own, since they're keys in the `rules()` array. [JSDoc metadata annotations](#jsdoc-metadata-annotations) fill that role instead.

## Rule-to-Type Mapping Reference

The package checks a field's rules in this order, and the first match sets its type:

1. `File` rule objects, such as `Rule::file()` or `File::image()`, give `File`.
2. `Rule::anyOf([...])` gives a union of each inner rule set's type.
3. `Rule::enum(...)` gives a union of the enum's backing values, honoring `->only()` and `->except()`. An enum with no backing values gives `string`.
4. `Rule::in(...)` or `in:a,b,c` gives a union of literal values, quoted or not, as [Numeric `in:` Literals](#numeric-in-literals) explains.
5. Other rule objects: `Rule::date()`, `Email`, `Password` and `StringRule` give `string`. `Numeric` gives `number`. `Rule::dimensions()` gives `File`. `Rule::array()`, `Contains` and `DoesntContain` give `unknown[]`. `Rule::notIn(...)` gives `string`.
6. String rule names, from the table below.
7. Anything else gives `unknown`.

String rule names map to these types:

| Rules                                                                                                                                                                                                                                         | Type        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `string`, `alpha`, `alpha_dash`, `alpha_num`, `ascii`, `current_password`, `hex_color`, `json`, `date`, `date_equals`, `date_format`, `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `regex`, `not_regex` | `string`    |
| `integer`, `int`, `numeric`, `decimal`, `digits`, `digits_between`                                                                                                                                                                            | `number`    |
| `boolean`, `accepted`, `accepted_if`, `declined`, `declined_if`                                                                                                                                                                               | `boolean`   |
| `file`, `image`, `mimes`, `mimetypes`, `extensions`                                                                                                                                                                                           | `File`      |
| `array`, `list`                                                                                                                                                                                                                               | `unknown[]` |

An `array` or `list` field gets a sharper type when you describe its contents. A sibling `field.*` rule that resolves to a type `T` makes the field `T[]`, as [Array & Nested Rules](#array-nested-rules) shows. A rule that lists its keys, such as `required_array_keys`, makes it an object with those keys, as [Key-List Rules](#key-list-rules-known-keys-without-a-full-shape) shows.

### Numeric `in:` Literals

`Rule::in([1, 2, 3])` carries real integers, so it publishes `1 | 2 | 3`. The string form can't, because Laravel's rule parser reads `in:1,2,3` as strings. So `'legacy_code' => ['string', 'in:1,2,3']` publishes the quoted `'1' | '2' | '3'`.

A sibling rule that declares the field numeric makes the values unquoted. Those rules are the `number` row of the table above: `integer`, `int`, `numeric`, `decimal`, `digits` and `digits_between`:

```php
'priority_level' => ['required', 'integer', 'in:1,2,3'],      // 1 | 2 | 3
'digit_grade' => ['digits:1', 'in:1,2,3'],                    // 1 | 2 | 3
'decimal_tier' => ['decimal:1', 'in:1.5,2.5'],                // 1.5 | 2.5
'legacy_code' => ['required', 'string', 'in:1,2,3'],          // '1' | '2' | '3'
```

A value loses its quotes only when it reads back as the same text. Laravel's `in` rule compares the raw input string against each listed value, so a padded or reformatted value stays a string. Publishing it as a number would describe a value Laravel rejects:

```php
'padded_numeric_code' => ['required', 'numeric', 'in:007,2.50'],  // '007' | '2.50'
'padded_decimal_tier' => ['decimal:2', 'in:1.50,2.50'],           // '1.50' | '2.50'
```

## Presence, Nullability & Exclusion

These rules decide whether a field is optional, nullable or left out:

| Rule                                                                                                           | Effect                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `required`, or any rule starting with `required` (including `Rule::requiredIf()` and `Rule::requiredUnless()`) | The field is required, with no `?`.                                                                                                                                                  |
| `sometimes`                                                                                                    | The field is optional, even alongside `required`.                                                                                                                                    |
| `nullable`                                                                                                     | Adds `\| null` to the field's type.                                                                                                                                                  |
| `missing` or `prohibited`                                                                                      | The field is left out of the interface entirely, not only marked optional. A nested key is dropped from its parent's shape instead. See [Array & Nested Rules](#array-nested-rules). |

This example shows each rule's effect in a comment:

```php
public function rules(): array
{
    return [
        'title' => ['required', 'string'],   // title: string;
        'slug' => ['sometimes', 'required', 'string'], // slug?: string;
        'notes' => ['nullable', 'string'],   // notes?: string | null;
        'internal_id' => ['prohibited'],     // left out
    ];
}
```

::: tip
A field with no `required` rule, such as a bare `'published' => ['boolean']`, is optional. As in Laravel's validation, a field without `required` may be missing from the request.
:::

## Array & Nested Rules

Dot-notation keys (`meta.description`) and wildcard keys (`tags.*`) describe values nested inside a field, not top-level keys you send. Each one composes into its nearest parent without a dot and never appears as its own quoted property. A property such as `"order.id"?: string` would suggest you could send a literal `order.id` key, which Laravel's dot notation never means:

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

The nested rules compose into their parents:

```typescript
export interface ArrayRulesRequest {
  tags?: string[];
  selected_ids: number[];
  /** @format uuid order.id */
  order: { id: string; items: { product_id: number }[] };
}
```

Nesting has no depth limit. `order.items.*.product_id` composes through every segment, the same way `tags.*` composes through one. The parent's own rules decide its `?` and `| null`, so `selected_ids` is required because its own rule says `required`. Each nested key's rules decide its `?` inside the parent's shape.

A parent with no rule of its own is optional. `'order.items.*.sku' => ['required', 'string']` on its own publishes `order?: { items?: { sku: string }[] }`, and adding `'order' => ['required', 'array']` makes `order` required.

### Nested Edge Cases

These rule combinations have a less obvious result:

| Rules                                                                                        | Generated type                                            | Why                                                                                                                                           |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `'choices' => ['nullable','array']`<br>`'choices.*' => ['nullable','string']`                | `choices?: (string \| null)[] \| null`                    | The element's `nullable` folds into the element type. The array's own `nullable` stays on the array.                                          |
| `'options' => ['array']`<br>`'options.*' => ['string']`<br>`'options.default' => ['string']` | `options?: { default?: string } & Record<string, string>` | A wildcard beside a named key describes a map with some fixed keys. The intersection stays valid TypeScript even when the two halves differ.  |
| `'meta' => ['array']`<br>`'meta.secret' => ['prohibited']`                                   | `meta?: Record<string, never>`                            | Every named key is prohibited, so no key is allowed. This isn't an empty object you can add keys to.                                          |
| `'empties' => ['array']`<br>`'empties.*' => ['prohibited']`                                  | `empties?: never[]`                                       | The element can never appear, so the array can never hold anything.                                                                           |
| `'v1\.0' => ['required','string']`                                                           | `"v1.0": string`                                          | An escaped dot is a literal character in the attribute name, so it stays one field. It's quoted, since `.` can't appear in a bare identifier. |
| `'items' => ['array']`<br>`'items.0.name' => ['required','string']`                          | `items?: { name: string }[]`                              | Explicit numeric indices describe a list. No real JSON array fits a `{ "0": … }` type.                                                        |
| `'variants.0.name' => [...]`<br>`'variants.1.email' => [...]`                                | `variants?: ({ name: string } \| { email: string })[]`    | Indices with different shapes form a union, in parentheses so `[]` applies to the whole union rather than its last member.                    |

A `prohibited` or `missing` rule on a nested key drops that key and everything under it from the parent's shape. `'order.secret' => ['prohibited']` beside `'order.secret.token' => ['required','uuid']` leaves nothing of `secret` in `order`.

### Key-List Rules: Known Keys Without a Full Shape

Four validation rules name an array's keys without declaring a nested shape for them. Each listed key becomes an `unknown` property, instead of the whole field staying `unknown[]`. The rules differ in whether Laravel guarantees a key is present, and the `?` follows that:

| Rule                      | Meaning                                                                                          | PHP                                                                      | TypeScript                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `required_array_keys:a,b` | Every listed key must be present.                                                                | `'permissions' => ['required','array','required_array_keys:read,write']` | `permissions: { read: unknown; write: unknown };`              |
| `in_array_keys:a,b`       | At least one listed key must be present, so no single key is guaranteed.                         | `'config' => ['required','array','in_array_keys:timezone']`              | `config: { timezone?: unknown };`                              |
| `array:a,b`               | Only the listed keys are allowed. Says nothing about presence.                                   | `'preferences' => ['nullable','array:theme,locale']`                     | `preferences?: { theme?: unknown; locale?: unknown } \| null;` |
| `array_keys:a,b`          | Only the listed keys are allowed, and at least one must be present. No single key is guaranteed. | `'attributes_map' => ['required','array_keys:color,size']`               | `attributes_map: { color?: unknown; size?: unknown };`         |

A field can combine a key-list rule with a declared child rule, and the two merge. On a name collision, the declared child sets the type and the `?`. A listed key with no child rule stays `unknown`:

```php
'shipping' => ['required', 'array', 'required_array_keys:method,address'],
'shipping.method' => ['nullable', 'in:standard,express'],
```

The declared child wins for `method`:

```typescript
shipping: { method?: 'standard' | 'express' | null; address: unknown };
```

`method` keeps its own type and `?` from `'shipping.method'`, even though `required_array_keys` also names it. `address` has no rule of its own, so it stays `unknown`, and it's required because `required_array_keys` requires it.

## JSDoc Metadata Annotations

Some rules add a JSDoc tag above the field, alongside any effect they have on its type:

| Rules                                                                                                              | Annotation                            |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| `email`, `url`, `active_url`, `uuid`, `ulid`, `ip`, `ipv4`, `ipv6`, `mac_address`, `hex_color`                     | `@format {rule}`                      |
| `date`, `date_equals`                                                                                              | `@format date`                        |
| `exists:table,column` or `Rule::exists(...)`                                                                       | `@constraint exists`                  |
| `unique:table,column` or `Rule::unique(...)`                                                                       | `@constraint unique`                  |
| `required_if`, `required_unless`, `required_with`, `required_without`, `required_with_all`, `required_without_all` | `@metadata required-conditionally`    |
| `Rule::requiredIf(...)` or `Rule::requiredUnless(...)`                                                             | `@metadata required-if conditional`   |
| `Rule::prohibitedIf(...)` or `Rule::prohibitedUnless(...)`                                                         | `@metadata prohibited-if conditional` |
| `Rule::excludeIf(...)` or `Rule::excludeUnless(...)`                                                               | `@metadata exclude-if conditional`    |
| `not_in:a,b,c`                                                                                                     | `@not a, b, c`                        |

For example, an `exists` rule adds a `@constraint` tag:

```php
'category_id' => ['required', 'integer', 'exists:categories,id'],
```

The field publishes with the tag:

```typescript
/** @constraint exists */
category_id: number;
```

An annotation on a nested rule isn't lost when the rule [composes into its parent](#array-nested-rules). It moves to the parent's comment, followed by the full rule key it came from, wildcards included, so you can tell which nested key it describes:

```php
'order.id' => ['required', 'uuid'],
'products.*.contact_email' => ['required', 'email'],
```

Each annotation moves to its parent's comment:

```typescript
export interface StoreOrderRequest {
  /** @format uuid order.id */
  order: { id: string /* … */ };
  /** @format email products.*.contact_email */
  products: { contact_email: string /* … */ }[];
}
```

A `prohibited` nested key is the exception. It and everything under it leave the type, so their annotations go too.

## Overriding Field Types With `#[TsCasts]`

Put `#[TsCasts]` on the `FormRequest` class to override a field's type, mark it optional, or point it at a type you import. It's the same attribute, with the same array shape, that [models](./models.md#tscasts) and API resources use. Unlike a [resource's `#[TsCasts]`](./api-resources.md#overriding-property-types-with-tscasts), it never adds a field. It only rewrites fields that `rules()` declares. A key that names no rule adds nothing to the interface, though its `import` is still written, which leaves an unused import:

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

The `import` key writes the import line into the request's file:

```typescript
import type { PostAttributes } from "@js/types/posts";

export interface UpdatePostRequest {
  title?: string;
  status: "draft" | "published" | "archived";
  attributes?: PostAttributes;
}
```

::: warning A Cast Doesn't Clear `nullable`
`#[TsCasts]` replaces only a field's type and, through its `optional` key, its `?`. A `nullable` rule on the field still adds `| null` to the override, as the `rating` field in [Anatomy of a Generated Form Request](#anatomy-of-a-generated-form-request) shows.
:::

::: warning Casts Match Field Names, Not Rule Keys
`#[TsCasts]` keys match the generated field names, and a dot-notation rule key never becomes one, because it [composes into its parent](#array-nested-rules). A key like `'order.id'` or `'tags.*'` matches nothing, is ignored, and adds no field. Override the parent (`'order'` or `'tags'`) to replace the whole shape, or make the rule precise enough not to need an override. The one dotted key that matches is an escaped one: `'v1\.0'` generates the field `"v1.0"`, so a `'v1.0'` cast overrides it.
:::

## Extending Interfaces With `#[TsExtends]`

Form requests support `#[TsExtends]` and the `ts_extends.form_requests` config array, the same interface extension the rest of the package uses. See [Extending Interfaces](./extending-interfaces.md) for the attribute and config syntax.

## Dynamic Requests

The package calls `rules()` with no real HTTP request. Inside `rules()`, `Auth::user()` returns a stand-in user whose methods all return `false`, so a rule that branches on a check such as `Auth::user()->isAdmin()` still publishes.

Code that needs a real request, session or signed-in user can't run during a publish. When `rules()` fails that way, for example by reading `$this->user()->id`, the package publishes the whole request as a `Record<string, unknown>` alias instead of failing the run:

```php
class DynamicRequest extends FormRequest
{
    public function rules(): array
    {
        $userId = $this->user()->id; // no user exists while ts:publish runs

        return [
            'name' => ['required', 'string'],
            'user_id' => ['required', 'integer', 'in:'.$userId],
        ];
    }
}
```

The fallback type carries a `@dynamic` tag:

```typescript
/**
 * @see App\Http\Requests\DynamicRequest
 * @dynamic Rules could not be resolved statically.
 */
export type DynamicRequest = Record<string, unknown>;
```

## Filtering & Excluding Form Requests

Form requests use the same include and exclude settings as enums, models and resources. Each list takes class names or directory paths:

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

There's no field-level exclusion, because fields are keys in one `rules()` array rather than separate methods. See [Excluding Content](./excluding-content.md) for how the attribute works across models, enums, resources and routes.

## Route Integration

When a controller action type-hints a `FormRequest`, the action's route export gets the request's interface through `annotateRequestPayload<T>()`, with no configuration. See [Form Request Payload Types](./routing.md#form-request-payload-types) for `annotateRequestPayload` and `InferRequestPayload`.

### Reading a Single Validated Field

When an action builds an Inertia page prop from `$request->validated('key')`, the request's rules type that prop, so it gets the field's own type instead of `unknown`. A dotted path walks the same nested rules the interface composes, so the prop types exactly as that key does inside the generated shape:

```php
// StorePostRequest::rules() declares:
//   'title' => ['required', 'string'],
//   'options' => ['array'],
//   'options.default' => ['string'],

public function store(StorePostRequest $request): Response
{
    return Inertia::render('Posts/Success', [
        'title' => $request->validated('title'),
        'defaultOption' => $request->validated('options.default'),
    ]);
}
```

Each prop takes its field's type:

```typescript
export type StorePageProps = Inertia.SharedData & {
  title: string;
  defaultOption?: string;
};
```

The parameter has to be the `FormRequest` subclass itself, because `validated()` on a plain `Request` type-hint has no rules to read. API resources don't get this. A resource's `toArray(Request $request)` never sees the request's rules, so the typing covers Inertia page props only.

A top-level key also picks up the request's own [`#[TsCasts]`](#overriding-field-types-with-tscasts). The prop takes the override's type and its `optional` flag, in either direction. If the override has an `'import' => …` entry, the generated file gets that import line. The prop and the interface then describe the field the same way, and a `nullable` rule still adds `| null` after the override, as it does in the interface.

The prop stays `unknown` wherever the rules can't answer with confidence:

- A key your rules never declare, and `validated()` with no argument, which returns the whole payload rather than one field.
- A key marked `prohibited`, or anything under one, since the interface drops that subtree.
- A path with a `*` segment. `validated()` passes the path to `data_get()`, which expands a wildcard into a list, not the single element the wildcard rule describes.
- An [escaped-dot key](#nested-edge-cases) (`'v1\.0'`), which `data_get()` also splits on and can't reach.
- A non-literal key (`validated($column)`), a call that also passes a `default` argument, and any [dynamic request](#dynamic-requests).

::: warning An Override on a Parent Key
An override on a parent key is the one place the prop and the interface disagree. `#[TsCasts(['options' => 'MyOptions'])]` replaces the whole `options` shape in the interface, but `validated('options.default')` still types as `string` from the rule the override replaced. The package can't look inside a hand-written TypeScript type. Read `validated('options')` instead, or make the nested rule precise enough not to need the override. A dot-notation override key such as `'options.default'` is ignored in both places, so those two never disagree. The escaped-dot field is the one dotted key the interface honors, but `validated()` can't reach it, as the list above says.
:::

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `form_requests.*` key, including the class overrides for customizing the pipeline.
