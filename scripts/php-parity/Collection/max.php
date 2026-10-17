<?php

/**
 * Ground truth for Collection::max().
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

// max() keeps an earlier value that no later value exceeds.
probe('max-keeps-earlier-larger-value', '(new Collection([3, 1, 2]))->max()', fn () => (new Collection([3, 1, 2]))->max());
probe('max-key-keeps-earlier-larger-value', "(new Collection([['foo' => 20], ['foo' => 10]]))->max('foo')", fn () => (new Collection([['foo' => 20], ['foo' => 10]]))->max('foo'));
probe('C32-H-max-numeric-strings', "(new Collection(['10', '9', '8']))->max()", fn () => (new Collection(['10', '9', '8']))->max());
probe('C32-H-max-dot-path', "(new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b')", fn () => (new Collection([['a' => ['b' => 3]], ['a' => ['b' => 7]]]))->max('a.b'));
probe('C32-H-min-max-uncomparable-arrays', "[max, min] of [[1], ['a' => 1]] and of [['a' => 1], [1]], two arrays each of which PHP's <=> calls larger", fn () => [
    'max' => [(new Collection([[1], ['a' => 1]]))->max(), (new Collection([['a' => 1], [1]]))->max()],
    'min' => [(new Collection([[1], ['a' => 1]]))->min(), (new Collection([['a' => 1], [1]]))->min()],
]);
probe('C32-H-max-null-callback-answers', "[max(fn () => null), max(fn (\$v) => \$v === 1 ? null : 0)] on [1, 2]", fn () => [(new Collection([1, 2]))->max(fn () => null), (new Collection([1, 2]))->max(fn ($v) => $v === 1 ? null : 0)]);

emit();
