<?php

/**
 * Ground truth for Arr::dot().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// B8 — dot and set keep a "__proto__" key as data
probe('Arr::dot keeps a "__proto__" key', 'Arr::dot(["__proto__"=>1])', fn () => Arr::dot(['__proto__' => 1]));
probe('Arr::dot keeps a "__proto__" array value', 'Arr::dot(["__proto__"=>[]])', fn () => Arr::dot(['__proto__' => []]));

// --- dot
probe('dot-int-key', 'Arr::dot([10 => 100])', fn () => Arr::dot([10 => 100]));
probe('dot-nested-int-key', "Arr::dot(['foo' => [10 => 100]])", fn () => Arr::dot(['foo' => [10 => 100]]));
probe('dot-empty-leaf', "Arr::dot(['foo' => []])", fn () => Arr::dot(['foo' => []]));
probe('dot-nested-empty-leaf', "Arr::dot(['foo' => ['bar' => []]])", fn () => Arr::dot(['foo' => ['bar' => []]]));
probe('dot-mixed-keys', "Arr::dot(['foo', 'foo' => ['bar' => 'baz', 'baz' => ['a' => 'b']]])", fn () => Arr::dot(['foo', 'foo' => ['bar' => 'baz', 'baz' => ['a' => 'b']]]));
probe('dot-prepend-no-dot', "Arr::dot(['name' => 'John'], 'user')", fn () => Arr::dot(['name' => 'John'], 'user'));
probe('dot-prepend-no-dot-depth', "Arr::dot(['user' => ['name' => 'Taylor']], 'prefix', 1)", fn () => Arr::dot(['user' => ['name' => 'Taylor']], 'prefix', 1));
probe('dot-prepend-with-dot-depth', "Arr::dot(['user' => ['name' => 'Taylor']], 'prefix.', 1)", fn () => Arr::dot(['user' => ['name' => 'Taylor']], 'prefix.', 1));
probe('dot-prepend-trailing-dots', "Arr::dot(['a' => 1], 'prefix...')", fn () => Arr::dot(['a' => 1], 'prefix...'));
probe('dot-list-prepend-no-dot', "Arr::dot(['x', ['y']], 'user')", fn () => Arr::dot(['x', ['y']], 'user'));
probe('dot-list-of-assoc', "Arr::dot([['a' => 1], ['b' => ['c' => 2]]])", fn () => Arr::dot([['a' => 1], ['b' => ['c' => 2]]]));

// ---- Arr::dot recurses only into arrays: an object inside a list or a map stays a leaf
probe('dot-object-leaf', "Arr::dot([\$o]), Arr::dot([['p' => \$o]]), Arr::dot(['p' => \$o, 'l' => [\$o]]), Arr::dot([new ArrayObject(['a' => 1])]) with \$o = (object) ['x' => 1, 'y' => 2]: keys, and whether \$o is kept", function () {
    $o = (object) ['x' => 1, 'y' => 2];
    $list = Arr::dot([$o]);
    $nested = Arr::dot([['p' => $o]]);
    $map = Arr::dot(['p' => $o, 'l' => [$o]]);

    return [
        'list' => ['keys' => array_keys($list), 'kept' => $list[0] === $o],
        'nested' => ['keys' => array_keys($nested), 'kept' => $nested['0.p'] === $o],
        'map' => ['keys' => array_keys($map), 'kept' => $map['p'] === $o && $map['l.0'] === $o],
        'arrayObject' => array_keys(Arr::dot([new ArrayObject(['a' => 1])])),
    ];
});
probe('dot-depth-through-list', "Arr::dot([['a' => ['b' => ['c' => 1]]]], '', 2)", fn () => Arr::dot([['a' => ['b' => ['c' => 1]]]], '', 2));

probe('dot-out-of-order', "Arr::dot([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::dot(OUT_OF_ORDER)));
probe('dot-out-of-order-prefixed', "Arr::dot([2 => 'c', 0 => 'a', 1 => 'b'], 'p.')", fn () => arrayablePairs(Arr::dot(OUT_OF_ORDER, 'p.')));
probe('dot-mixed-prefixed', "Arr::dot(['x' => 1, 0 => 2, 'y' => 3], 'p')", fn () => arrayablePairs(Arr::dot(MIXED, 'p')));
probe('dot-out-of-order-nested', "Arr::dot([2 => ['z' => 1], 0 => ['y' => 2], 1 => ['x' => 3]])", fn () => arrayablePairs(Arr::dot([2 => ['z' => 1], 0 => ['y' => 2], 1 => ['x' => 3]])));
probe('dot-mixed-nested', "Arr::dot(['x' => ['k' => 1], 0 => ['k' => 2], 'y' => ['k' => 3]])", fn () => arrayablePairs(Arr::dot(['x' => ['k' => 1], 0 => ['k' => 2], 'y' => ['k' => 3]])));

emit();
