# Upgrade Guide

## Upgrading From 2.8

The release after 2.8 follows more of the code in `toArray()` and its helpers: variables you write more than once or inside a block, closure parameters, `instanceof` checks, and collection pipelines on any collection. Many values that published `unknown` now publish their type, and some types gain or lose `| null` to match what Laravel sends. Run `php artisan ts:publish` after you update, and check the changes below against your generated files.

### `null` Added or Dropped

- **`transform()` closures**: Laravel calls the closure only for a filled value, so its parameter no longer holds `null`. `$this->transform($this->rating, fn ($rating) => $rating)` publishes `rating?: string`, where it published `string | null`. The default closure still gets the blank value, `null` included.
- **A `when()` condition on a variable**: `$this->when($score, fn () => $score)` drops `null` from `$score` in the value, so it publishes `string`, where it published `string | null`.
- **`whenNotNull()` with a closure or a first-class callable**: a closure is never `null`, so Laravel always sends the key and what the closure returns. `$this->whenNotNull(fn () => $this->rating)` publishes `rating: string | null`, where it published `rating?: string`.
- **A collected `whenLoaded()` value**: a value that hands a relation the package can't read to a resource's `collection()`, such as `$this->whenLoaded('branches', CategoryResource::collection(...))` over a `branches()` method that declares no return type, publishes `CategoryResource[]`, where it published `CategoryResource[] | null`.
- **A resource built inside `map()`**: a resource built around a relation inside a `map()` that ends in `->all()`, or inside an array a `whenLoaded()` closure returns, adds `| null`, as in `{ profile: ProfileResource | null }[]`. It published the bare resource, though Laravel sends `null` there. See [Nullable Relations](./api-resources.md#nullable-relations).
- **A column read on a new model**: a model you build with `new` and no attributes reads each column as `null`, so `(new Post)->title` publishes `string | null`, where it published `string`. A model you fill, copy or create keeps the column's type. See [Method Return Types](./api-resources.md#method-return-types).

### Variables, Branches, and Narrowing

- **Variables written more than once**: a variable you assign again, in sequence or inside an `if`, a loop, a `try` or a `catch`, publishes each value that can reach the read, such as `string | number`, where it published `unknown`. A variable a reference can write, or one you change with `.=`, `++` or another compound assignment, still publishes `unknown`. A variable assigned inside a block now publishes its type for the reads after it in that block, where it published `unknown`. See [Local Variables and Narrowing](./api-resources.md#local-variables-and-narrowing).
- **Parameters written inside a block**: a closure's or a helper's parameter publishes both the value it was passed and the value a write inside a block assigns, such as `string | number`, where it published only the value it was passed.
- **Returned variables built in branches**: each branch of an `if` chain, and each loop, keeps its own value for a key, so a key re-set in an `if` publishes both types, such as `number | string`, where it published only its last write's type. A whole new array assigned in one branch replaces the keys only there, so a key that only one side holds publishes optional. See [Building the Array in a Variable](./api-resources.md#building-the-array-in-a-variable).
- **Arrays built in a variable outside `toArray()`'s return**: a closure in value position, a helper you read as a value, and a local you read as a value now publish the keys their writes set, where they published `unknown` or `unknown[]`. A merge closure that returns such a variable now merges its keys.
- **`+` and `unset()` with a local**: `return ['id' => $this->id] + $defaults;` now publishes the keys of `$defaults` too, and `unset($data[$key])` now removes the key when `$key` is a local holding one string literal.
- **`instanceof` narrowing**: an `if` narrows a variable inside its own block, in an `elseif` or `else` the earlier tests rule in, and after a guard nested in a loop or another `if`, up to the end of that block. A ternary narrows reads through a `$this->prop` chain in its arm. A resource method that the proven code calls reads the narrowed `$this->resource`. In a resource collection, an `if` narrows the items to the paginator it tests. These reads published `unknown`, `null`, or every class the variable could hold. See [Narrowing With `instanceof`](./api-resources.md#narrowing-with-instanceof).
- **`preg_match()` and literal keys**: `$matches` publishes `string[]` when the pattern names no group and the call passes no flags, where it published `unknown`. A literal key read on a variable holding an array shape, such as `$row['b']`, publishes that key's type.

### Collections, Relations, and Query Calls

- **`map()` on any collection**: a `map()` callback's parameter holds the collection's element on a local, a `whenLoaded()` parameter, `getRelation()`, a query's `get()` and `collect()` too, with or without a type hint. A class type hint types it whatever the collection holds. Reads through it published `unknown`. A model spread inside the callback, such as `[...$comment->toArray(), 'flag' => true]`, publishes the model the variable holds, where it could name another model or none. See [Collection Pipelines](./api-resources.md#collection-pipelines).
- **Keyed collections through a local**: after `keyBy()`, `sortBy()`, `filter()` or another step that breaks the keys, a `map()` through a local or ending in `->all()` publishes `X[] | Record<string, X>`, where it published `X[]`.
- **Collections passed to a helper**: a helper's parameter holds the collection's model, so `$comments->first()?->content` in its body publishes `string | null`, where it published `unknown`. `only()` and `except()` on a variable holding an Eloquent collection publish a list of its models, such as `Comment[]`.
- **Relation calls the query answers**: `$this->comments()->count()`, `exists()`, `first()?->content`, and other forwarded calls whose query method declares a return type publish it, such as `number` and `boolean`, where they published `unknown`. An aggregate such as `max()`, which declares `mixed`, stays `unknown`. In a [model metadata](./model-metadata.md#how-each-key-is-typed) provider, `$model instanceof Post ? $model->comments()->count() : null` publishes `number | null`, where it published `null`.
- **Relations only a `@return` declares**: a relation method with no native return type whose `@return` names its relation class, such as `@return Ancestors<static, static>`, now publishes on the model's interface, and `whenLoaded()` over it is typed. It was left out. Laravel's `Notifiable` trait declares `readNotifications()` and `unreadNotifications()` this way, so a notifiable model now publishes `read_notifications`, `unread_notifications`, and their `_count` and `_exists` keys.
- **To-many relation subclasses**: a relation whose class extends one of Laravel's to-many relations publishes a list such as `Category[]`, whatever its name. In 2.8 a class name without "Many" published one model. A subclass that loads one model publishes `Category | null`.
- **Route-bound model relations**: in page props, `$post->author` publishes `User` and `$post->comments` `Comment[]`, where they published `unknown`. See [What the Props Expression Can Be](./routing.md#what-the-props-expression-can-be).

### Other Values Now Typed

- **String helpers**: `Str::upper()`, `Str::lower()` and other Laravel methods whose conditional `@return` is a string on every branch publish `string`, where they published `unknown`.
- **`array_filter()`**: publishes the array you pass it, with its keys. Over a `Record<string, string>` cast it publishes `Record<string, string>`. Over a list it publishes `string[] | Record<number, string>` where the value is sent as-is, since a gap the filter leaves makes JSON write an object. It published `unknown`.
- **Integer ranges in docblocks**: `int<0, max>`, `int<1, 10>` and other integer ranges in a `@return` or `@property` tag publish `number`, where they published `unknown`.
- **A first-class callable in a local**: `$label = $this->label(...)`, passed to `when()`, `mergeWhen()` or another conditional method, publishes what the call returns.
- **Loop-built keys in an accessor**: a model accessor whose getter writes `$totals['k'.$index] = $index` in a `foreach` publishes ``{ [key: `k${string}`]: unknown | undefined }``, where it published `unknown[]`. Laravel sends an object, such as `{"k1":1,"k2":2}`.

### Reassigned Values That No Longer Guess

- **`json_decode()` of a reassigned parameter**: after `$title = json_decode($title);`, the parameter holds what `json_decode()` returns, so `return $title;` publishes `unknown`, where it published the parameter's old type, such as `string`. Any write that always runs replaces the value a parameter was passed, but a model parameter keeps its model past a write the package can't type. See [Typing a Variable With `@var`](./api-resources.md#typing-a-variable-with-var).
- **`find()` on a reassigned closure parameter**: after `$author = $author->comments->find(1);`, reads use `Comment`, so `$author?->content` publishes `string | null`, and `$author->name` publishes `unknown`, where it read `User`'s `name`.
- **A merge closure's own variables**: a variable a `merge()` closure assigns is its own, so the closure no longer reads the method's variable of the same name. With `$label = 'x';` in `toArray()` and `$label = $this->id;` in the closure, the merged `label` publishes `number`, where it published `string`.

### New Warnings

`ts:publish` now warns after its summary where it left out a value it can't type and only `null` or an empty array is left. It also warns where a parameter's writes, a returned array's branches, a merge's two sides or a spread helper's returns join and leave a value out. A class the generation cache serves prints none of them, so run `php artisan ts:publish --fresh` to see every one. See [Values Left Out of a Union](./api-resources.md#values-left-out-of-a-union).

## Upgrading From 2.7

The release after 2.7 changes what some `#[TsCasts]` entries publish, and what a merged model publishes. Numeric keys, list literals, enum cases, values built with `new`, and top-level integer keys also now publish as Laravel sends them. Some inferred types change too, where the package guessed a type, read the wrong class, or misread a docblock. Run `php artisan ts:publish` after you update, and check the changes below against your generated files.

### `#[TsCasts]` Changes

#### Entries Publish Exactly What You Write

An entry that names an enum's type, over a key that wraps the enum in `EnumResource::make()`, used to publish the wrap. For example, `'status' => 'StatusType'` published `AsEnum<typeof Status>`. It now publishes `StatusType`, as written. To keep the wrap, write it in the entry:

```php
#[TsCasts(['status' => 'AsEnum<typeof Status>'])]
```

#### The Resource's Own Entries Win Over the Model's

An entry on `toArray()`, or on a method it spreads, now wins over the backing model's entry for the same key, as an entry on the resource class already did. See [Overriding Property Types With `#[TsCasts]`](./api-resources.md#overriding-property-types-with-tscasts) for the full order.

#### An Entry Without `'optional'` Keeps the Key's `?`

An entry that leaves out `'optional'` now keeps the flag the key gets without the entry, so a key can publish optional where it published required:

- **API resources**: a resource entry keeps the `?` from the model's entry for the same key.
- **Inertia shared data**: an entry keeps the `?` from the `share()` docblock's `key?:`, or, for a key the docblock doesn't name, the `?` the package infers, such as for a key `share()` returns on only some paths. `'optional'` also works here now.
- **Inertia page props**: an entry on the controller method keeps the prop's own `?`. `'optional'` also works here now.

To keep such a key required, add `'optional' => false` to its entry.

### A Merged Model Publishes Its Keys

A merge of `$this->resource`, passed as it is or returned from a closure, now publishes the keys the model's `toArray()` writes, each optional behind a condition. See [Merge Operations](./api-resources.md#merge-operations).

### Interpolated Keys in Arrays Publish an Index Signature

A key built from literal text around a variable, written straight into the returned array, a merged array or a nested array, now publishes a template-literal index signature. It was left out before. Beside a key the pattern matches but whose type the signature can't take, `tsc` reports TS2411, and `ts:publish` warns and names the key. See [Interpolated Keys](./api-resources.md#interpolated-keys).

### Values Publish as Laravel Sends Them

These values now publish what Laravel sends, so some generated types change:

- **Numeric keys in API resources**: a resource sends an array whose keys are all numeric as a list. A key whose method returns `[1 => 'Basic', 2 => 'Pro']` published `{ "1": string; "2": string }`, and now publishes `string[]`. A numeric key beside a named key stays, and a resource with `$preserveKeys` keeps every key. See [Methods Declared as a Bare `array`](./api-resources.md#methods-declared-as-a-bare-array).
- **Top-level integer keys on a page, shared data, or an event**: Inertia merges shared data and page props, and Laravel merges a `broadcastWith()` payload, with `array_merge()`, which renumbers integer keys from `0`. A top-level `42 => …` key therefore publishes as `"0"` where it published `"42"`, and a numeric `#[TsCasts]` key there moves the same way. `ts:publish` warns that you probably meant a string key. Nested keys keep theirs.
- **List literals**: a bare array literal such as `['a', 'b']` publishes the list it encodes as, `string[]`, as `collect([...])` does. It published `Record<string, unknown>` before. A list holding an element the package can't type publishes `unknown[]`.
- **Enum cases**: a bare case such as `'status' => Status::Active` publishes the enum's type alias, `StatusType`, in resources, page props, shared data, events, and model metadata. In a model metadata provider, such a case used to stop the run.
- **Resources built around `null`**: `new UserResource(null)` publishes `null`, the value Laravel sends, where it published `UserResource | null`.
- **Values built with `new`**: a value built in place publishes what `json_encode()` writes, so `new DateTime()` publishes the date object and `new RuntimeException('x')` publishes `Record<string, never>`. Both published `unknown` before. See [Method Return Types](./api-resources.md#method-return-types) for the values that stay `unknown`.

### `EnumResource` Keeps Numeric Keys

An `EnumResource` response now sends an array whose keys are all numeric but don't count up from 0 in order, such as `[1 => 'a', 4 => 'b']` or `['01' => 'Jan']`, as an object with those keys. That matches the published enum and its `AsEnum` type. The response used to send such an array as a list. If your frontend relies on the list, wrap the method's array in `array_values()`. See [Object and Array Values](./enums.md#object-and-array-values).

`ts:publish` no longer warns about these methods.

### Inferred Types That No Longer Guess

These types now follow your code and what Laravel runs, so some generated types change.

#### Model Keys and Auth IDs

- **`getKey()` on a model the package can't inspect**: on an abstract model, it publishes the key type the class declares, joined with the key types of its published subclasses, such as `number | string`. On a model whose table the package can't read, such as one whose table doesn't exist yet, it publishes the model's own key type. Both published `string` through `$this->resource`, and `unknown` otherwise. Where an abstract model works its key out in code, such as an overridden `getKeyType()`, it publishes `unknown`. `modelKeys()` on a collection of an abstract model lists the same key type, where it published `(string | number)[]`. See [Method Return Types](./api-resources.md#method-return-types).
- **`getKey()` on a model built in place**: after `new`, `replicate()`, `replicateQuietly()` or `newInstance()`, it adds `| null`, such as `number | null`. It was the bare key type.
- **`getKey()` with a `null` `$primaryKey`**: publishes `null`. It was `number`.
- **`auth()->id()` and `Auth::id()`**: for an auth model the package can't inspect, such as one whose table doesn't exist yet or one it can't create an instance of, they publish the model's key type with `| null`, such as `number | null`. They published `string | null`. Where code works out the key of a model the package can't create, they publish `unknown`. An auth model that overrides `getAuthIdentifierName()` or `getAuthIdentifier()` publishes `unknown` too, where it published its key type with `| null`. See [Inertia](./inertia.md#how-the-augmentation-file-is-generated).

#### Reads Through Properties, Helpers, and Variables

- **Calls and reads on `$this->prop`**: a call or a property read on a relation or a property, such as `$this->author->commentsCount()`, types from the class `author` holds, and `$this` inside a relation's closure still means the resource. Before, such a read could use the wrong model, the resource's or the closure's. A method both classes declare now publishes the held class's return type, such as `string` where it published `number`. A method or column that only the wrong model declared published a type, where Laravel throws or sends `null`, and now publishes `unknown`. So does a property read through a to-many relation, such as `$this->comments->id`, where Laravel throws.
- **`$this->resource->m()`**: publishes what `$this->m()` does, so a model method declared as a bare `array` publishes the shape its body returns. It was `unknown[]`.
- **A model's `toArray()` as a value**: `$this->author->toArray()` and `$this->resource->toArray()` publish `Record<string, unknown>`, and a relation's collection publishes `Record<string, unknown>[]`. They were `unknown[]`. On a relation, `getCasts()` publishes `Record<string, string>`, and `getGlobalScopes()`, `getRelations()` and `relationsToArray()` publish `Record<string, unknown>`, where each published `unknown[]`.
- **Helper method parameters**: a helper's body reads each parameter as its declared type, or as what each call passes when it has none, whether you spread the helper or use its result as a value. A first-class callable passed to `whenLoaded()`, such as `$this->card(...)`, gets the loaded relation as its argument. These reads published `unknown`. See [Methods Declared as a Bare `array`](./api-resources.md#methods-declared-as-a-bare-array).
- **Helpers spread inside a closure**: a spread helper's body no longer reads the closure's parameters or the relation it loads. A helper local named like a closure parameter, as in `fn ($t) => [...$this->ownId()]`, keeps its own type, such as `number` where it published `string`. A helper parameter reads what the call passes instead of the loaded relation's model, so a column only that model has publishes `unknown`, where it published that column's type.
- **An enum or model in a helper's array**: when you use the helper's result as a value, that value publishes `unknown`, and the rest of the shape keeps its types. The whole array was left untyped before.
- **Inertia actions and model metadata providers**: a typed parameter you read, such as `'id' => $id` from `int $id`, publishes its type, where it published `unknown`. A nullable model parameter read bare, such as `'post' => $post` from `?Post $post = null`, publishes `Post | null`, where it published `Post`. An abstract `Model $model` parameter read bare publishes `unknown`, where it published `Model`, a type no generated file exports.
- **A reassigned closure or action parameter**: once you assign a closure parameter, or an Inertia action's model parameter, a value of another class, the reads after it use that class. They kept using the parameter's model, so a column only that model declares published its type, where it now publishes `unknown`. See [Typing a Variable With `@var`](./api-resources.md#typing-a-variable-with-var).
- **More kinds of write**: a `catch`, `unset()`, `static` or `global` now counts as a write to a local variable. So does a by-reference argument that can change the value's form, such as `preg_match()`'s `$matches`, `settype()`, `sort()` on an array that publishes as an object, or one of your own methods. Such a variable publishes `unknown`, where it published its first value's type. A by-reference built-in that keeps the value's form, such as `sort()` on a list or `ksort()`, keeps the type as before. A copy taken before such a call keeps the type it had. A closure that writes only its own parameter no longer changes an outer variable of the same name. See [Local Variables and Narrowing](./api-resources.md#local-variables-and-narrowing).
- **Optional keys through `??`, a ternary, or a default**: a key whose value can be a missing conditional value stays optional, as `$this->whenLoaded('author') ?? 'none'` and `$this->when($flag, $this->whenLoaded('author'), 'none')` do. They were required. See [Passing a Default Argument](./api-resources.md#passing-a-default-argument).

#### Docblock Tags

- **Docblock tags with spaces**: a `@return` or `@var` tag is read whole, so `@return string | null` keeps its `| null`. It was cut at the first space. A `$resource` property tagged `@var ?Post`, or tagged with a model from the resource's own namespace that the file doesn't import, now finds its backing model.
- **Docblock shapes**: `list{int, string}` publishes the tuple `[number, string]`, `object{a: int}` publishes `{ a: number }`, `array<'a'|'b', int>` publishes `{ a?: number; b?: number }`, and quoted keys and a nested `?array{...}` publish as written. Each was misread or ignored, such as `list{int, string}` read as `number`. A `callable` in a `@return` tag or inside a shape publishes `unknown`, where it published the first type inside it. A local `@var` accepts these forms too. See [Typing `array` Casts With `@property`](./models.md#typing-array-casts-with-property).
- **A bare class beside its container**: `@return User[]|User` publishes `User[] | User`. It was `User[]`. A model enum column typed `Status[]|Status` publishes `AsEnum<typeof Status>[] | AsEnum<typeof Status>` in the model's `{Model}Resource` interface, where it published `AsEnum<typeof Status>[]`.
- **`@phpstan-type` aliases inside a list or a shape**: `@property list<Row>|null` publishes a list of the alias's shape, where it published `unknown[] | null`. A promoted constructor property's `@var` reads an alias too, where it published the property's native type. See [Typing JSON Columns With `@phpstan-type` Aliases](./models.md#typing-json-columns-with-phpstan-type-aliases).
- **A nullable `array` column with a nested `null`**: `@property array{a: ?int}` on a nullable column publishes `{ a: number | null } | null`. It was `{ a: number | null }`.

### Published Templates

If you published the package's templates, check these:

- **`resource`**: needs no change. A resource file now imports `AsEnum` from `@tolki/ts` only when one of its types uses it, and a published copy does the same.
- **`broadcast-event` and `globals`**: a copy published before this release prints an event's index signature as a quoted property name instead of a signature. Merge the package's new templates into your copies, as [Publishing and Editing Templates](./customizing-the-pipeline.md#publishing-and-editing-templates) describes.

### Custom Inertia Analyzers

If your app binds its own subclass of `InertiaPageAnalyzer` or `InertiaSharedDataAnalyzer` in the container, update its overrides:

- `InertiaPageAnalyzer::buildPageData()`, `InertiaPageAnalyzer::buildTypeStringWithOverrides()` and `InertiaSharedDataAnalyzer::normalizeOverrideKeys()` take new optional parameters. Add them to your override's signature, or PHP rejects the class.
- `InertiaPageAnalyzer::parseTsCastsFromMethod()` and `InertiaSharedDataAnalyzer::parseTsCastsFromMiddleware()` also return an `optionalOverrides` map of each entry's `'optional'` flag. An override that returns the old shape still works, but its entries' imports and `'optional'` flags are ignored.

### Custom Resource Transformers

If you subclass `ResourceTransformer` and read the protected `castKeysWithImport()` method or the `$importedCastKeys` property, move to the new cast record. Both are gone.

## Upgrading to 2.0 From 1.x

Version 2 aims to match everything Laravel Wayfinder provides, with a few things done differently.

### New in Version 2

Version 2 adds these features:

- Route functions based on your routes and controllers, including return types for Inertia routes and Vue components, and pagination with the model or resource embedded automatically
- Form request interfaces
- Broadcast channels
- Broadcast event interfaces
- A Laravel Echo TypeScript augmentation
- Global Inertia route response parameters
- A Vite env augmentation file, built from the `.env` settings prefixed with `VITE_`
- A generation cache that makes reruns of the full `ts:publish` command faster

Each feature's page in these docs shows the TypeScript it generates.

### Recommended Upgrade Flow

Follow these steps in order:

1. Update to the v2 package release in Composer.
2. Republish the config and views with `--force`. See [Configuration Changes](#configuration-changes) and [Templates](#templates).
3. Install `@tolki/ts` and remove `@tolki/enum`. See [New npm Package](#new-npm-package).
4. Update your Vite plugin import to `@tolki/ts/vite`.
5. Remove your old generated `data` folder.
6. Run a fresh publish with `php artisan ts:publish --fresh`.
7. Fix the import paths in your app code to match the modular namespace output. See [Modular Publishing Only](#modular-publishing-only).

### Breaking Changes

#### Configuration Changes

The version 1 configuration was mostly flat. Version 2 has more features, so each main feature has its own config block.

Most version 1 settings move into their block, and the block name leaves the key: `enum_template` becomes `enums.template`, and `publish_models` becomes `models.enabled`.

If you published the config file, republish it with the `--force` flag:

```bash
php artisan vendor:publish --tag="ts-publish-config" --force
```

##### Full Configuration Update List

The tables below map every key from the flat version 1 config to its version 2 block. The recommended path is to republish the config file, then use your project's git diff to find the customizations you need to reapply.

::: details Show the Full Key-by-Key Migration Table

###### 1) Pipeline Class Overrides Moved Under Each Feature Group

| Old key                      | New key                       |
| ---------------------------- | ----------------------------- |
| `model_collector_class`      | `models.collector_class`      |
| `model_generator_class`      | `models.generator_class`      |
| `model_transformer_class`    | `models.transformer_class`    |
| `model_writer_class`         | `models.writer_class`         |
| `enum_collector_class`       | `enums.collector_class`       |
| `enum_generator_class`       | `enums.generator_class`       |
| `enum_transformer_class`     | `enums.transformer_class`     |
| `enum_writer_class`          | `enums.writer_class`          |
| `resource_collector_class`   | `resources.collector_class`   |
| `resource_generator_class`   | `resources.generator_class`   |
| `resource_transformer_class` | `resources.transformer_class` |
| `resource_writer_class`      | `resources.writer_class`      |

###### 2) Shared Writer Overrides Renamed or Grouped

| Old key                     | New key                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| `barrel_writer_class`       | `barrel_writer_class` (same key, still supported as a shared override) |
| `globals_writer_class`      | `globals.writer_class`                                                 |
| `json_writer_class`         | `json.writer_class`                                                    |
| `watcher_json_writer_class` | `watcher.writer_class`                                                 |

###### 3) Template Key Migration

| Old key             | New key              |
| ------------------- | -------------------- |
| `model_template`    | `models.template`    |
| `enum_template`     | `enums.template`     |
| `resource_template` | `resources.template` |
| `globals_template`  | `globals.template`   |

Version 2 also adds template keys for the new features:

| New v2 template keys                          |
| --------------------------------------------- |
| `routes.template`                             |
| `form_requests.template`                      |
| `broadcast_channels.template`                 |
| `broadcast_events.template`                   |
| `broadcast_events.index_template`             |
| `broadcast_events.echo_augmentation.template` |

###### 4) Feature Enable Flags Moved From Flat Keys to Grouped Keys

| Old key                       | New key             |
| ----------------------------- | ------------------- |
| `publish_enums`               | `enums.enabled`     |
| `publish_models`              | `models.enabled`    |
| `publish_resources`           | `resources.enabled` |
| `output_globals_file`         | `globals.enabled`   |
| `output_json_file`            | `json.enabled`      |
| `output_collected_files_json` | `watcher.enabled`   |

Version 2 adds these feature toggles:

| New v2 feature toggles       |
| ---------------------------- |
| `routes.enabled`             |
| `form_requests.enabled`      |
| `broadcast_channels.enabled` |
| `broadcast_events.enabled`   |
| `inertia.enabled`            |
| `vite_env.enabled`           |
| `cache.enabled`              |

###### 5) Namespace and Casing Options Moved Under Feature Groups

| Old key                    | New key                           |
| -------------------------- | --------------------------------- |
| `models_namespace`         | `models.namespace`                |
| `enums_namespace`          | `enums.namespace`                 |
| `resources_namespace`      | `resources.namespace`             |
| `relationship_case`        | `models.relationship_case`        |
| `enum_method_case`         | `enums.method_case`               |
| `nullable_relations`       | `models.nullable_relations`       |
| `relation_nullability_map` | `models.relation_nullability_map` |

The `*.namespace` keys have no effect in version 2. The globals file names each namespace after the class's PHP namespace, as described in [Modular Publishing Only](#modular-publishing-only).

###### 6) Include, Exclude, and Additional Directories Migrated Per Feature

| Old key                           | New key                            |
| --------------------------------- | ---------------------------------- |
| `additional_model_directories`    | `models.additional_directories`    |
| `included_models`                 | `models.included`                  |
| `excluded_models`                 | `models.excluded`                  |
| `additional_enum_directories`     | `enums.additional_directories`     |
| `included_enums`                  | `enums.included`                   |
| `excluded_enums`                  | `enums.excluded`                   |
| `additional_resource_directories` | `resources.additional_directories` |
| `included_resources`              | `resources.included`               |
| `excluded_resources`              | `resources.excluded`               |

These new version 2 blocks use the same include, exclude, and additional directories pattern:

| New v2 blocks using the same pattern |
| ------------------------------------ |
| `form_requests.*`                    |
| `broadcast_events.*`                 |

###### 7) Enum Metadata and Options Renamed and Regrouped

| Old key                            | New key                             |
| ---------------------------------- | ----------------------------------- |
| `enum_metadata_enabled`            | `enums.metadata_enabled`            |
| `enums_use_tolki_package`          | `enums.use_tolki_package`           |
| `auto_include_enum_methods`        | `enums.auto_include_methods`        |
| `auto_include_enum_static_methods` | `enums.auto_include_static_methods` |

###### 8) Output File Naming and Output Directory Keys Grouped

| Old key                                 | New key                    |
| --------------------------------------- | -------------------------- |
| `global_filename`                       | `globals.filename`         |
| `global_directory`                      | `globals.output_directory` |
| `json_filename`                         | `json.filename`            |
| `json_output_directory`                 | `json.output_directory`    |
| `collected_files_json_filename`         | `watcher.filename`         |
| `collected_files_json_output_directory` | `watcher.output_directory` |

###### 9) Modular Publishing Setting Removed

| Old key              | Status in v2                          |
| -------------------- | ------------------------------------- |
| `modular_publishing` | Removed. Modular output is always on. |

###### 10) New Top-Level Config Groups in v2

These blocks did not exist in the version 1 config:

| New v2 top-level block |
| ---------------------- |
| `cache.*`              |
| `routes.*`             |
| `form_requests.*`      |
| `broadcast_channels.*` |
| `broadcast_events.*`   |
| `inertia.*`            |
| `vite_env.*`           |

Version 2 also adds this nested block:

| New v2 nested block                    |
| -------------------------------------- |
| `broadcast_events.echo_augmentation.*` |

###### 11) Keys That Stayed the Same

These keys are still top-level and need no migration:

| Key                      | Status                      |
| ------------------------ | --------------------------- |
| `run_after_migrate`      | Unchanged (still top-level) |
| `output_to_files`        | Unchanged (still top-level) |
| `output_directory`       | Unchanged (still top-level) |
| `namespace_strip_prefix` | Unchanged (still top-level) |
| `custom_ts_mappings`     | Unchanged (still top-level) |
| `timestamps_as_date`     | Unchanged (still top-level) |

`ts_extends` still exists, and version 2 adds sections beyond `models` and `resources`:

| `ts_extends` key              | v2 note           |
| ----------------------------- | ----------------- |
| `ts_extends.form_requests`    | New section in v2 |
| `ts_extends.broadcast_events` | New section in v2 |

:::

#### New npm Package

To support functional routing as well as functional enums, install the new `@tolki/ts` package that goes with this Laravel package:

```bash
npm install @tolki/ts
```

Then uninstall the previous `@tolki/enum` package. `@tolki/ts` supports both the version 1 functional enums and the new version 2 functional routing functions:

```bash
npm uninstall @tolki/enum
```

If you use the Vite plugin, update its import path in your Vite config file:

```typescript
import { laravelTsPublish } from "@tolki/ts/vite";
```

The build flag changed too. The Vite plugin from `@tolki/enum` calls `ts:publish` with the `--only-enums` option. The `@tolki/ts` Vite plugin calls it with `--only-functional` instead, which skips model and resource interfaces when building assets.

#### Templates

If you published and modified the Blade templates, publish them again and reapply your changes:

```bash
php artisan vendor:publish --tag="laravel-ts-publish-views" --force
```

#### `TsResourceCasts` Attribute Removed

The `TsResourceCasts` attribute (`AbeTwoThree\LaravelTsPublish\Attributes\TsResourceCasts`) has been removed.

Replace every use with `TsCasts` (`AbeTwoThree\LaravelTsPublish\Attributes\TsCasts`), which now handles resources, trait methods, models, and form requests the same way. The constructor signature and array format are identical. Only the class name changes:

```php
// Before
use AbeTwoThree\LaravelTsPublish\Attributes\TsResourceCasts;
#[TsResourceCasts(['field' => 'string'])]

// After
use AbeTwoThree\LaravelTsPublish\Attributes\TsCasts;
#[TsCasts(['field' => 'string'])]
```

#### Pipeline Customization

If you changed or extended a collector, generator, transformer, writer, or template in version 1, check that your changes still work with version 2. Then register your classes under the new `*_class` keys in each feature's block to override the package defaults. See [Customizing the Pipeline](./customizing-the-pipeline.md).

#### Modular Publishing Only

In version 1, the default output was a flat directory, with a setting for modular publishing. Version 2 always publishes in the modular format, and there's no setting for a flat directory. With 7 large groups of features instead of 3, supporting both layouts was error-prone, so version 2 keeps only the modular one.

Update the import paths in your code to match the PHP namespace of each model, enum, and resource. Delete the `data` folder that holds your previous types, then run `php artisan ts:publish --fresh`, so the files you see match the version 2 output.

For example, take a model in this PHP namespace:

```php
<?php

namespace App\Models\Users;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    //
}
```

Its import path changes like this:

```typescript
// Before
import type { User } from "@data/models";

// After
import type { User } from "@data/app/models/users";
```

If you use the globals file, its namespaces follow your PHP namespaces too. A version 1 flat-mode type such as `models.User` becomes `app.models.users.User` for the model above. See [Global Declaration File](./publishing.md#global-declaration-file).

### New Command Options and Behavior

Version 2 adds more selective `ts:publish` flags and a cache control:

```bash
# Every enabled feature except model and resource interfaces
php artisan ts:publish --only-functional

# One feature at a time
php artisan ts:publish --only-routes
php artisan ts:publish --only-form-requests
php artisan ts:publish --only-broadcast-channels
php artisan ts:publish --only-broadcast-events

# Rebuild the cache
php artisan ts:publish --fresh
```

These flags follow three rules:

- You can pass only one `--only-*` flag per command.
- `--only-functional` takes precedence and ignores other `--only-*` flags.
- `--fresh` forces a full regeneration and cache rebuild.

See [Limiting a Single Run With Flags](./publishing.md#limiting-a-single-run-with-flags) for every flag.

### New Config Groups in v2

Besides reorganizing the existing model, enum, and resource keys, version 2 adds these config blocks:

- `routes.*`
- `form_requests.*`
- `broadcast_channels.*`
- `broadcast_events.*`
- `inertia.*`
- `vite_env.*`
- `cache.*`

If you published a version 1 config, republish it and reapply your customizations to the new block structure.

### New Generated Files You Should Expect

Depending on which features are enabled, version 2 generates these files beyond enums, models, and resources:

- Route controller helper files
- Form request TypeScript interfaces
- Event parameter TypeScript interfaces
- `broadcast-channels.ts`
- `broadcast-events.ts`
- `echo-broadcast-events.d.ts`, when the Echo augmentation is enabled
- `inertia-config.d.ts`
- `vite-env.d.ts`, or your configured filename

Make sure your `tsconfig.json` include patterns cover these generated declaration files.

### Generation Cache

Version 2 adds a generation cache that skips unchanged classes after the first run:

- Run `php artisan ts:publish --fresh` after upgrading.
- Use `--fresh` any time you need to guarantee a full rebuild.

See [Cache Generation](./generating-cache.md) for how the cache works.
