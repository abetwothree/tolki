# FnTry playground

`FnTry` is the Vue component behind every "Try it" box in the VitePress docs. It runs a package function with editable arguments and shows the result live. It lives in `docs/vitepress/.vitepress/theme/components/FnTry.vue` and is registered globally, so any page can use it.

```md
<FnTry
  label="clamp"
  :fn="clamp"
  :args="[
    { name: 'value', type: 'number', default: 105 },
    { name: 'min', type: 'number', default: 10 },
    { name: 'max', type: 'number', default: 100 },
  ]"
/>
```

## Props

- `fn`: the function to run. It receives the parsed arguments in order.
- `args`: one entry per parameter, with `name`, `default`, an optional `type` and, for `select`, `options`.
- `label`: optional. When given, the eyebrow reads `▶ Try it · <label>`. Use it to name the function a demo runs, for example `dataGet`.

### Argument types

| `type`              | Control  | Value passed to `fn`                                                        |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `string` (or unset) | text     | the text as typed                                                           |
| `number`            | text     | `Number(text)`; an empty field is passed as `null`                          |
| `boolean`           | checkbox | `true` or `false`                                                           |
| `select`            | dropdown | the `value` of the chosen `{ label, value }` option (functions are allowed) |
| `json`              | textarea | `JSON.parse(text)`; the `default` is a real array or object                 |

Invalid JSON, or anything `fn` throws, shows as an error instead of a result.

## Result formatting

`formatResult` (in `docs/vitepress/.vitepress/theme/fn-try-format.ts`) prints what a JavaScript console would, in a compact form.

| Value                    | Shown as                                              |
| ------------------------ | ----------------------------------------------------- |
| `"a"`                    | `"a"`                                                 |
| `undefined`              | `undefined`                                           |
| `NaN`, `-0`, `10n`       | `NaN`, `-0`, `10n`                                    |
| `[1, "a", null]`         | `[1,"a",null]`                                        |
| `{ b: 1, a: [NaN] }`     | `{"b":1,"a":[NaN]}` (entry order kept)                |
| `new Map([["a", 1]])`    | `Map(1) {"a" => 1}`                                   |
| `new Set([1, 2])`        | `Set(2) {1, 2}`                                       |
| `collect({ a: 1 })`      | `{"a":1}` (any object with `toJSON`)                  |
| a `Date`                 | its ISO string, quoted (via `toJSON`)                 |
| a class instance         | `ClassName {"x":1}`                                   |
| `get` (a function)       | `[Function get]`; anonymous: `[Function (anonymous)]` |
| a self-referencing value | `[Circular]` at the repeated reference                |

## Errors

`formatError` shows `Name: message` for an `Error` subclass, so a thrown `InvalidArgumentException` reads `InvalidArgumentException: x`. A plain `Error` shows only its message, and a non-error value is shown as a string. The output gets the `fn-try-error` class and an `Error` label.

## Live region

The output container has `role="status"` and `aria-live="polite"`. Screen readers announce each new result when the user pauses, without stealing focus.

## Patterns from the str and num pages

- Wrap functions whose signature does not fit the controls in a small arrow function and pass that as `fn`.
- Use a `select` argument with presets to supply callbacks: each option's `value` is a function.
- Use `type: 'number'` for numbers. Many num functions treat a missing argument differently from `0`, which is why an empty field becomes `null`.
