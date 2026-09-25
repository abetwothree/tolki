<?php

/**
 * Ground truth for the Laravel v13.31-v13.33 (+ unreleased 13.x) stub sync.
 *
 * Collection (containsStrict, mode, collapseWithKeys, sortBy, take, combine), Number (negative zero, parseInt)
 * and Str (camel, password). A non-list result is recorded through `pairs()`, since a JSON object loses key order.
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

/**
 * Encode $value so JSON keeps its key order: each non-list array, at any depth, becomes a list of [key, value] pairs.
 *
 * @example pairs(['b' => 1, 'a' => 2]); -> [['b', 1], ['a', 2]]
 */
function pairs(mixed $value): mixed
{
    if ($value instanceof Collection) {
        $value = $value->all();
    }

    if (! is_array($value)) {
        return $value;
    }

    if (array_is_list($value)) {
        return array_map(pairs(...), $value);
    }

    $out = [];

    foreach ($value as $key => $item) {
        $out[] = [$key, pairs($item)];
    }

    return $out;
}

/** Hand containsStrict a key-recording callback that answers $answer($value), and return the keys it saw in order. */
function containsStrictKeysSeen(Collection $collection, Closure $answer): array
{
    $seen = [];

    $collection->containsStrict(function ($value, $key) use (&$seen, $answer) {
        $seen[] = $key;

        return $answer($value);
    });

    return $seen;
}

// containsStrict with a callback is array_any (laravel/framework#61507): a match holding null counts.
probe('containsStrict-list-null-callback', '(new Collection([1, null, 2]))->containsStrict(fn ($v) => is_null($v))', fn () => (new Collection([1, null, 2]))->containsStrict(fn ($v) => is_null($v)));
probe('containsStrict-list-zero-callback', '(new Collection([1, null, 2]))->containsStrict(fn ($v) => $v === 0)', fn () => (new Collection([1, null, 2]))->containsStrict(fn ($v) => $v === 0));
probe('containsStrict-assoc-null-callback', "(new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn (\$v) => is_null(\$v))", fn () => (new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn ($v) => is_null($v)));
probe('containsStrict-assoc-zero-callback', "(new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn (\$v) => \$v === 0)", fn () => (new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn ($v) => $v === 0));
probe('containsStrict-null-first-callback', "(new Collection([null, 'a']))->containsStrict(fn () => true)", fn () => (new Collection([null, 'a']))->containsStrict(fn () => true));
probe('doesntContainStrict-list-null-callback', '(new Collection([1, null, 2]))->doesntContainStrict(fn ($v) => is_null($v))', fn () => (new Collection([1, null, 2]))->doesntContainStrict(fn ($v) => is_null($v)));
probe('containsStrict-out-of-order-callback-keys', "keys a false-answering containsStrict callback sees on [2 => 'c', 0 => 'a', 1 => 'b']", fn () => containsStrictKeysSeen(new Collection([2 => 'c', 0 => 'a', 1 => 'b']), fn () => false));
probe('containsStrict-stops-at-first-match', "keys an is_null callback sees on ['a', null, 'c']", fn () => containsStrictKeysSeen(new Collection(['a', null, 'c']), fn ($v) => is_null($v)));

// mode() skips null items (laravel/framework#61686) and counts each value under its PHP array key.
probe('mode-key-with-nulls', "(new Collection([(object) ['foo' => 5], (object) ['foo' => null], (object) ['foo' => null]]))->mode('foo')", fn () => (new Collection([(object) ['foo' => 5], (object) ['foo' => null], (object) ['foo' => null]]))->mode('foo'));
probe('mode-null-and-value', '(new Collection([null, 3]))->mode()', fn () => (new Collection([null, 3]))->mode());
probe('mode-only-nulls', '(new Collection([null, null]))->mode()', fn () => (new Collection([null, null]))->mode());
probe('mode-missing-key', "(new Collection([['foo' => 5], ['bar' => 1], ['bar' => 2]]))->mode('foo')", fn () => (new Collection([['foo' => 5], ['bar' => 1], ['bar' => 2]]))->mode('foo'));
probe('mode-dotted-values', "(new Collection(['a.b', 'a.b', 'c']))->mode()", fn () => (new Collection(['a.b', 'a.b', 'c']))->mode());
probe('mode-bools', '(new Collection([true, true, false]))->mode()', fn () => (new Collection([true, true, false]))->mode());
probe('mode-numeric-strings', "(new Collection(['1', 1, '1']))->mode()", fn () => (new Collection(['1', 1, '1']))->mode());
probe('mode-empty-string', "(new Collection(['', '', 'a']))->mode()", fn () => (new Collection(['', '', 'a']))->mode());
probe('mode-tie-first-seen', '(new Collection([3, 1, 3, 1]))->mode()', fn () => (new Collection([3, 1, 3, 1]))->mode());
probe('mode-out-of-order-tie', "(new Collection([2 => 'c', 0 => 'a']))->mode()", fn () => (new Collection([2 => 'c', 0 => 'a']))->mode());
probe('mode-assoc-strings', "(new Collection(['x' => 'p', 'y' => 'q', 'z' => 'q']))->mode()", fn () => (new Collection(['x' => 'p', 'y' => 'q', 'z' => 'q']))->mode());

// collapseWithKeys() with string outer keys (laravel/framework#61539); it used to crash.
probe('collapseWithKeys-string-keys', "(new Collection(['first' => ['a' => 1, 'b' => 2], 'second' => ['c' => 3]]))->collapseWithKeys()", fn () => pairs((new Collection(['first' => ['a' => 1, 'b' => 2], 'second' => ['c' => 3]]))->collapseWithKeys()));
probe('collapseWithKeys-mixed-keys', "(new Collection([5 => ['a' => 1], 'second' => new Collection(['b' => 2, 'a' => 3])]))->collapseWithKeys()", fn () => pairs((new Collection([5 => ['a' => 1], 'second' => new Collection(['b' => 2, 'a' => 3])]))->collapseWithKeys()));
probe('collapseWithKeys-string-keys-lists', "(new Collection(['first' => [1, 2], 'second' => [3]]))->collapseWithKeys()", fn () => pairs((new Collection(['first' => [1, 2], 'second' => [3]]))->collapseWithKeys()));

// sortBy over numbers and numeric strings: SORT_NUMERIC (laravel/framework#61699) and the default flag agree here.
$prices = fn () => new Collection([['price' => 1.5], ['price' => '10.5'], ['price' => 1.2], ['price' => '10.2'], ['price' => 1.9]]);
probe('sortBy-many-numeric-flag-asc', "sortBy([['price', 'asc']], SORT_NUMERIC)->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'asc']], SORT_NUMERIC)->pluck('price')->values()->all());
probe('sortBy-many-numeric-flag-desc', "sortBy([['price', 'desc']], SORT_NUMERIC)->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'desc']], SORT_NUMERIC)->pluck('price')->values()->all());
probe('sortBy-many-default-flag-asc', "sortBy([['price', 'asc']])->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'asc']])->pluck('price')->values()->all());
probe('sortBy-many-default-flag-desc', "sortBy([['price', 'desc']])->pluck('price')->values()", fn () => $prices()->sortBy([['price', 'desc']])->pluck('price')->values()->all());
probe('sortBy-key-default-flag', "sortBy('price')->pluck('price')->values()", fn () => $prices()->sortBy('price')->pluck('price')->values()->all());

// take() and combine() gained Collection tests alongside the LazyCollection fixes (#61659, #61696).
probe('take-negative-past-size', "(new Collection(['taylor', 'dayle', 'shawn']))->take(-5)->all()", fn () => (new Collection(['taylor', 'dayle', 'shawn']))->take(-5)->all());
probe('combine-fewer-values', '(new Collection([1, 2]))->combine([3])->all()', fn () => (new Collection([1, 2]))->combine([3])->all());
probe('combine-more-values', '(new Collection([1]))->combine([2, 3])->all()', fn () => (new Collection([1]))->combine([2, 3])->all());

// Number::format(), percentage() and currency() no longer return "-0" (laravel/framework#61716).
probe('format-negative-zero', 'Number::format(-0.0)', fn () => Number::format(-0.0));
probe('format-rounds-to-zero', 'Number::format(-0.4, precision: 0)', fn () => Number::format(-0.4, precision: 0));
probe('format-rounds-to-zero-one-digit', 'Number::format(-0.04, precision: 1)', fn () => Number::format(-0.04, precision: 1));
probe('format-keeps-sign', 'Number::format(-0.06, precision: 1)', fn () => Number::format(-0.06, precision: 1));
probe('format-default-precision', 'Number::format(-0.4)', fn () => Number::format(-0.4));
probe('format-max-precision-rounds-to-zero', 'Number::format(-0.0004, maxPrecision: 2)', fn () => Number::format(-0.0004, maxPrecision: 2));
probe('format-rounds-to-zero-de', "Number::format(-0.04, precision: 1, locale: 'de')", fn () => Number::format(-0.04, precision: 1, locale: 'de'));
probe('percentage-rounds-to-zero', 'Number::percentage(-0.4)', fn () => Number::percentage(-0.4));
probe('percentage-rounds-to-zero-one-digit', 'Number::percentage(-0.04, precision: 1)', fn () => Number::percentage(-0.04, precision: 1));
probe('percentage-keeps-sign-one-digit', 'Number::percentage(-0.4, precision: 1)', fn () => Number::percentage(-0.4, precision: 1));
probe('percentage-keeps-sign', 'Number::percentage(-5)', fn () => Number::percentage(-5));
probe('percentage-max-precision-rounds-to-zero', 'Number::percentage(-0.004, maxPrecision: 2)', fn () => Number::percentage(-0.004, maxPrecision: 2));
probe('currency-rounds-to-zero', 'Number::currency(-0.001)', fn () => Number::currency(-0.001));
probe('currency-float-noise', 'Number::currency(0.1 + 0.2 - 0.3 - 0.0000000001)', fn () => Number::currency(0.1 + 0.2 - 0.3 - 0.0000000001));
probe('currency-rounds-to-zero-no-digits', 'Number::currency(-0.4, precision: 0)', fn () => Number::currency(-0.4, precision: 0));
probe('currency-keeps-sign', 'Number::currency(-0.006)', fn () => Number::currency(-0.006));
probe('currency-negative-zero', 'Number::currency(-0.0)', fn () => Number::currency(-0.0));
probe('currency-rounds-to-zero-eur-de', "Number::currency(-0.001, in: 'EUR', locale: 'de')", fn () => Number::currency(-0.001, in: 'EUR', locale: 'de'));

// Number::parseInt() parses 64-bit integers (laravel/framework#61691).
probe('parseInt-past-int32', "Number::parseInt('3,000,000,000')", fn () => Number::parseInt('3,000,000,000'));
probe('parseInt-past-int32-negative', "Number::parseInt('-3,000,000,000')", fn () => Number::parseInt('-3,000,000,000'));
probe('parseInt-max-safe-integer', "Number::parseInt('9007199254740991')", fn () => Number::parseInt('9007199254740991'));
probe('parseInt-php-int-max', '(string) Number::parseInt((string) PHP_INT_MAX)', fn () => (string) Number::parseInt((string) PHP_INT_MAX));

// Str::camel() lowercases a multibyte first character (laravel/framework#61545).
probe('camel-multibyte-first-space', "Str::camel('Über uns')", fn () => Str::camel('Über uns'));
probe('camel-multibyte-first-snake', "Str::camel('émile_zola')", fn () => Str::camel('émile_zola'));
probe('camel-multibyte-first-kebab', "Str::camel('Élan-vital')", fn () => Str::camel('Élan-vital'));

// Str::password() keeps its length below the pool count and refuses no pools (laravel/framework#61521).
probe('password-length-below-pool-count', 'array_map(fn ($n) => strlen(Str::password($n)), [1, 2, 3])', fn () => array_map(fn ($n) => strlen(Str::password($n)), [1, 2, 3]));
probe('password-zero-length', 'Str::password(0)', fn () => Str::password(0));
probe('password-negative-length', 'Str::password(-2)', fn () => Str::password(-2));
probe('password-no-pools', 'Str::password(32, false, false, false, false)', fn () => Str::password(32, false, false, false, false));
probe('password-no-pools-zero-length', 'Str::password(0, false, false, false, false)', fn () => Str::password(0, false, false, false, false));
probe('password-numbers-only', 'Str::password(5, false, true, false, false)', function () {
    $password = Str::password(5, false, true, false, false);

    return ['length' => strlen($password), 'digits' => ctype_digit($password)];
});
probe('password-spaces-only', 'Str::password(3, false, false, false, true)', fn () => Str::password(3, false, false, false, true));

emit();
