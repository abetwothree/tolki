<?php

/**
 * Ground truth for Collection::skipUntil().
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

// skipUntil / skipWhile / takeUntil / takeWhile (eager wrappers over LazyCollection)
probe('C32-D-skipUntil-list-keys', "(new Collection([1, 2, 3, 4]))->skipUntil(3)", fn () => pairs((new Collection([1, 2, 3, 4]))->skipUntil(3)));
probe('C32-D-skipUntil-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(2)", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(2)));
probe('C32-D-skipUntil-strict-value', "(new Collection([1, 2, 3, 4]))->skipUntil('3')", fn () => pairs((new Collection([1, 2, 3, 4]))->skipUntil('3')));
probe('C32-D-skipUntil-callback-key', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(fn (\$v, \$k) => \$k === 'b')", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->skipUntil(fn ($v, $k) => $k === 'b')));
probe('C32-D-skipUntil-out-of-order-keys', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipUntil('a')", fn () => pairs((new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->skipUntil('a')));
probe('C32-D-skip-take-callback-php-truthiness', "skipUntil / skipWhile / takeUntil / takeWhile over new Collection(c32c_items(list | keyed)), with a callback answering '0', [] and new DateTime('@0')", fn () => array_map(fn (bool $keyed) => [
    'skipUntil' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->skipUntil($cb)),
    'skipWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->skipWhile($cb)),
    'takeUntil' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->takeUntil($cb)),
    'takeWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->takeWhile($cb)),
], ['list' => false, 'keyed' => true]));
probe('C32-D-skip-take-callback-index', "(new Collection(['x', 'y', 'z'])): skipUntil(fn (\$v, \$k) => \$k === 1) and takeUntil(fn (\$v, \$k) => \$k === 1)", fn () => [
    'skipUntil' => pairs((new Collection(['x', 'y', 'z']))->skipUntil(fn ($v, $k) => $k === 1)),
    'takeUntil' => pairs((new Collection(['x', 'y', 'z']))->takeUntil(fn ($v, $k) => $k === 1)),
]);

emit();
