<?php

/**
 * Ground truth for Collection::mode().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

// Collection::mode's inner `->sort()` runs over values that are all equal, so
// asort leaves the filtered order alone either way.
probe('Collection::mode — the inner sort before keys() is a no-op', 'mode() and its filtered-then-sorted keys', function () {
    $counts = new \Illuminate\Support\Collection([1 => 2, 2 => 2, 3 => 1]);
    $filtered = $counts->filter(fn ($value) => $value == 2);

    return [
        'mode_single' => (new \Illuminate\Support\Collection([1, 2, 3, 4, 4, 5]))->mode(),
        'mode_tie' => (new \Illuminate\Support\Collection([1, 2, 2, 1]))->mode(),
        'mode_assoc_tie' => (new \Illuminate\Support\Collection(['a' => 1, 'b' => 1, 'c' => 2, 'd' => 2, 'e' => 3]))->mode(),
        'filtered_keys' => $filtered->keys()->all(),
        'filtered_sorted_keys' => $filtered->sort()->keys()->all(),
    ];
});

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
probe('mode-out-of-order-key-tie', "(new Collection([2 => ['foo' => 'c'], 0 => ['foo' => 'a']]))->mode('foo')", fn () => (new Collection([2 => ['foo' => 'c'], 0 => ['foo' => 'a']]))->mode('foo'));
probe('mode-assoc-strings', "(new Collection(['x' => 'p', 'y' => 'q', 'z' => 'q']))->mode()", fn () => (new Collection(['x' => 'p', 'y' => 'q', 'z' => 'q']))->mode());

// mode over array items
probe('C32-H-mode-array-items', "(new Collection([[1], [1]]))->mode()", fn () => (new Collection([[1], [1]]))->mode());
probe('C32-H-mode-assoc-items', "(new Collection([['a' => 1], ['a' => 1]]))->mode()", fn () => (new Collection([['a' => 1], ['a' => 1]]))->mode());
probe('C32-H-mode-date-items', "(new Collection([new DateTime('@0'), new DateTime('@0')]))->mode()", fn () => (new Collection([new DateTime('@0'), new DateTime('@0')]))->mode());
probe('C32-H-mode-enum-items', "(new Collection([C32E_Int::B, C32E_Int::B]))->mode()", fn () => (new Collection([C32E_Int::B, C32E_Int::B]))->mode());
probe('C32-H-mode-stringable-items', "(new Collection([new Stringable('Lara'), new Stringable('Lara')]))->mode()", fn () => (new Collection([new Stringable('Lara'), new Stringable('Lara')]))->mode());
probe('C32-H-mode-tostring-items', "(new Collection([\$o, \$o]))->mode(), \$o an object with __toString", function () {
    $o = new class { public function __toString() { return 'Framework'; } };

    return (new Collection([$o, $o]))->mode();
});
probe('C32-H-mode-float-items', "@(new Collection([1.5, 1.7, 2.5]))->mode()", fn () => @(new Collection([1.5, 1.7, 2.5]))->mode());

emit();
