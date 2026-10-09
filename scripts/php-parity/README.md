# PHP parity probes

This harness answers one question: **what does real Laravel actually do?**

Every package in this monorepo (`@tolki/arr`, `@tolki/obj`, `@tolki/data`,
`@tolki/collection`, `@tolki/str`, `@tolki/num`) ports behaviour from
`Illuminate\Support\Arr`, `Collection`, `Str`, `Stringable` and `Number`. Guessing at that behaviour from memory, from
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
- **Not exhaustive coverage.** Each probe file records the behaviour of one
  Laravel method that this monorepo's tests rely on, nothing more.
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
   - `emit(): void` — prints one pretty-printed JSON object on stdout:
     `{"meta": {"php", "laravel"}, "probes": [...]}`. `meta` records the PHP
     version and the framework revision (`git describe`) a capture was taken
     against; every recorded probe lands under `probes`.

`bootstrap.php` then requires `shared.php`, which holds every helper function
and fixture class the probe files use, so no probe file defines anything.

Each probe file requires `bootstrap.php`, calls `probe()` once per behaviour
under investigation, and finishes with `emit()`.

## Where a probe goes

Probes are grouped by the Laravel class they exercise, then by method:

```text
scripts/php-parity/
  bootstrap.php   shared.php
  Arr/get.php  Collection/pop.php  Number/pairs.php  Php/array_splice.php  …
docs/php-parity/
  Arr/get.json  Collection/pop.json  Number/pairs.json  Php/array_splice.json  …
```

- A probe belongs to the Laravel method it exercises: the method its label or
  description names, otherwise the first Laravel method its code calls,
  ignoring constructors (`collect()`, `new Collection`) and readers that only
  display a result (`all`, `values`, `toArray`). When a reader is the only
  method called, the reader is the subject (`Collection/count.php`).
- `Str::of(…)->x()` and `str(…)->x()` belong to `Stringable/x.php`, and a
  Laravel global function such as `data_get()` to `Helpers/data_get.php`.
- A probe of PHP itself goes to `Php/`, named as PHP spells the function
  (`Php/array_splice.php`). An operator gets a kebab-case topic:
  `spaceship` (`<=>`), `loose-equal` (`==`), `strict-equal` (`===`),
  `array-union` (`+` on arrays).
- A probe or loop that checks one property across several methods goes to a
  kebab-case idea file in that class's folder, such as
  `Collection/item-order.php`. Use one only when no single method fits.
- Every label one statement records goes to the same file; a loop is never
  split.
- A file's name is the method's name exactly as Laravel spells it
  (`sortBy.php`, `__construct.php`), and each transcript sits at the same
  path under `docs/php-parity/` with `.json` in place of `.php`.

## Adding a probe

Add the `probe()` call to the file of the method it exercises. If that file
does not exist yet, create `<Folder>/<method>.php`:

```php
<?php

/**
 * Ground truth for Collection::pop().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;

probe('pop-on-an-empty-collection', 'collect([])->pop()', fn () => collect([])->pop());

emit();
```

A label must be unique within its file. A helper function or fixture class
goes in `shared.php`. A Laravel sync adds its probes to the file of each
method it changes, rather than to a new file of its own.

## Running the probes

Regenerate every captured file at once — this is the normal path, and the
one the review workflow assumes:

```bash
pnpm php:parity
```

To run a single probe file by hand, use the same atomic pattern `pnpm
php:parity` uses per file, rather than a bare `>` redirect: PHP CLI writes
fatals to stdout as well as stderr, so a bare redirect can silently replace
committed ground truth with a stack trace.

```bash
o=docs/php-parity/Number/pairs.json
php -d display_errors=stderr scripts/php-parity/Number/pairs.php > "$o.tmp" && mv "$o.tmp" "$o"
```

## Captured output is committed and reviewed

Everything under `docs/php-parity/` is committed. That is deliberate:
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
`probe()` call in a probe file and a matching entry in its
`docs/php-parity/<Folder>/<name>.json` transcript. "I'm pretty sure Laravel does X"
is not sufficient — run the probe and look.
