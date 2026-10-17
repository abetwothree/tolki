<?php

/**
 * Ground truth for Collection::unique().
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

// unique(): array_unique(SORT_REGULAR) vs first-seen loose
probe('C32-D-unique-loose-bool-mix', "(new Collection([1, '1', true, 'a']))->unique()", fn () => pairs((new Collection([1, '1', true, 'a']))->unique()));
probe('C32-D-unique-loose-zero-strings', "(new Collection(['a', 0, 'b', '0']))->unique()", fn () => pairs((new Collection(['a', 0, 'b', '0']))->unique()));
probe('C32-D-unique-loose-falsy', "(new Collection([null, 0, '', false]))->unique()", fn () => pairs((new Collection([null, 0, '', false]))->unique()));
probe('C32-D-unique-loose-numeric-strings', "(new Collection([10, '1e1', 'abc', 'ABC', '10.0']))->unique()", fn () => pairs((new Collection([10, '1e1', 'abc', 'ABC', '10.0']))->unique()));
probe('C32-D-unique-keyed', "(new Collection(['a' => 1, 'b' => 1, 'c' => 2]))->unique()", fn () => pairs((new Collection(['a' => 1, 'b' => 1, 'c' => 2]))->unique()));
probe('C32-D-unique-key-loose', "(new Collection([['id' => 1], ['id' => '1'], ['id' => true], ['id' => 2]]))->unique('id')", fn () => pairs((new Collection([['id' => 1], ['id' => '1'], ['id' => true], ['id' => 2]]))->unique('id')));
probe('C32-D-unique-arrays-loose', "(new Collection([[1, 2], ['1', 2], [1, 2]]))->unique()", fn () => pairs((new Collection([[1, 2], ['1', 2], [1, 2]]))->unique()));
probe('C32-D-unique-dot-path', "(new Collection([['a' => ['b' => 1]], ['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->unique('a.b')->keys()", fn () => (new Collection([['a' => ['b' => 1]], ['a' => ['b' => 1]], ['a' => ['b' => 2]]]))->unique('a.b')->keys()->all());
probe('C32-D-unique-non-transitive-loose', "(new Collection(['abc', '0', false, '']))->unique()", fn () => pairs((new Collection(['abc', '0', false, '']))->unique()));
probe('C32-D-unique-strict-null-key', "(new Collection([1, '1', 1, true]))->unique(null, true)", fn () => pairs((new Collection([1, '1', 1, true]))->unique(null, true)));
probe('C32-D-unique-collection-rows', "c32c_rows(list | keyed)->unique('k'): keys and each row's 'v'", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->unique('k')->keys()->all(),
    c32c_rows($keyed)->unique('k')->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));

emit();
