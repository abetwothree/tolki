<?php

/**
 * Ground truth for Arr::first().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// --- first / last on assoc
probe('first-assoc-no-match', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v) => \$v > 300)", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300));
probe('first-assoc-closure-default', "Arr::first(assoc, fn > 300, fn () => 'baz')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300, fn () => 'baz'));
probe('first-assoc-falsy-match', "Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn (\$v) => \$v === 0)", fn () => Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn ($v) => $v === 0));
probe('first-assoc-key-callback', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v, \$k) => \$k !== 'a')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v, $k) => $k !== 'a'));
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
$intKeyed = [1 => 'a', 'x' => 'b'];
probe('callback-key first', 'Arr::first([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::first($intKeyed, $cb), false));

// ==== Arr::first / Arr::last read the same insertion order, which is what dataFirst/dataLast port ====
probe('arr-first-out-of-order', 'Arr::first([2 => "c", 0 => "a", 1 => "b"])', fn () => Arr::first(e0Base()));
probe('arr-first-out-of-order-callback', "Arr::first(base, fn (\$v) => \$v !== 'c')", fn () => Arr::first(e0Base(), fn ($v) => $v !== 'c'));
probe('arr-first-out-of-order-key-order', '$keys seen by Arr::first(base, $cb returning false)', function () {
    $seen = [];
    Arr::first(e0Base(), function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});

probe('first-out-of-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::first(OUT_OF_ORDER));
probe('first-mixed', "Arr::first(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::first(MIXED));
probe('first-out-of-order-callback', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v) => \$v !== 'a')", fn () => Arr::first(OUT_OF_ORDER, fn ($v) => $v !== 'a'));
probe('first-out-of-order-callback-order', "Arr::first([2 => 'c', 0 => 'a', 1 => 'b'], fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => Arr::first(OUT_OF_ORDER, $cb), false));

// PHP's array key casts: 1 and '1' are one key (first position, last value), true is 1,
// null is '' and 1.5 is 1. The array literals are written as a PHP user would write them.
probe('first-collision', "Arr::first([1 => 'a', '1' => 'b'])", fn () => Arr::first([1 => 'a', '1' => 'b']));
probe('first-true-key-collision', "Arr::first([1 => 'a', true => 'b'])", fn () => Arr::first([1 => 'a', true => 'b']));

probe('C32-C-arr-callback-php-truthiness', "Arr::first / last / every / some / sole / where / reject / partition over c32c_items(list | keyed), sole over its first item alone, with a callback answering '0', [] and new DateTime('@0')", fn () => array_map(fn (bool $keyed) => [
    'first' => c32c_truthiness(fn ($cb) => Arr::first(c32c_items($keyed), $cb)),
    'last' => c32c_truthiness(fn ($cb) => Arr::last(c32c_items($keyed), $cb)),
    'every' => c32c_truthiness(fn ($cb) => Arr::every(c32c_items($keyed), $cb)),
    'some' => c32c_truthiness(fn ($cb) => Arr::some(c32c_items($keyed), $cb)),
    'sole' => c32c_truthiness(fn ($cb) => Arr::sole(c32c_items($keyed, true), $cb)),
    'where' => c32c_truthiness(fn ($cb) => Arr::where(c32c_items($keyed), $cb)),
    'reject' => c32c_truthiness(fn ($cb) => Arr::reject(c32c_items($keyed), $cb)),
    'partition' => c32c_truthiness(fn ($cb) => Arr::partition(c32c_items($keyed), $cb)),
], ['list' => false, 'keyed' => true]));

emit();
