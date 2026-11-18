# Arrays, objects, data and Collection layering

How four packages stack, and why that lets the docs share one reference page.

```
@tolki/collection  ->  @tolki/data  ->  @tolki/arr
                                    ->  @tolki/obj
```

`@tolki/arr` works on arrays and `@tolki/obj` on plain objects. Laravel's `Arr` and `data_*` helpers treat a PHP array as both, so `@tolki/data` picks between them at runtime. `@tolki/collection` holds its items in either shape and calls `@tolki/data` for most of its work.

## How `data` dispatches

`packages/data/src/dispatch.ts` exports `forwardData(arrFn, objFn, data, rest, toPositional?, toKeyed?)` and the `Dispatched` type. Most helpers in `data.ts` are a function declaration and an alias export that types it:

```ts
export const dataCollapse = dataCollapseImpl as unknown as Dispatched<
  typeof arrCollapse,
  typeof objCollapse
>;

/* @__NO_SIDE_EFFECTS__ */
function dataCollapseImpl(data: unknown, ...rest: readonly unknown[]): unknown {
  return forwardData(arrCollapse, objCollapse, data, rest);
}
```

`forwardData` checks `data` with `isKeyedData`:

- A `Map`, or an object that is not iterable, is keyed. The call goes to `objFn` after `toKeyed` runs.
- Anything else is positional: arrays, `Set`s, generators and scalars. The call goes to `arrFn` after `toPositional` runs.

The defaults are `keepKeyedData`, which hands the data on as it arrived so a `Map` keeps its insertion order, and `toPositionalBacking`, which reads a `Set` or generator to the end into a list. A helper that must not read an unbounded generator uses `streamPositionalData`. A helper that writes uses `copyKeyedData`, so the caller's `Map` is never changed. A helper that reads by path or does not care about entry order uses `toKeyedData`, which turns a `Map` into a record.

### The intersection type

`Dispatched<TArrFn, TObjFn>` is `KeyedMapRow<TObjFn> & TArrFn & TObjFn`. Intersecting two overloaded function types makes TypeScript try the rows of each in turn, so the return type of a call is whatever the matching delegate row says. `data` never restates a delegate's types, which is why they cannot drift. A function declaration cannot carry that type: `ReturnType` of an overloaded function sees only its last overload, so the export is a `const` cast to `Dispatched`.

Two rules keep that sound:

- `arrFn` goes first. Arr's rows are array-shaped, so keyed data falls through them to `objFn`.
- The `Map` row goes before both delegates. Either delegate's own rows would claim a `Map` first and answer with a type the runtime never returns.

An intersection can only widen what a call accepts. It cannot make `dataX` reject an input that one delegate takes.

### The build transform

Bundlers read `/* @__NO_SIDE_EFFECTS__ */` off a function declaration. Built without the transform, data's dist exports each helper through a `var` alias, and Rolldown, webpack and Rspack keep every unused call through it, where Rollup drops them. The Vite plugin in [scripts/build/alias-exports.ts](../../scripts/build/alias-exports.ts), used by `packages/data/vite.config.ts`, rewrites each `export const dataX = dataXImpl as …` to `export { dataXImpl as dataX }`. The dist then exports the annotated declaration, while the `.d.ts`, emitted from the source, keeps the alias's type. It fails the build when the module uses an alias's own name, which `export { … }` leaves unbound.

`dispatch(arrFn, objFn)` builds the same forwarder in one call. Only the type sweeps use it.

## Hand-written helpers

Ten helpers do not go through `forwardData`, because the two delegates differ in more than the backing. Each is a hand-written function with its own overloads: `dataCombine`, `dataCount`, `dataUndot`, `dataUnion`, `dataMapWithKeys`, `dataSearch`, `dataBefore`, `dataAfter`, `dataReplace` and `dataReplaceRecursive`.

## Names that differ between packages

| `@tolki/arr` | `@tolki/obj`    | `@tolki/data` | Note                                                         |
| ------------ | --------------- | ------------- | ------------------------------------------------------------ |
| `arrayItem`  | `objectItem`    | `dataItem`    | Get a typed item at a key.                                   |
| `arrayable`  | `objectifiable` | none          | Test whether a value can be treated as that package's shape. |
| none         | `flattenDot`    | none          | Obj only.                                                    |
| none         | none            | `dataCount`   | Data only.                                                   |
| none         | none            | `dataSearch`  | Data only.                                                   |
| none         | none            | `dataBefore`  | Data only.                                                   |
| none         | none            | `dataAfter`   | Data only.                                                   |

Every other helper exists in all three packages, as `name`, `name` and `dataName`, except `accessible` and `wrap`, which exist in `@tolki/arr` and `@tolki/obj` only. The utilities list therefore shows all three tabs for most sections, and fewer for the names above. `docs:coverage` reports an export with no section.

## How `Collection` uses `data`

`packages/collection/src/collection.ts` imports the `data*` helpers from `@tolki/data` and calls them on its items. A list backing reaches arr and a keyed backing reaches obj through the same dispatch. The class adds the fluent interface, the `list`, `keyed` and `partial` shapes, and Laravel's behavior that the helpers do not cover. A collection method is therefore documented once, on the Collections pages, and links to the shared concept pages for rules it inherits: dot notation and PHP semantics.

## Why one reference page works

Because `data` forwards to arr and obj without changing arguments or results, a function has one meaning in three spellings. One section per function with a tab per package is true for each tab, and the tabs only differ in imports and sample data. Where a package differs, the difference goes inside that tab's fence, and `readme:build` drops other packages' tabs from each README. See [docs-site.md](./docs-site.md) and [readme-build.md](./readme-build.md).
