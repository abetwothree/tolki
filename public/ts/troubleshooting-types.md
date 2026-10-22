---
url: /ts/troubleshooting-types.md
---
# Troubleshooting Types

This page covers two problems with types: a `@tolki/*` type that resolves to `any`, and an API resource macro that publishes `unknown`.

## A `@tolki/*` Type Resolves to `any`

A type you import from a `@tolki/*` package can resolve to `any` in your app, with no editor warning and no build error. If it does, you're likely on a version whose declaration files break once installed from npm. This section shows how to confirm it and which versions fix it.

### Symptom

An import from `@tolki/ts`, `@tolki/enum`, or `@tolki/utils` resolves to `any` instead of its real type, and neither `tsc` nor your editor reports anything wrong.

It stays silent because of `skipLibCheck: true`, the default in most starter `tsconfig.json` files. That option skips type checking inside `.d.ts` files, including the import line that fails to resolve. The import becomes `any` instead of raising `TS2307: Cannot find module`.

### Checking Your Project

Paste this into your project, replacing `EnumConst` and the package with a `@tolki/*` type you already import:

```typescript
import type { EnumConst } from "@tolki/ts";

type ShouldBeAType = "not-a-function";
const probe: ShouldBeAType = {} as EnumConst;
```

If this compiles without an error, the type resolved to `any`, and you're affected. `any` is assignable to anything, including a type it isn't. If `tsc` reports `TS2322` (`EnumConst` is not assignable to `"not-a-function"`), the type resolves correctly.

### Cause

The affected versions ship declaration files that import types from another `@tolki/*` package through a relative path into the Tolki source repository, instead of through the package name. That path doesn't exist in your `node_modules`, so the import resolves nowhere.

You can spot it in the package's `.d.ts` files. An affected version has an import like this one:

```typescript
// Affected: a relative path that exists only in the Tolki source repository
import { AsEnum, DefineEnumResult } from "../packages/types/src/index.ts";
```

A fixed version imports through the package name:

```typescript
// Fixed: the package name, resolved through node_modules
import { AsEnum, DefineEnumResult } from "@tolki/types";
```

The runtime JavaScript was never affected. Only the `.d.ts` files were.

### Fix

Upgrade each `@tolki/*` package you use to at least the version that fixed its declaration files:

| Package        | Fixed in |
| -------------- | -------- |
| `@tolki/ts`    | `1.0.2`  |
| `@tolki/enum`  | `1.1.2`  |
| `@tolki/utils` | `1.2.0`  |

For example, upgrade `@tolki/ts` with your package manager:

::: code-group

```bash [npm]
npm install @tolki/ts@latest
```

```bash [yarn]
yarn add @tolki/ts@latest
```

```bash [pnpm]
pnpm add @tolki/ts@latest
```

:::

Then run the check in [Checking Your Project](#checking-your-project) again. It should now report `TS2322`.

## A Resource Macro Publishes `unknown`

A key that calls a macro you registered on `JsonResource`, such as `'label' => $this->label()`, can publish `unknown`. The package types a macro from its native return type, then its `@return` docblock, then its body. It reads the body without the values the call passes, and it doesn't read the body of a closure declared outside a class method, such as in `bootstrap/app.php`.

Give the closure a return type, and the key takes it:

```php
JsonResource::macro('label', function (): string {
    return strtoupper($this->resource->title);
});
```

A `@return` docblock on the closure works too, but only when you declare the closure inside a class, such as in a service provider's `boot()` method.

If the key publishes the type of a model method with the same name instead, the package didn't see the macro. Register it in the `boot()` method of a provider that isn't deferred, so it exists before `ts:publish` reads your resources. See [Resource Macros](./api-resources.md#resource-macros).
