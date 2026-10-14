# Arrays, objects, data and Collection layering

How four packages stack, and why that lets the docs share one reference page.

```
@tolki/collection  ->  @tolki/data  ->  @tolki/arr
                                    ->  @tolki/obj
```

`@tolki/arr` works on arrays and `@tolki/obj` on plain objects. Laravel's `Arr` and `data_*` helpers treat a PHP array as both, so `@tolki/data` picks between them at runtime. `@tolki/collection` holds its items in either shape and calls `@tolki/data` for most of its work.

## How `data` dispatches

`packages/data/src/dispatch.ts` exports `dispatch(arrFn, objFn, toPositional?, toKeyed?)`. Most of `data.ts` is one line per helper:

```ts
export const dataGet = dispatch(arrGet, objGet);
```

The returned function checks its first argument with `isKeyedData`:

- A `Map`, or an object that is not iterable, is keyed. The call goes to `objFn` after `toKeyed` runs.
- Anything else is positional: arrays, `Set`s, generators and scalars. The call goes to `arrFn` after `toPositional` runs.

The defaults are `keepKeyedData`, which hands the data on as it arrived so a `Map` keeps its insertion order, and `toPositionalBacking`, which reads a `Set` or generator to the end into a list. A helper that must not read an unbounded generator uses `streamPositionalData`. A helper that writes uses `copyKeyedData`, so the caller's `Map` is never changed. A helper that reads by path or does not care about entry order uses `toKeyedData`, which turns a `Map` into a record.

### The intersection type

`dispatch` returns `KeyedMapRow<TObjFn> & TArrFn & TObjFn`. Intersecting two overloaded function types makes TypeScript try the rows of each in turn, so the return type of a call is whatever the matching delegate row says. `data` never restates a delegate's types, which is why they cannot drift.

Two rules keep that sound:

- `arrFn` goes first. Arr's rows are array-shaped, so keyed data falls through them to `objFn`.
- The `Map` row goes before both delegates. Either delegate's own rows would claim a `Map` first and answer with a type the runtime never returns.

An intersection can only widen what a call accepts. It cannot make `dataX` reject an input that one delegate takes.

## Hand-written helpers

Ten helpers do not use `dispatch`, because the two delegates differ in more than the backing. Each is a hand-written function with its own overloads: `dataCombine`, `dataCount`, `dataUndot`, `dataUnion`, `dataMapWithKeys`, `dataSearch`, `dataBefore`, `dataAfter`, `dataReplace` and `dataReplaceRecursive`.

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
