<?php

/**
 * Ground truth for Collection::after().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('after-strict-falsy', "after(0, true) and after('', true) over [false,0,1,[],'']", fn () => [
    'zero' => (new Collection([false, 0, 1, [], '']))->after(0, true),
    'last' => (new Collection([false, 0, 1, [], '']))->after('', true),
]);
probe('after-array-needle', "collect([[1,2],[9]])->after([1,2])", fn () => (new Collection([[1, 2], [9]]))->after([1, 2]));
probe('after-keyed-needle', "collect(['a'=>['k'=>0],'b'=>['k'=>1]])->after(['k'=>0])", fn () => (new Collection(['a' => ['k' => 0], 'b' => ['k' => 1]]))->after(['k' => 0]));
probe('after-traversable-backing', "collect(gen(1,2))->after(1)", fn () => (new Collection(traversable()))->after(1));
probe('after-out-of-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after('c')", fn () => (new Collection(OUT_OF_ORDER))->after('c'));
probe('after-out-of-order-last-item', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after('b')", fn () => (new Collection(OUT_OF_ORDER))->after('b'));
probe('after-mixed', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->after(1)", fn () => (new Collection(MIXED))->after(1));
probe('after-out-of-order-callback', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after(fn (\$v, \$k) => \$v === 'c')", fn () => (new Collection(OUT_OF_ORDER))->after(fn ($v, $k) => $v === 'c'));
probe('after-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->after(fn (\$v, \$k) => \$v === 'c') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->after($cb), fn ($v) => $v === 'c'));
probe('after-collision', "(new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->after('c')", fn () => (new Collection([5 => 'a', 0 => 'b', '5' => 'c']))->after('c'));
probe('after-loose-key-position', "(new Collection(['01' => 'a', 1 => 'b']))->after('b')", fn () => (new Collection(['01' => 'a', 1 => 'b']))->after('b'));
probe('after-loose-key-position-record-order', "(new Collection([1 => 'b', '01' => 'a']))->after('a')", fn () => (new Collection([1 => 'b', '01' => 'a']))->after('a'));

emit();
