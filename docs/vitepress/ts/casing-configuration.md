# Casing Configurations

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) provides three independent config options to control the casing of generated property and method names — one for model relationship names, one for enum method names, and one for route action names. All three accept `'snake'`, `'camel'`, or `'pascal'`, and each only affects its own feature; there's no single global casing setting.

As mentioned in [Installation & Usage](./index.md), these are plain config values with no attribute or runtime component involved.

## `models.relationship_case`

Controls relationship names in generated model TypeScript interfaces — see [Models](./models.md) for the full relation-generation behavior.

```php
// config/ts-publish.php

'models' => [
    'relationship_case' => 'snake', // default
],
```

| Config Value | Relationship `hasMany(Post::class)` | Count          | Exists          |
|--------------|--------------------------------------|----------------|------------------|
| `'snake'`    | `posts: Post[]`                      | `posts_count`  | `posts_exists`   |
| `'camel'`    | `posts: Post[]`                      | `postsCount`   | `postsExists`    |
| `'pascal'`   | `Posts: Post[]`                      | `PostsCount`   | `PostsExists`    |

> [!NOTE]
> For each relationship defined on a model, this package automatically generates `_count` and `_exists` properties alongside the relation itself. These correspond to [Laravel's `withCount` and `withExists`](https://laravel.com/docs/eloquent-relationships#counting-related-models) features and are included in every generated model interface.

## `enums.method_case`

Controls the casing of enum method and static method key names in the generated TypeScript output — see [Enums](./enums.md) for the full method-inclusion behavior (`#[TsEnumMethod]`, `#[TsEnumStaticMethod]`, and the `auto_include_methods` / `auto_include_static_methods` config).

```php
// config/ts-publish.php

'enums' => [
    'method_case' => 'camel', // default
],
```

| Config Value | Method `getLabel()` | Static Method `AllLabels()` |
|--------------|----------------------|-------------------------------|
| `'snake'`    | `get_label`          | `all_labels`                  |
| `'camel'`    | `getLabel`           | `allLabels`                   |
| `'pascal'`   | `GetLabel`           | `AllLabels`                   |

> [!TIP]
> This setting applies to all enum methods — both instance methods (via `#[TsEnumMethod]` or `enums.auto_include_methods`) and static methods (via `#[TsEnumStaticMethod]` or `enums.auto_include_static_methods`). You can still override an individual method's name using the `name` parameter on the attribute, regardless of this setting.

## `routes.method_casing`

Controls the casing of each generated route action's exported identifier — see [Routing](./routing.md) for the full route-generation behavior. This only affects the generated variable/export name; it never changes the underlying Laravel route name (`route()`/`Ziggy` calls still use the original route name).

```php
// config/ts-publish.php

'routes' => [
    'method_casing' => 'camel', // default
],
```

| Config Value | Controller method `updateProfile()` | Controller method `store()` |
|--------------|----------------------------------------|--------------------------------|
| `'snake'`    | `update_profile`                       | `store`                        |
| `'camel'`    | `updateProfile`                        | `store`                         |
| `'pascal'`   | `UpdateProfile`                        | `Store`                        |

> [!NOTE]
> If the casing transformation produces a reserved JavaScript/TypeScript keyword (e.g. a method named `delete`), the export name is automatically suffixed with `Method` (e.g. `deleteMethod`) to stay a valid identifier.

## Configuration Reference

| Config Key                 | Type     | Default   | Description                                                     |
|------------------------------|----------|-----------|--------------------------------------------------------------------|
| `models.relationship_case`   | `string` | `'snake'` | Casing for relation names and their `_count` / `_exists` properties |
| `enums.method_case`          | `string` | `'camel'` | Casing for enum instance/static method key names                   |
| `routes.method_casing`       | `string` | `'camel'` | Casing for each route action's exported identifier                 |

The full list of `models.*`, `enums.*`, and `routes.*` config keys lives in the [Configuration Reference](./configuration-reference.md).
