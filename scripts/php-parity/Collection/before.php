<?php

/**
 * Ground truth for Collection::before().
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

// ==== before / after in strict mode over the same falsy fixture
probe('before-strict-falsy', "before(1, true) and before(false, true) over [false,0,1,[],'']", fn () => [
    'one' => (new Collection([false, 0, 1, [], '']))->before(1, true),
    'first' => (new Collection([false, 0, 1, [], '']))->before(false, true),
]);

// `before()` and `after()` call `search()` first, so they inherit its rule.
probe('before-array-needle', "collect([[0],[1,2]])->before([1,2])", fn () => (new Collection([[0], [1, 2]]))->before([1, 2]));
probe('before-keyed-needle', "collect(['a'=>['k'=>0],'b'=>['k'=>1]])->before(['k'=>1])", fn () => (new Collection(['a' => ['k' => 0], 'b' => ['k' => 1]]))->before(['k' => 1]));
probe('before-traversable-backing', "collect(gen(1,2))->before(2)", fn () => (new Collection(traversable()))->before(2));

probe('before-out-of-order-first-item', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before('c')", fn () => (new Collection(OUT_OF_ORDER))->before('c'));
probe('before-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before('a')", fn () => (new Collection(OUT_OF_ORDER))->before('a'));
probe('before-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->before(2)", fn () => (new Collection(MIXED))->before(2));
probe('before-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before(fn (\$v, \$k) => \$v === 'b')", fn () => (new Collection(OUT_OF_ORDER))->before(fn ($v, $k) => $v === 'b'));
probe('before-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->before(fn (\$v, \$k) => \$v === 'b') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->before($cb), fn ($v) => $v === 'b'));
probe('before-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->before('b')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->before('b'));
// before()/after() find the found key's position with a LOOSE $keys->search($key), so the
// integer key 1 is found at the string key '01', which PHP's == holds equal to it.
probe('before-loose-key-position', "(new Collection(['01' => 'a', 1 => 'b']))->before('b')", fn () => (new Collection(['01' => 'a', 1 => 'b']))->before('b'));
probe('before-loose-key-position-record-order', "(new Collection([1 => 'b', '01' => 'a']))->before('a')", fn () => (new Collection([1 => 'b', '01' => 'a']))->before('a'));
probe('before-loose-key-position-strict-search', "(new Collection(['01' => 'a', 1 => 'b']))->before('b', true)", fn () => (new Collection(['01' => 'a', 1 => 'b']))->before('b', true));
probe('C32-C-before-after-string-key-first', '(new Collection(["foo" => "bar", 1, 2, 3, 4, 5]))->before(1) / after("bar")', fn () => [
    (new Collection(['foo' => 'bar', 1, 2, 3, 4, 5]))->before(1),
    (new Collection(['foo' => 'bar', 1, 2, 3, 4, 5]))->after('bar'),
]);

emit();
