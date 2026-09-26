# Modular Publishing

The package writes every TypeScript file into a directory tree that mirrors your PHP namespaces. There's no flat-output mode, and no setting to turn this off. Modular and domain-driven apps, such as those built with [InterNACHI/modular](https://github.com/InterNACHI/modular), keep each module's types together, and a single-namespace app gets one `app/` tree. Models, enums, resources, form requests, broadcast events, and routes all follow the same rule.

::: info Upgrading from V1
In V1, modular output was an opt-in setting beside a default flat mode. V2 removed the flat mode, so output always follows your namespaces. If you're upgrading from V1, see [Modular Publishing Only](./upgrade-guide.md#modular-publishing-only) in the upgrade guide.
:::

## Output Structure

An app with an `App` namespace and a second `Accounting` module produces a tree like this:

```text
resources/js/types/data/
├── app/
│   ├── enums/
│   │   ├── role.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── admin/
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── events/
│   │   ├── OrderShipped.ts
│   │   ├── UserRegisteredEvent.ts
│   │   └── index.ts
│   └── http/
│       ├── controllers/
│       │   ├── post-controller.ts
│       │   └── index.ts
│       ├── requests/
│       │   ├── store-post-request.ts
│       │   └── index.ts
│       └── resources/
│           ├── user-resource.ts
│           └── index.ts
├── accounting/
│   ├── enums/
│   │   ├── invoice-status.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── invoice.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   └── http/
│       └── resources/
│           ├── invoice-resource.ts
│           └── index.ts
├── broadcast-channels.ts
├── broadcast-events.ts
├── echo-broadcast-events.d.ts
├── inertia-config.d.ts
├── vite-env.d.ts
├── laravel-ts-collected-files.json
└── laravel-ts-global.ts
```

Each namespace directory gets a barrel `index.ts` that exports every file in it. See [Barrel Files](#barrel-files).

::: tip Broadcast event files keep their class name
A broadcast event's file is named after its PHP class, such as `OrderShipped.ts` rather than `order-shipped.ts`. Every other feature kebab-cases its file names.
:::

The files at the root of the tree combine output from many classes, so they don't belong to a namespace directory. Each one has a config key to rename it. This table shows the default names and the setting that turns each file on:

| File                              | Turned On By                                 | Default |
| --------------------------------- | -------------------------------------------- | ------- |
| `broadcast-channels.ts`           | `broadcast_channels.enabled`                 | On      |
| `broadcast-events.ts`             | `broadcast_events.enabled`                   | On      |
| `echo-broadcast-events.d.ts`      | `broadcast_events.echo_augmentation.enabled` | On      |
| `inertia-config.d.ts`             | `inertia.enabled`                            | On      |
| `vite-env.d.ts`                   | `vite_env.enabled`                           | On      |
| `laravel-ts-collected-files.json` | `watcher.enabled`                            | On      |
| `laravel-ts-global.ts`            | `globals.enabled`                            | Off     |
| `laravel-ts-definitions.json`     | `json.enabled`                               | Off     |

A file with nothing to declare isn't written. The two broadcast event files need at least one broadcast event. `inertia-config.d.ts` needs the package to find your Inertia middleware, and `vite-env.d.ts` needs a `VITE_` variable in your env file.

The Echo augmentation declares types for the Echo package your `package.json` has: `@laravel/echo-vue`, `@laravel/echo-react`, or `@laravel/echo-svelte`, falling back to `@laravel/echo`. To pick one yourself, set `broadcast_events.echo_augmentation.echo_package`.

## How Output Paths Are Built

The package builds each file's directory from its class's namespace:

1. It drops the class name and keeps the namespace.
2. It removes `namespace_strip_prefix` from the start of the namespace, if the namespace starts with it. See [Stripping a Namespace Prefix](#stripping-a-namespace-prefix).
3. It kebab-cases each namespace segment on its own, then joins the segments with `/`.

The file name is the kebab-cased class name, except for broadcast events:

| PHP Class                           | Output File                            |
| ----------------------------------- | -------------------------------------- |
| `App\Models\User`                   | `app/models/user.ts`                   |
| `App\Enums\Role`                    | `app/enums/role.ts`                    |
| `Accounting\Models\Invoice`         | `accounting/models/invoice.ts`         |
| `Shipping\Enums\ShipmentStatus`     | `shipping/enums/shipment-status.ts`    |
| `App\Domain\Billing\Models\Invoice` | `app/domain/billing/models/invoice.ts` |

### Nested Namespaces

A namespace of any depth becomes nested directories. `App\Models\Admin\Store` produces an `admin/` directory inside `app/models/`:

```text
app/models/
├── admin/
│   ├── store.ts
│   └── index.ts
├── user.ts
└── index.ts
```

## Automatic Relative Imports

Generated files import each other with relative paths, which the package works out from the two namespace paths. You don't need to configure a path alias for them:

| From          | To              | Result             |
| ------------- | --------------- | ------------------ |
| `blog/models` | `blog/models`   | `.`                |
| `blog/models` | `blog/enums`    | `../enums`         |
| `app/models`  | `blog/enums`    | `../../blog/enums` |
| `models`      | `models/videos` | `./videos`         |

A path into a directory below starts with `./`, because TypeScript reads a bare specifier such as `videos` as a package import. Any other path climbs one `../` per directory level, then descends to the target.

This is how `accounting/models/invoice.ts` imports from another module, a sibling namespace, and its own namespace:

```typescript
// accounting/models/invoice.ts

import type { User } from "../../app/models"; // another module
import type { InvoiceStatusType } from "../enums"; // sibling namespace (accounting/enums)
import type { Payment } from "."; // same namespace (accounting/models)

export interface Invoice {
  id: number;
  user_id: number;
  status: InvoiceStatusType;
  // ...
}

export interface InvoiceRelations {
  user: User;
  payments: Payment[];
  // ...
}
```

## Stripping a Namespace Prefix

If your modules share a namespace prefix, such as `Modules\`, remove it from the output paths with the `namespace_strip_prefix` option:

```php
// config/ts-publish.php

'namespace_strip_prefix' => 'Modules\\',
```

The prefix comes off the start of each matching namespace before the path is built:

| PHP Class                        | Without a Prefix                    | With `'Modules\\'`          |
| -------------------------------- | ----------------------------------- | --------------------------- |
| `Modules\Blog\Models\Article`    | `modules/blog/models/article.ts`    | `blog/models/article.ts`    |
| `Modules\Shipping\Enums\Carrier` | `modules/shipping/enums/carrier.ts` | `shipping/enums/carrier.ts` |

The default is an empty string, which strips nothing.

## Barrel Files

Each namespace directory gets a barrel `index.ts` that re-exports every file in it, sorted alphabetically with no duplicates. This is `accounting/models/index.ts`:

```typescript
export * from "./invoice";
export * from "./payment";
```

A barrel lets you import from a namespace directory instead of from each file. These imports use the `@data` alias from [Importing the Published Files](./index.md#importing-the-published-files):

```typescript
import type { User, Order } from "@data/app/models";
import type { Invoice } from "@data/accounting/models";
import type { InvoiceStatusType } from "@data/accounting/enums";
```

Models, enums, resources, form requests, broadcast events, and routes each write their own barrels. A route barrel re-exports each controller's default export by name, such as `export { default as PostController } from './post-controller';`, rather than using `export *`. That keeps two controllers with a method of the same name from clashing.

::: tip Checking barrel output
`ts:publish --preview=true` prints each barrel's contents under its own label, such as `Model Barrel Files:` or `Enum Barrel Files:`, next to the per-class files. A verbose run, `ts:publish -v`, lists each barrel file's path in its Extras table.
:::

Model interfaces and [model metadata](./model-metadata.md) companions (`_meta` files) share their namespace directory, so they share one barrel. Each export in it belongs to one of the two, and a run rebuilds the exports of each one it publishes:

- An export for a model you removed disappears on the next run.
- If an `--only-*` flag skips one of the two while it's enabled in config, its exports stay.
- If one of the two is disabled in config, its exports are removed.

Barrels are generated files. The package doesn't keep comments or lines you add to them, and `--source` runs never change them.

## Applies Across Every Feature

Namespace paths work the same way for every feature that publishes one file per class:

- [Models](./models.md): the model's interfaces, such as `{Model}`, `{Model}Mutators`, `{Model}Relations`, and `{Model}Resource`, and its `{model}_meta.ts` [model metadata](./model-metadata.md) companion.
- [Enums](./enums.md): the enum object and its type aliases.
- [API Resources](./api-resources.md): resource interfaces.
- [Form Requests](./form-requests.md): request payload interfaces.
- [Broadcast Events](./broadcast-events.md): event interfaces.
- [Routing](./routing.md): route helper files, one per controller, at `{namespace path}/{controller-name}.ts`.

The [root-level files](#output-structure) don't use namespace paths, because each one combines output from many classes.
