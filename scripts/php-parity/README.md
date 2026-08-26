# PHP parity probes

This harness answers one question: **what does real Laravel actually do?**

Every package in this monorepo (`@tolki/arr`, `@tolki/obj`, `@tolki/data`,
`@tolki/collection`) ports behaviour from `Illuminate\Support\Arr` and
`Illuminate\Support\Collection`. Guessing at that behaviour from memory, from
docs, or from an old version leads to subtle mismatches. This harness removes
the guessing: it runs the **real** PHP classes, from the Laravel checkout at
`FRAMEWORK_PATH` in the repo's `.env`, and records exactly what they return
or throw.

## What it is not

- **Not a stub reimplementation.** `bootstrap.php` does not simulate Laravel
  — it `require`s the actual `vendor/autoload.php` from the framework
  checkout and calls the actual `Illuminate\Support\*` classes.
- **Not a test dependency.** Nothing in `pnpm test` or CI invokes PHP. These
  probes are a **development-time oracle only**: you run them by hand while
  writing or reviewing a task, and the values they print get transcribed into
  TypeScript tests as literals. Once that transcription happens, the
  TypeScript tests stand on their own — CI never needs PHP, Composer, or a
  Laravel checkout to be present.
- **Not exhaustive coverage.** Each `task-*.php` file probes exactly the
  behaviour a specific task needs, nothing more.
- **A global `SortDirection` enum is shimmed, not shipped.** `bootstrap.php:62`
  declares it before the autoloader runs, because the framework references
  `SortDirection::Ascending` / `::Descending` but does not ship the enum
  itself. The shim is compared by identity only, so it cannot alter any
  probe's observed behaviour. Native enums require PHP 8.1+; the Laravel
  checkout itself needs PHP 8.2+.

## Probes must be deterministic

The review workflow is `pnpm php:parity` producing an empty diff against
`docs/php-parity/`. A probe that depends on RNG, the system clock, locale,
or an absolute path (e.g. `FRAMEWORK_PATH`) breaks that: every regeneration
would show a spurious diff with no behavioural change behind it. Where a
method's output can't be pinned outright (`Arr::random`), pin the invariant
— key shape, count, type — instead of the drawn value.

## How it works

`bootstrap.php`:

1. Reads `FRAMEWORK_PATH` out of the repo's `.env`.
2. Requires that checkout's `vendor/autoload.php`, so `Illuminate\Support\*`
   classes are the real thing, not a mock.
3. Exposes two helpers to every probe file:
   - `probe(string $label, string $expression, callable $run): void` — runs
     `$run()` immediately and records the result. If it throws, the
     exception's class and message are captured instead of the return value,
     so exception parity can be verified the same way as return-value
     parity.
   - `emit(): void` — prints every recorded probe as one pretty-printed JSON
     array on stdout.

Each `task-NN-*.php` file requires `bootstrap.php`, calls `probe()` once per
behaviour under investigation, and finishes with `emit()`.

## Running the probes

Run a single probe file and capture its output:

```bash
php scripts/php-parity/task-02-mutation.php > docs/php-parity/task-02-mutation.json
```

Or regenerate every captured file at once:

```bash
pnpm php:parity
```

## Captured output is committed and reviewed

Everything under `docs/php-parity/*.json` is committed. That is deliberate:
the JSON is the reviewable evidence that a TypeScript test's expected value
actually came from Laravel, not from assumption. When the Laravel checkout
is upgraded, re-running `pnpm php:parity` regenerates every file, and any
behavioural drift shows up as an ordinary diff in `docs/php-parity/` for
review — the same way a schema migration shows up as a diff.

`docs/php-parity/` is listed in `.prettierignore` on purpose: these files
are PHP's own `JSON_PRETTY_PRINT` output, left exactly as `emit()` wrote it.
If Prettier were allowed to reformat them, every regeneration would carry a
cosmetic whitespace diff on top of (or instead of) any real behavioural
change, burying the signal this file exists to surface.

## The rule

**No behaviour may be ported into TypeScript without a captured probe
backing it.** If a task's tests assert a value, a shape, or a thrown-error
message that claims to match Laravel, there must be a corresponding
`probe()` call in a `task-*.php` file and a matching entry in
`docs/php-parity/*.json` that produced it. "I'm pretty sure Laravel does X"
is not sufficient — run the probe and look.
