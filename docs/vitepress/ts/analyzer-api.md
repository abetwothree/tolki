# Analyzer API

The analysis that the [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) runs on your classes is also available to your own code. `AstEngine::analyze()` takes a class and a method name. It returns the typed properties that method returns, plus the imports those types need. Use it when your own code needs this package's types without a full publish, such as a custom Artisan command or another package.

To change what `ts:publish` itself does, replace one of its stages instead. See [Customizing the Pipeline](./customizing-the-pipeline.md).

## Analyzing a Method

`analyze()` reads what a method returns: nested arrays, conditionals, closures, and method calls. It works on any class, whether or not it's a resource. A property read or a method call is typed from the class of the value you call it on, such as `$this->author->name` or a local variable.

This example analyzes a service class's `toPayload()` method:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AstEngine;

$result = resolve(AstEngine::class)->analyze(App\Services\CartSummary::class, 'toPayload', null, 'app/services');

// $result->properties   => list<{name, type, optional, description}>
// $result->typeImports  => import path => list<type name>
// $result->valueImports => import path => list<enum const name>
```

`analyze()` takes four arguments:

| Argument             | Default     | Description                                                                                                                                                                                                                       |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$class`             | required    | The class to analyze.                                                                                                                                                                                                             |
| `$method`            | `'toArray'` | The method whose return value is analyzed.                                                                                                                                                                                        |
| `$modelClass`        | `null`      | The Eloquent model that `$this->...` reads resolve against. Leave it `null` to bind no model, or to let a `JsonResource` subclass find its own.                                                                                   |
| `$fromNamespacePath` | `''`        | The namespace path of the file you're writing, such as `app/services`. Import paths come back relative to it, the same way [Modular Publishing](./modular-publishing.md) computes them. Pass `''` for a file at your output root. |

`analyze()` writes nothing to disk. The file, its formatting, and any barrel entry are up to you.

::: warning `analyze()` is the whole public API
`analyze()` and the `AnalysisResult` it returns are the only supported parts of the engine. Every other class under `AbeTwoThree\LaravelTsPublish\Ast`, and every other method on `AstEngine`, is `@internal`. Those change without notice, so code that calls them can break on any update.
:::

### `AnalysisResult`

`analyze()` returns a readonly `AnalysisResult` with three properties:

```php
public function __construct(
    public array $properties,
    public array $typeImports,
    public array $valueImports,
) {}
```

Each property holds one part of the module you write:

- **`properties`**: a `list<{name, type, optional, description}>` with one entry per key the method returns. `type` is already a TypeScript type string. `optional` is `true` wherever the code can leave the key out, such as a conditional method or a `mergeWhen()`.
- **`typeImports`**: an `import path => list<name>` map of the types that the property types name. Write these as `import type` lines.
- **`valueImports`**: an `import path => list<name>` map of the enum constants that an `AsEnum<typeof X>` wrapper reads. Write these as plain `import` lines, never as `import type`.

Two classes that share an import path merge into one entry, so neither overwrites the other.

The three properties agree with each other, so a module that renders all three as they are compiles:

- **Same-name classes**: two classes with the same short name, such as two `User` models, come back under separate aliases, and the property types use those aliases.
- **`EnumResource` properties**: an `EnumResource::make()` property comes back as `AsEnum<typeof X>`, beside the value import that wrapper needs. With `enums.use_tolki_package` off, it comes back as the plain enum type with a type import, and `valueImports` stays empty.
- **No unused imports**: nothing is imported that no property type names. A name counts wherever it appears in a type, even inside a string, template text, or a comment. A method-level `#[TsCasts]` of `"'User' | 'Admin'"` therefore keeps an unused `User` import, which TypeScript reports only under `noUnusedLocals`.

### Method Parameters

On a class that isn't a `JsonResource`, `analyze()` reads a parameter typed as `Illuminate\Http\Request`, or a subclass of it, as the request. A call such as `$request->url()` then types as `string`. On a `JsonResource`, it doesn't, so `$request->url()` in `toArray()` is `unknown`.

`analyze()` binds no other parameters. A [model metadata](./model-metadata.md) provider shows the difference. `analyze($provider, 'provide')` leaves `$model->getTable()` as `unknown`, while the published companion types it as `string`, because a publish binds the `Model $model` parameter to its declared type. The published companion also applies the `@return` docblock and `#[TsCasts]` on top.

There's no public entry point for an analysis that binds other parameters.

## Analyzing Resources, Models, and Events

A resource works with no extra arguments. A model needs one more, and a broadcast event needs the method name.

### Resources

Call `analyze()` with a `JsonResource` subclass and leave the other arguments at their defaults. The package finds the resource's model the same way `ts:publish` does, and analyzes `toArray()`:

```php
$result = resolve(AstEngine::class)->analyze(App\Http\Resources\PostResource::class);
```

Every pattern in [API Resources](./api-resources.md) gives the same properties, imports, and optionality as a publish. That includes the `when()` family of conditional methods, `EnumResource::make()`, nested and collection resources, `merge()` and `mergeWhen()`, and relation filters such as `$this->author->only([...])`. The exceptions are a `morphTo` union, a `$wrap = null` collection, class-level and model-level `#[TsCasts]`, and the filled index signature of an interpolated key. [What It Cannot Do](#what-it-cannot-do) covers each one.

### Models

A model needs its own class as the third argument. The automatic model lookup runs only for a `JsonResource` subclass, and a model's `toArray()` is Laravel's own method, with nothing in its body to read. Pass the model twice to get the attribute and relation shape that [Models](./models.md) publishes from:

```php
$result = resolve(AstEngine::class)->analyze(App\Models\User::class, 'toArray', App\Models\User::class);
```

If you leave the third argument `null`, all three properties come back empty.

### Broadcast Events

`analyze($event, 'broadcastWith')` returns the payload that [Broadcast Events](./broadcast-events.md) publishes for that event. A `broadcastWith()` inherited from a parent class counts, as it does when Laravel dispatches the event. The result doesn't include two things a publish adds on top: the event's class-level `#[TsCasts]` overrides, and `Partial<Model>` for a model property.

An event with no `broadcastWith()` anywhere in its class hierarchy is published from its public properties. `analyze()` never falls back to them, so on such an event it returns an empty result, imports included. Only `ts:publish` produces that shape.

## What It Cannot Do

Some shapes come only from a full `ts:publish` run. In these cases, `analyze()` returns something different from the published file, or nothing at all:

**Inertia page props.** [Page props](./routing.md#inertia-integration) come from the props argument of an `Inertia::render()` call in a controller action, not from a method's return value. `analyze()` on a controller action returns that method's own return shape, not its page props. There's no public entry point for page props.

**Inertia shared data.** `analyze($middleware, 'share')` returns what inference finds in `share()`. The published `SharedData` applies `#[TsCasts]` first, then the `@return array{...}` docblock on `share()`, then inference, as [Type Resolution Priority](./inertia.md#type-resolution-priority) describes. It also drops the `errors` key that `Inertia\Middleware::share()` adds, because `@inertiajs/core` types `page.props.errors` itself.

For example, a `share()` whose docblock declares `filters?: array<string, string>` and whose body returns `(array) $request->query('filters', [])` comes back from `analyze()` as `filters: unknown[]`. The published `SharedData` has `filters?: Record<string, string>`.

**Form request rules.** A form request's published interface is built from its rules by the class in `form_requests.analyzer_class`, not by `analyze()`. See [Form Requests](./form-requests.md). `analyze($request, 'rules')` types the array that `rules()` returns, not the validated payload.

**`morphTo` unions.** `analyze()` can't list the models a `morphTo` relation can hold, because only a publish scans your models for the `morphOne` and `morphMany` relations that point back. The relation is left out of a model's shape, and it comes back `unknown` where a `toArray()` names it. A [`@return MorphTo<A|B, $this>` docblock](./models.md#typing-morphto-relations) on the relation method gives both `analyze()` and a publish the union.

**`$wrap = null` collections.** A `ResourceCollection` with `$wrap = null` and no keys beyond its items publishes as a flat alias, `export type X = Y[]`, rather than an interface. An alias has no property list or imports to put in an `AnalysisResult`, so all three properties come back empty. `ts:publish` writes the alias.

**Class-level and model-level `#[TsCasts]`.** `analyze()` applies a `#[TsCasts]` on the analyzed method only. `ts:publish` then applies a resource's class-level `#[TsCasts]` and its model's `#[TsCasts]`, types and optionality both. On a `CommentResource` whose class-level casts name `flagged_at` and `metadata`, `analyze()` returns `flagged_at: string | null` and `metadata: unknown[] | null`. The published interface has `flagged_at?: string | null` and `metadata: Record<string, unknown>`.

**Resources guessed by naming convention.** When `toResource()` guesses a resource class by its name, a publish uses the guess only if that resource is published too. `analyze()` accepts any resource class that exists. Where a publish that excludes the guessed resource writes `unknown`, `analyze()` names the resource.

**Filled index signatures.** A `@return` docblock can fill in the value type of an interpolated key's index signature. `analyze()` checks that fill only against the keys the method returns. `ts:publish` also checks it against the extends clause and the `#[TsCasts]` keys: a resource's class-level and model-level ones, or an event's class-level ones. Wherever they could conflict, it resets the fill to `unknown | undefined`, and under an extends clause it always does. See [Interpolated Keys](./api-resources.md#interpolated-keys).

On a `#[TsExtends]` resource, `analyze()` returns ``[key: `${string}_tag`]: string | undefined`` where the published interface has `unknown | undefined`.

Outside those cases, `analyze()` runs the same inference that resources, broadcast events, model metadata, Inertia page props, and Inertia shared data publish from. What each of those features adds on top is on its own page, linked above.

`analyze()` and `ts:publish` both type the patterns these docs describe. Anything else, such as an expression neither can follow or a local you reassign, comes back `unknown` rather than a guess.

Two cases don't widen to `unknown`. A conditional's default that can't be typed leaves the value's own type in place. A ternary or `?:` arm that can't be typed is left out, so `$cond ? $untypable : null` publishes `null`. See [Local Variables and Narrowing](./api-resources.md#local-variables-and-narrowing) for how this looks in a resource.

## Configuration Reference

`analyze()` has no config keys of its own. It follows the settings you already have, such as `enums.use_tolki_package`, `models.nullable_relations`, `timestamps_as_date`, and `custom_ts_mappings`, so its types match what `ts:publish` writes for [Enums](./enums.md), [Models](./models.md), and [API Resources](./api-resources.md). The full list is in the [Configuration Reference](./configuration-reference.md).
