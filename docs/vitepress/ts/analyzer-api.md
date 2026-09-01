# Analyzer API

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish)'s static analysis engine is also available directly, outside the `ts:publish` pipeline — hand it a class and a method name and get back the same typed property list the pipeline itself generates from. [Customizing the Pipeline](./customizing-the-pipeline.md) covers swapping out a Collector, Generator, Transformer, or Writer; that page swaps pipeline stages; this page calls the analyzer directly.

## Analyzing a Method

`analyzeMethod()` walks a method's return value the same way it walks a `JsonResource`'s `toArray()` — nested array literals, conditionals, closures, and method calls are all understood, whether or not the class is a resource. `$method` defaults to `'toArray'`; pass any public method name to analyze a different one:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AstEngine;

$analysis = resolve(AstEngine::class)->analyzeMethod(App\Services\CartSummary::class, 'toPayload');
```

### `MethodAnalysis`

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

## Analyzing Public Properties

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

- **Nullable is always `| null`, never `?`.** `trackingNumber` above is a nullable native type, and it comes back `string | null` with `optional: false`. Whether the *key* itself is allowed to be missing is a separate concern this method never decides — that's a `#[TsCasts]`-level choice for whatever builds a template from the result.
- **Trait-declared properties are excluded.** A property declared on a trait the class uses never appears in `properties` — including one supplied by a [`#[TsExtends]`](./extending-interfaces.md) trait, so its field isn't emitted both as a plain property here and again through the trait's own `extends` clause.

## Resources Get Resource Semantics

Call `analyzeMethod()` with a `JsonResource` subclass and no third argument, and the default `$method` (`'toArray'`) plus automatic backing-model resolution turn it into exactly what a resource's collector run through `ts:publish` produces:

```php
$analysis = resolve(AstEngine::class)->analyzeMethod(App\Http\Resources\PostResource::class);
```

Every pattern documented in [API Resources](./api-resources.md) resolves identically here — the `when()` conditional-method family, `EnumResource::make()`, nested and collection resources, `merge()` / `mergeWhen()`, and relation filters (`$this->author->only([...])`) all produce the same properties, FQCN channels, and optionality a full publish would. The only thing missing is the file: `analyzeMethod()` stops at the `MethodAnalysis` DTO, nothing is written to disk or folded into a barrel file.

## Imports

A `MethodAnalysis`'s FQCN channels aren't import paths by themselves — `AnalysisImports` turns them into resolved import paths for one specific generated file:

```php
use AbeTwoThree\LaravelTsPublish\Ast\AnalysisImports;

$imports = new AnalysisImports()->build($analysis, 'app/services');

// $imports['typeImports']  => import path => list<type name>
// $imports['valueImports'] => import path => list<const name>  (enum-wrapping only)
```

The second argument is the *importing* file's own namespace path — every path in the result is already resolved relative to it, using the same algorithm [Modular Publishing](./modular-publishing.md) documents. Two FQCN channels that land on the same import path are merged into one entry instead of one overwriting the other.

::: warning A type token never outruns its import
`build()` only resolves *what* to import — never what to call it once it's imported. If two FQCNs feeding one `MethodAnalysis` share a bare type name across different namespaces (two classes both named `User`, say), both of their paths still come back in the result; turning that collision into two distinct aliases is the caller's job, not this method's.
:::

## What It Cannot Do

**Broadcast events and Inertia props aren't on this engine yet.** Both still resolve through [Surveyor](https://github.com/laravel/surveyor), a separate static-analysis library `ts:publish` uses just for those two features. Calling `analyzeMethod()` against a controller action does not reproduce that action's Inertia page-prop type, and `BroadcastEventTransformer` doesn't call into this engine at all yet — [`analyzePublicProperties()`](#analyzing-public-properties) gives you an event's constructor-derived shape, but that's not what `ts:publish` currently writes for an event that defines its own `broadcastWith()`.

**No form-request rule parsing.** A `FormRequest`'s `rules()` method is typed by its own dedicated analyzer, not this engine — see [Form Requests](./form-requests.md). Neither `analyzeMethod()` nor `analyzePublicProperties()` has any special handling for a validation rule array.

**`unknown` is an honest floor, not a bug.** Every pattern this page documents is one the analyzer specifically recognizes; anything else — an expression it can't trace, a reassigned local, an unresolvable closure default — degrades to `unknown` rather than guessing. See [API Resources § Local Variables](./api-resources.md#local-variables) for what that looks like from the resource side.

This page will grow as more of the package moves onto this engine — check the feature pages it links to above for what has already moved over.

## Configuration Reference

The engine adds no config keys of its own — it reads whatever `enums.*` and `models.*` values are already set for [Enums](./enums.md), [Models](./models.md), and [API Resources](./api-resources.md). The full list lives in the [Configuration Reference](./configuration-reference.md).
