<?php

/**
 * Ground truth for Collection::implode().
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

probe('implode-out-of-order', "collect(base)->implode('-')", fn () => collect(e0Base())->implode('-'));
probe('implode-out-of-order-pluck', "collect([2 => ['n' => 'c'], 0 => ['n' => 'a']])->implode('n', '-')", fn () => collect([
    2 => ['n' => 'c'],
    0 => ['n' => 'a'],
])->implode('n', '-'));
probe('implode-out-of-order-callback', "collect(base)->implode(fn (\$v) => strtoupper(\$v), '-')", fn () => collect(e0Base())->implode(fn ($v) => strtoupper($v), '-'));

// implode
probe('C32-H-implode-class-instances-by-key', "(new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ',')", fn () => (new Collection([new C32HUser('foo'), new C32HUser('bar')]))->implode('email', ','));
probe('C32-H-implode-tostring-objects-are-plucked', "(new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(',')", fn () => (new Collection([new C32HToString('a'), new C32HToString('b')]))->implode(','));
probe('C32-H-implode-scalar-casts', "(new Collection([true, false, null, 1.0, 2.50, 0]))->implode(',')", fn () => (new Collection([true, false, null, 1.0, 2.50, 0]))->implode(','));
probe('C32-H-implode-missing-key', "(new Collection([['a' => 1], ['b' => 2]]))->implode('a', ',')", fn () => (new Collection([['a' => 1], ['b' => 2]]))->implode('a', ','));
probe('C32-H-implode-nested-collections-by-key', "(new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ',')", fn () => (new Collection([new Collection(['a' => 'x']), new Collection(['a' => 'y'])]))->implode('a', ','));
probe('C32-H-implode-collection-rows-by-backing', "c32c_rows(list | keyed)->implode('k', ',')", fn () => array_map(fn (bool $keyed) => c32c_rows($keyed)->implode('k', ','), ['list' => false, 'keyed' => true]));
probe('C32-H-implode-float-casts', "(new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->implode(',')", fn () => (new Collection([0.1 + 0.2, 1.0, 1e25, -0.0]))->implode(','));
probe('C32-H-implode-callback-casts', "(new Collection([1, 2]))->implode(fn (\$v) => \$v > 1, ',')", fn () => (new Collection([1, 2]))->implode(fn ($v) => $v > 1, ','));
probe('C32-H-implode-date-items-are-plucked', "(new Collection([new DateTime('@0'), new DateTime('@1')]))->implode(', ')", fn () => (new Collection([new DateTime('@0'), new DateTime('@1')]))->implode(', '));
probe('C32-H-implode-array-pieces', "@implode(',') of [1, [2, 3]] and ['a', ['b' => 1]], @implode(fn (\$v) => [\$v], ',') of [1, 2], and @implode('a', ',') of [['a' => [1]], ['a' => 2]]", fn () => [
    @(new Collection([1, [2, 3]]))->implode(','),
    @(new Collection(['a', ['b' => 1]]))->implode(','),
    @(new Collection([1, 2]))->implode(fn ($v) => [$v], ','),
    @(new Collection([['a' => [1]], ['a' => 2]]))->implode('a', ','),
]);
probe('C32-H-implode-object-pieces', "implode(',') of [1, new stdClass], [1, new DateTime('@0')], [1, fn () => 1], [1, new C32HToString('T')] and [1, new Collection([2])], then implode(fn () => new stdClass, ',') of [1, 2] and implode('a', ',') of [['a' => new stdClass]]", fn () => [
    c32c_outcome(fn () => (new Collection([1, new stdClass]))->implode(',')),
    c32c_outcome(fn () => (new Collection([1, new DateTime('@0')]))->implode(',')),
    c32c_outcome(fn () => (new Collection([1, fn () => 1]))->implode(',')),
    (new Collection([1, new C32HToString('T')]))->implode(','),
    (new Collection([1, new Collection([2])]))->implode(','),
    c32c_outcome(fn () => (new Collection([1, 2]))->implode(fn () => new stdClass, ',')),
    c32c_outcome(fn () => (new Collection([['a' => new stdClass]]))->implode('a', ',')),
]);

emit();
