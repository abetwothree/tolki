# Analyzer API

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish)'s static analysis engine is also available directly, outside the `ts:publish` pipeline — hand it a class and a method name and get back the same typed property list the pipeline itself generates from, along with the imports those types need. [Customizing the Pipeline](./customizing-the-pipeline.md) covers swapping out a Collector, Generator, Transformer, or Writer; that page swaps pipeline stages, this one calls the analyzer directly.

## Analyzing a Method

`analyze()` walks a method's return value the same way it walks a `JsonResource`'s `toArray()` — nested array literals, conditionals, closures, and method calls are all understood, whether or not the class is a resource. `$method` defaults to `'toArray'`; pass any public method name to analyze a different one:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AstEngine;

$result = resolve(AstEngine::class)->analyze(App\Services\CartSummary::class, 'toPayload', null, 'app/services');

// $result->properties   => list<{name, type, optional, description}>
// $result->typeImports  => import path => list<type name>
// $result->valueImports => import path => list<enum const name>
```

The third argument, `$modelClass`, is the Eloquent model that `$this->…` references resolve against; `null` skips the binding, or lets a `JsonResource` subclass resolve its own. The fourth is the _importing_ file's own namespace path — every path in the two import maps is already resolved relative to it, using the same algorithm [Modular Publishing](./modular-publishing.md) documents. Pass `''` for a file at your output root.

Nothing is written to disk. `analyze()` stops at the DTO, so the file, its formatting, and any barrel-file entry are yours to write.

::: warning `analyze()` is the whole public surface
`analyze()` and the `AnalysisResult` it returns are the only supported engine API. Every other class under `AbeTwoThree\LaravelTsPublish\Ast` — and `AstEngine`'s own remaining methods — is `@internal`: each traffics in a DTO whose shape tracks inference and changes without notice, so code reaching past `analyze()` is on its own.
:::

### `AnalysisResult`

A readonly DTO with three fields:

```php
public function __construct(
    public array $properties,
    public array $typeImports,
    public array $valueImports,
) {}
```

`properties` is what most callers actually want: a `list<{name, type, optional, description}>` — one entry per key the method returns, with `type` already rendered as a TypeScript type string and `optional` set wherever the source pattern (a conditional method, a `mergeWhen()`, and so on) makes the key possibly-absent.

`typeImports` and `valueImports` are both `import path => list<name>` maps. `typeImports` holds the `import type` lines the property types reference; `valueImports` holds the enum consts an `AsEnum<typeof X>` wrapper reads, so it is the one map you emit as a plain `import`, never an `import type`. Two classes that land on the same import path merge into one entry instead of one overwriting the other.

The three fields agree with each other, which is the whole point of the DTO. Same-basename classes are aliased apart — two classes both named `User` come back as separate aliases, and the property types spell those aliases rather than the bare name. An `EnumResource::make()` property arrives already wrapped as `AsEnum<typeof X>` beside the value import that wrapper needs. And nothing is imported that no property type names. Render all three verbatim and the module compiles.

## Resources Get Resource Semantics

Call `analyze()` with a `JsonResource` subclass and leave `$modelClass` null, and the default `$method` (`'toArray'`) plus automatic backing-model resolution turn it into exactly what a resource's collector run through `ts:publish` produces:

```php
$result = resolve(AstEngine::class)->analyze(App\Http\Resources\PostResource::class);
```

Every pattern documented in [API Resources](./api-resources.md) resolves identically here — the `when()` conditional-method family, `EnumResource::make()`, nested and collection resources, `merge()` / `mergeWhen()`, and relation filters (`$this->author->only([...])`) all produce the same properties, imports, and optionality a full publish would. The two exceptions — a `morphTo` union and a `$wrap = null` collection — are [below](#what-it-cannot-do).

Two other class kinds are worth calling out:

**A model needs its own class as the third argument.** That automatic resolution only fires for a `JsonResource` subclass, and a model's `toArray()` is Laravel's own — there is nothing in that body to read. Pass the model twice, `analyze(App\Models\User::class, 'toArray', App\Models\User::class)`, and you get the attribute-and-relation shape [Models](./models.md) is built from; leave the third argument `null` and all three fields come back empty.

**A broadcast event is `analyze($event, 'broadcastWith')`.** A `broadcastWith()` inherited from a parent class counts, the same as Laravel's own dispatch, and the result is the payload [Broadcast Events](./broadcast-events.md) publishes for that event, before the two presentation rules the transformer applies on top — `#[TsCasts]` overrides, and a model property rendered as `Partial<Model>`. An event with no `broadcastWith()` anywhere in its hierarchy is typed from its public properties instead — a path `ts:publish` drives on its own, with no public entry point. `analyze()` never falls back to it, so on such an event it returns an empty result, imports included.

[Model metadata](./model-metadata.md) is the consumer that shows the engine's parameter binding: its `ModelMetadataAnalyzer` locates a provider's `provide(Model $model)` on the class that declares it, binds `$model` to its declared type, and runs the same handlers over that scope — which is why `$model->getTable()` infers `string` there while a plain `analyze()` call, which binds nothing, leaves it `unknown`. It then layers the `@return` docblock and `#[TsCasts]` on top and resolves the imports its body-inferred enums need. There is no public entry point for a bound analysis; it is the recipe `InertiaPageAnalyzer` and `ModelMetadataAnalyzer` both inline.

## What It Cannot Do

**It analyzes a method, not an expression in a controller action.** [Inertia page props](./routing.md#inertia-integration) do run on this engine, but they come from an `Inertia::render()` call's _props argument_ rather than from a method's return shape, and they are resolved with a controller-tuned handler set over a scope seeded from the action's own signature — route-bound models, `Request` parameters, local variables. `analyze()` against a controller action therefore returns that method's return type analysis, not the action's page-prop type; there is no public entry point for the expression path.

**Inertia shared data is the raw method shape, not the published `SharedData`.** `analyze($middleware, 'share')` runs on the same engine, but `InertiaSharedDataAnalyzer` layers its own resolution on top — [`#[TsCasts]` first, then the `@return array{...}` docblock on `share()`, then AST inference](./inertia.md#type-resolution-priority) — and then drops the `errors` key your override merges in from `Inertia\Middleware::share()`, since `@inertiajs/core` types `page.props.errors` itself. That priority order is where the two diverge: a `share()` returning `$request->user()->id` and `(array) $request->query('filters', [])` comes back from `analyze()` as `id: unknown` and `filters: unknown[]`, while the published `Inertia.SharedData` reads `id: number` and `filters?: Record<string, string>` — both of those are the docblock, applied afterwards.

**No form-request rule parsing.** A `FormRequest`'s published interface comes from its own dedicated runtime analyzer, not this engine — see [Form Requests](./form-requests.md). `analyze($request, 'rules')` types the rule array that method returns, not the validated payload.

**A `morphTo` union is a publish-run product.** Its targets are normally found in reverse, by scanning every other model for a `morphOne` / `morphMany` pointing back — a map `ts:publish` builds up front and a direct call never does. Outside a publish the relation contributes nothing: it is dropped from a model's delegated shape, and comes back `unknown` where a `toArray()` names it explicitly. A [`@return MorphTo<A|B, $this>` generic](./models.md#typing-morphto-relations) on the relation method is read straight off the docblock and resolves either way.

**A `$wrap = null` collection has nowhere to land.** A `ResourceCollection` with no extra keys beyond its wrapped items collapses to a flat `export type X = Y[]` alias rather than an interface, and an alias has no property list or import set for `AnalysisResult` to carry — so all three fields come back empty. `ts:publish` writes that alias; `analyze()` has no answer for the shape.

**`unknown` is an honest floor, not a bug.** Every pattern this page documents is one the analyzer specifically recognizes; anything else — an expression it can't trace, a reassigned local, an unresolvable closure default — degrades to `unknown` rather than guessing. See [API Resources § Local Variables](./api-resources.md#local-variables) for what that looks like from the resource side.

Every feature that infers a type runs on this engine — resources, broadcast events, model metadata, and both Inertia features. What each one adds on top of the analysis is on its own feature page, linked above.

## Configuration Reference

The engine adds no config keys of its own — it reads whatever `enums.*` and `models.*` values are already set for [Enums](./enums.md), [Models](./models.md), and [API Resources](./api-resources.md). The full list lives in the [Configuration Reference](./configuration-reference.md).
