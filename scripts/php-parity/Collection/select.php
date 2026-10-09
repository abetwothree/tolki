<?php

/**
 * Ground truth for Collection::select().
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

// select
probe('C32-D-select-dot-path-literal', "(new Collection([['id' => 1, 'details' => ['age' => 30, 'city' => 'NY']]]))->select(['id', 'details.age'])", fn () => pairs((new Collection([['id' => 1, 'details' => ['age' => 30, 'city' => 'NY']]]))->select(['id', 'details.age'])));
probe('C32-D-select-object-null-prop', "(new Collection([(object) ['a' => null, 'b' => 1]]))->select('a', 'b')", fn () => pairs((new Collection([(object) ['a' => null, 'b' => 1]]))->select('a', 'b')));
probe('C32-D-select-array-null-value', "(new Collection([['a' => null, 'b' => 1]]))->select('a', 'b')", fn () => pairs((new Collection([['a' => null, 'b' => 1]]))->select('a', 'b')));
probe('C32-D-select-scalar-items', "(new Collection([1, 'x', null]))->select('a')", fn () => pairs((new Collection([1, 'x', null]))->select('a')));
probe('C32-D-select-object-method-name', "(new Collection([new Collection(['a' => 1])]))->select('all', 'a')", fn () => pairs((new Collection([new Collection(['a' => 1])]))->select('all', 'a')));
probe('C32-D-select-null-then-key', "(new Collection([['a' => 1, 'b' => 2]]))->select(null, 'a')", fn () => pairs((new Collection([['a' => 1, 'b' => 2]]))->select(null, 'a')));
probe('C32-D-select-int-key', "(new Collection([[10, 20, 30]]))->select([0, 2])", fn () => pairs((new Collection([[10, 20, 30]]))->select([0, 2])));
probe('C32-D-select-collection-rows', "(new Collection([new Collection(['a' => 1, 'b' => 2])]))->select('a')", fn () => pairs((new Collection([new Collection(['a' => 1, 'b' => 2])]))->select('a')));
probe('C32-D-select-prototype-key-names', "(new Collection([['a' => 1]]))->select('toString', 'constructor', 'a')", fn () => pairs((new Collection([['a' => 1]]))->select('toString', 'constructor', 'a')));
probe('C32-D-select-string-index-and-length', "(new Collection([[10, 20, 30]]))->select(['1', 'length'])", fn () => pairs((new Collection([[10, 20, 30]]))->select(['1', 'length'])));
probe('C32-D-select-integer-string-key', "(new Collection([['a' => 1, 1 => 'x']]))->select('1', 'a')", fn () => pairs((new Collection([['a' => 1, 1 => 'x']]))->select('1', 'a')));
probe('C32-D-select-object-falsy-props', "(new Collection([(object) ['a' => null, 'b' => 1, 'c' => 0, 'd' => '']]))->select('a', 'b', 'c', 'd', 'e')", fn () => pairs((new Collection([(object) ['a' => null, 'b' => 1, 'c' => 0, 'd' => '']]))->select('a', 'b', 'c', 'd', 'e')));
probe('C32-D-select-keyed-collection-arg', "(new Collection([['first' => 'T', 'last' => 'O', 'email' => 'e']]))->select(new Collection(['x' => 'first', 'y' => 'email']))", fn () => pairs((new Collection([['first' => 'T', 'last' => 'O', 'email' => 'e']]))->select(new Collection(['x' => 'first', 'y' => 'email']))));
probe('C32-D-select-array-then-extra-arg', "(new Collection([['first' => 'T', 'last' => 'O']]))->select(['first'], 'last')", fn () => pairs((new Collection([['first' => 'T', 'last' => 'O']]))->select(['first'], 'last')));

probe('C32-D-select-arrayaccess-rows', "(new Collection([new C32D_SelectAccess(['a' => 'offset-a', 'n' => null])]))->select('a', 'n', 'p', 'q', 'missing'), with public \$a = 'prop-a', \$p = 'prop-p', \$q = null", fn () => pairs((new Collection([new C32D_SelectAccess(['a' => 'offset-a', 'n' => null])]))->select('a', 'n', 'p', 'q', 'missing')));

emit();
