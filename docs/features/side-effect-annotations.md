# Side-effect annotations

Bundlers keep a call whose result is unused unless they know it is pure. Every exported function of a published `@tolki/*` package says which kind it is, and a guard fails on any that does not. Source of truth: [`scripts/side-effects/scan.ts`](../../scripts/side-effects/scan.ts).

## Classification

A function is pure when deleting a call with an unused result changes nothing observable:

- It writes to no argument (array, object, Map or Set contents included) and not to `this`.
- It writes no module-level binding and no global. A memo cache does not count.
- It does no I/O.
- It is not called mainly to throw.

Reading globals is fine. Calling a caller's callback is fine when the result comes from its return values. Throwing a `TypeError` on bad input is fine.

Any other function gets `@sideEffects <category>` in its docblock, after the description and before `@param`, with an optional reason after the category:

| Category   | Meaning                                                  | Examples                                                       |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `mutates`  | Writes to an argument or `this`                          | arr/obj `pop`, `shift`; utils `defineKey`, `writeMapKey`       |
| `state`    | Writes module or global state, or framework context      | num `useLocale`; str `createUuidsUsing`; ts `setRouteDefaults` |
| `callback` | Runs a caller's callback for its effects                 | num `withLocale`, `withCurrency`                               |
| `asserts`  | Called to throw on invalid input; its result is optional | enum `from`; lang `assertLocale`                               |
| `io`       | Console, DOM writes, fs, child processes, network        | none yet                                                       |

## Judgement calls

- **Calls inside functions.** The annotation also drops an unused call inside a function body, not only at module scope, so a hook or function that registers or subscribes its caller (React and Vue `useLang`) is `state`.
- **Factory sequences.** `random`, `uuid` and `ulid` are pure even though, under a `create*UsingSequence` factory, a call advances the sequence. Like `Math.random`, that sequence is test-support state, and dropping an unused call shifts nothing a program relies on.
- **Lazy pluralize setup.** `plural`, `counted`, `pluralStudly`, `pluralPascal`, `singular`, `isPlural` and `isSingular` are pure. Their first call registers tolki's uncountable rules on the shared `pluralize` instance, which code importing `pluralize` directly can observe. That is a one-time, idempotent memoized setup, so dropping an unused call only delays it to the first used call. `inflector` itself is `state`.

## Annotation form

A line holding only `/* @__NO_SIDE_EFFECTS__ */`, after the docblock and directly above the `export function` that has the body. On an overloaded function that is the implementation signature.

Vite strips the comment in three places, and the scan reports each:

- above the first overload (`annotation-on-overload`);
- inside a `/** */` docblock (`annotation-in-jsdoc`);
- on an arrow `const` (`annotated-arrow`).

The fourth misplacement is the annotation followed by the docblock (`annotation-not-adjacent`). The two markers on one function is `annotated-and-tagged`, and an unlisted category is `unknown-category`.

## Why only function declarations

webpack ignores the annotation on an exported arrow or function-expression `const`, and webpack and Rspack ignore it through a `const` alias. So a function counts as pure only through an annotated `function` declaration.

## Exemptions and aliases

- `class`: bundlers cannot annotate a constructor, so an exported class is exempt. Consumers write `/* @__PURE__ */ new X()`.
- Alias export: `export const dataX = dataXImpl as ...` takes its classification from the same-file `function dataXImpl`, because the `@tolki/data` build ships that declaration itself. The annotation sits on the declaration. A `@sideEffects` tag may sit on either docblock. An alias of an imported name stays `unclassified`.
- Re-exports and non-function consts are not scanned.

## Module scope

Every call or `new` evaluated at module scope in published source carries `/* @__PURE__ */`, nested calls included, and no argument is a spread. The scan reports these as `unannotated-call`, `spread-argument` and `top-level-statement`.

## Guard

```bash
npx vitest run --project scripts side-effects
```

A new exported function is `unclassified` until it has one of the two markers, and the guard fails. `PENDING_PACKAGES` in [`scripts/__tests__/side-effects.test.ts`](../../scripts/__tests__/side-effects.test.ts) lists packages still being classified.
