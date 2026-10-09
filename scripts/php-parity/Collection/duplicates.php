<?php

/**
 * Ground truth for Collection::duplicates().
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

// duplicates(): keys of the duplicate are the whole point
probe('C32-D-duplicates-keyed', "(new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->duplicates()", fn () => pairs((new Collection(['a' => 1, 'b' => 2, 'c' => 1]))->duplicates()));
probe('C32-D-duplicates-list-first-key', "(new Collection(['x', 'y', 'x']))->duplicates()->keys()", fn () => (new Collection(['x', 'y', 'x']))->duplicates()->keys()->all());
probe('C32-D-duplicates-callback-key-arg', "(new Collection(['a' => 1, 'b' => 2]))->duplicates(fn (\$v, \$k) => \$k === 'b' ? 1 : \$v)", fn () => pairs((new Collection(['a' => 1, 'b' => 2]))->duplicates(fn ($v, $k) => $k === 'b' ? 1 : $v)));
probe('C32-D-duplicates-loose-sort-regular', "(new Collection(['a', 0, 'b', '0', 'a']))->duplicates()", fn () => pairs((new Collection(['a', 0, 'b', '0', 'a']))->duplicates()));
probe('C32-D-duplicates-non-transitive-loose', "(new Collection(['abc', '0', false, '']))->duplicates()", fn () => pairs((new Collection(['abc', '0', false, '']))->duplicates()));
probe('C32-D-duplicates-out-of-order', "(new Collection([2 => 'a', 0 => 'b', 1 => 'a']))->duplicates()", fn () => pairs((new Collection([2 => 'a', 0 => 'b', 1 => 'a']))->duplicates()));
probe('C32-D-duplicates-list-then-push', "(new Collection(['x', 'y', 'x']))->duplicates()->push('z')", fn () => pairs((new Collection(['x', 'y', 'x']))->duplicates()->push('z')));
probe('C32-D-duplicates-collection-rows', "c32c_rows(list | keyed)->duplicates('k'): keys and values", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->duplicates('k')->keys()->all(),
    c32c_rows($keyed)->duplicates('k')->values()->all(),
], ['list' => false, 'keyed' => true]));

emit();
