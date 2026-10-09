<?php

/**
 * Ground truth for Arr::flatten().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('Arr::flatten default depth', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]])', function () {
    return Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]]);
});

probe('X29 flatten defaults to INF', 'Arr::flatten([1,[2,[3]]])', function () {
    return [
        'default' => Arr::flatten([1, [2, [3]]]),
        'depth1' => Arr::flatten([1, [2, [3]]], 1),
        'depth2' => Arr::flatten([1, [2, [3]]], 2),
    ];
});

probe('flatten at a finite depth descends exactly that many levels', 'Arr::flatten([1,[2,[3]]],2)', function () {
    return Arr::flatten([1, [2, [3]]], 2);
});

probe('flatten depth 1 stops one level down', 'Arr::flatten([1,[2,[3]]],1)', function () {
    return Arr::flatten([1, [2, [3]]], 1);
});

probe('flatten depth 0 keeps descending (only 1 stops it)', 'Arr::flatten([1,[2,[3]]],0)', function () {
    return Arr::flatten([1, [2, [3]]], 0);
});

probe('flatten ignores keys at every level', "Arr::flatten(['a'=>1,'b'=>['c'=>2,'d'=>['e'=>3]]],2)", function () {
    return Arr::flatten(['a' => 1, 'b' => ['c' => 2, 'd' => ['e' => 3]]], 2);
});

probe('flatten depth 0 fully flattens (depth never hits 1)', 'Arr::flatten([1,[2,[3]]], 0)', function () {
    return Arr::flatten([1, [2, [3]]], 0);
});

// T1 — flatten depth
probe('Arr::flatten defaults to unlimited depth', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]])', fn () => Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]]));
probe('Arr::flatten honours an explicit depth of 2', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]], 2)', fn () => Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]], 2));
probe('flatten-assoc-nulls', "Arr::flatten(['a' => ['#foo', null], 'b' => '#baz', 'c' => null])", fn () => Arr::flatten(['a' => ['#foo', null], 'b' => '#baz', 'c' => null]));

// ---- Arr::flatten flattens only arrays, and a Collection item's items: any other object is kept whole
probe('flatten-object-leaf', "Arr::flatten([\$date, [1]]), ([\$o, [\$date]]), (['a' => \$o, 'b' => ['c' => \$date, 'd' => [2]]]), ([new ArrayObject([1, 2])]): what is kept", function () {
    $date = new DateTime('@0');
    $object = (object) ['x' => 1, 'y' => 2];
    $list = Arr::flatten([$date, [1]]);
    $nested = Arr::flatten([$object, [$date]]);
    $map = Arr::flatten(['a' => $object, 'b' => ['c' => $date, 'd' => [2]]]);
    $arrayObject = Arr::flatten([new ArrayObject([1, 2])]);

    return [
        'list' => ['count' => count($list), 'kept' => $list[0] === $date, 'rest' => array_slice($list, 1)],
        'nested' => ['count' => count($nested), 'kept' => $nested[0] === $object && $nested[1] === $date],
        'map' => ['count' => count($map), 'kept' => $map[0] === $object && $map[1] === $date, 'rest' => array_slice($map, 2)],
        'arrayObject' => ['count' => count($arrayObject), 'kept' => $arrayObject[0] instanceof ArrayObject],
    ];
});
probe('flatten-collection-item', "Arr::flatten([new Collection([1, [2, 3]]), 4]), ([new Collection(['a' => 1, 'b' => new Collection([2])])]), ([new Collection([[1, 2], 3])], 1), ([[new Collection([2, 3])]], 1)", function () {
    $kept = Arr::flatten([[new Collection([2, 3])]], 1);

    return [
        'item' => Arr::flatten([new Collection([1, [2, 3]]), 4]),
        'nested' => Arr::flatten([new Collection(['a' => 1, 'b' => new Collection([2])])]),
        'depth-1-item' => Arr::flatten([new Collection([[1, 2], 3])], 1),
        'depth-1-value' => ['count' => count($kept), 'collection' => $kept[0] instanceof Collection],
    ];
});

// ==== fix-round-3 Group E: the record-backed twins of the three list rows obj.spec cites.
probe('r3-assoc-backed-leaf-rules', "Arr::flatten(['a' => \$o]), Arr::collapse(['g2' => \$o]), array_replace_recursive(['a' => \$o], ['a' => ['x' => 5]])", function () {
    $sized = new class
    {
        public $x = 1;

        public $y = 2;
    };

    $flattened = Arr::flatten(['a' => $sized]);

    return [
        'flatten-single-object-entry' => [
            'count' => count($flattened),
            'kept' => $flattened[0] === $sized,
        ],
        'collapse-only-object-assoc' => Arr::collapse(['g2' => $sized]),
        'replaceRecursive-object-under-array' => array_replace_recursive(['a' => $sized], ['a' => ['x' => 5]]),
    ];
});

probe('flatten-out-of-order', "Arr::flatten([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::flatten(OUT_OF_ORDER)));
probe('flatten-mixed', "Arr::flatten(['x' => 1, 0 => 2, 'y' => 3])", fn () => arrayablePairs(Arr::flatten(MIXED)));
probe('flatten-out-of-order-nested', "Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']])", fn () => arrayablePairs(Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']])));
probe('flatten-out-of-order-nested-depth-1', "Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']], 1)", fn () => arrayablePairs(Arr::flatten([2 => ['c', ['d']], 0 => 'a', 1 => ['k' => 'b']], 1)));
probe('flatten-collision', "Arr::flatten([1 => 'a', 'x' => 'b', '1' => 'c'])", fn () => arrayablePairs(Arr::flatten([1 => 'a', 'x' => 'b', '1' => 'c'])));
probe('flatten-lazy-list', "Arr::flatten([new LazyCollection(['#foo', ['#bar']]), ['#baz', new LazyCollection(['#zap'])]])", fn () => Arr::flatten([new LazyCollection(['#foo', ['#bar']]), ['#baz', new LazyCollection(['#zap'])]]));
probe('flatten-lazy-depth-1', 'Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5])]], 1)', fn () => shown(Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5])]], 1)));
probe('flatten-lazy-depth-2', 'Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5, [6]])]], 2)', fn () => shown(Arr::flatten([new LazyCollection([1, [2, [3]]]), [4, new LazyCollection([5, [6]])]], 2)));
probe('flatten-lazy-assoc', "Arr::flatten(['a' => new LazyCollection(['x' => '#foo', 'y' => ['#bar']]), 'b' => ['c' => '#baz', 'd' => new LazyCollection(['#zap'])]])", fn () => Arr::flatten(['a' => new LazyCollection(['x' => '#foo', 'y' => ['#bar']]), 'b' => ['c' => '#baz', 'd' => new LazyCollection(['#zap'])]]));

emit();
