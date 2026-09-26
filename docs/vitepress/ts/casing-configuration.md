# Casing Configurations

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) has three config options that set the casing of generated names: `models.relationship_case` for model relations, `enums.method_case` for enum methods, and `routes.method_casing` for route actions. Each one accepts `'snake'`, `'camel'`, or `'pascal'`, and each affects only its own feature. There's no global casing setting, and no attribute or `@tolki/ts` setup is involved.

## `models.relationship_case`

This option sets the casing of relation names in generated model interfaces. See [Models](./models.md) for how relations publish.

```php
// config/ts-publish.php

'models' => [
    'relationship_case' => 'snake', // default
],
```

For a relation method named `ownedTeams()`, each value gives these names:

| Config Value | Relationship `ownedTeams()` | Count               | Exists               |
| ------------ | --------------------------- | ------------------- | -------------------- |
| `'snake'`    | `owned_teams: Team[]`       | `owned_teams_count` | `owned_teams_exists` |
| `'camel'`    | `ownedTeams: Team[]`        | `ownedTeams_count`  | `ownedTeams_exists`  |
| `'pascal'`   | `OwnedTeams: Team[]`        | `OwnedTeams_count`  | `OwnedTeams_exists`  |

Only the relation name is cased. The `_count` and `_exists` suffixes are added as they are, so `'camel'` gives you `ownedTeams_count`, not `ownedTeamsCount`.

::: info Count and exists properties
For every relation on a model, the package also publishes a `_count` and an `_exists` property. They type the attributes that Laravel's [`withCount` and `withExists`](https://laravel.com/docs/eloquent-relationships#counting-related-models) add, and they appear in every generated model's interfaces.
:::

## `enums.method_case`

This option sets the casing of enum method and static method keys in the generated output. See [Enums](./enums.md) for which methods publish, through `#[TsEnumMethod]`, `#[TsEnumStaticMethod]`, and the `auto_include_methods` and `auto_include_static_methods` settings.

```php
// config/ts-publish.php

'enums' => [
    'method_case' => 'camel', // default
],
```

For a method named `getLabel()` and a static method named `AllLabels()`, each value gives these keys:

| Config Value | Method `getLabel()` | Static Method `AllLabels()` |
| ------------ | ------------------- | --------------------------- |
| `'snake'`    | `get_label`         | `all_labels`                |
| `'camel'`    | `getLabel`          | `allLabels`                 |
| `'pascal'`   | `GetLabel`          | `AllLabels`                 |

::: tip Renamed methods are cased too
The setting applies to every published enum method, instance or static, however it was included. You can rename one method with the `name` parameter of `#[TsEnumMethod]` or `#[TsEnumStaticMethod]`, but that name goes through this setting as well: under the default `'camel'`, `#[TsEnumMethod(name: 'get_label')]` publishes `getLabel`. Write the name in your configured casing to keep it as written. A case renamed with `#[TsCase(name:)]` isn't affected, and publishes exactly as written.
:::

## `routes.method_casing`

This option sets the casing of each route action's exported name. See [Routing](./routing.md) for how routes publish. It changes only the generated export name. The Laravel route name stays the same, so `route()` and Ziggy calls still use it.

```php
// config/ts-publish.php

'routes' => [
    'method_casing' => 'camel', // default
],
```

For controller methods named `updateProfile()` and `store()`, each value gives these export names:

| Config Value | Controller method `updateProfile()` | Controller method `store()` |
| ------------ | ----------------------------------- | --------------------------- |
| `'snake'`    | `update_profile`                    | `store`                     |
| `'camel'`    | `updateProfile`                     | `store`                     |
| `'pascal'`   | `UpdateProfile`                     | `Store`                     |

::: info Reserved words
If the cased name is a reserved JavaScript word, such as `delete`, the package adds `Method` to it, so the export is `deleteMethod` and stays a valid identifier.
:::

## Configuration Reference

These are the three options and their defaults:

| Config Key                 | Type     | Default   | Description                                                                 |
| -------------------------- | -------- | --------- | --------------------------------------------------------------------------- |
| `models.relationship_case` | `string` | `'snake'` | Casing for relation names. The `_count` and `_exists` suffixes don't change |
| `enums.method_case`        | `string` | `'camel'` | Casing for enum instance and static method keys                             |
| `routes.method_casing`     | `string` | `'camel'` | Casing for each route action's exported name                                |

The full list of `models.*`, `enums.*`, and `routes.*` config keys is in the [Configuration Reference](./configuration-reference.md).
