<?php

/**
 * Ground truth for Collection::flatten().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('flatten depth 0 via Collection', 'collect([1,[2,[3]]])->flatten(0)->all()', function () {
    return collect([1, [2, [3]]])->flatten(0)->all();
});

probe('flatten depth 1 for comparison', 'collect([1,[2,[3]]])->flatten(1)->all()', function () {
    return collect([1, [2, [3]]])->flatten(1)->all();
});

// ---- Collection::flatten and ::keyBy follow Arr::flatten's leaf rule and the array-offset key cast
probe('collection-flatten-object-leaf', "(new Collection([\$date, [1], new Collection([2, [3]])]))->flatten() and (new Collection(['a' => \$o, 'b' => [\$date]]))->flatten(): what is kept", function () {
    $date = new DateTime('@0');
    $object = (object) ['x' => 1, 'y' => 2];
    $list = (new Collection([$date, [1], new Collection([2, [3]])]))->flatten()->all();
    $map = (new Collection(['a' => $object, 'b' => [$date]]))->flatten()->all();

    return [
        'list' => ['count' => count($list), 'kept' => $list[0] === $date, 'rest' => array_slice($list, 1)],
        'map' => ['count' => count($map), 'kept' => $map[0] === $object && $map[1] === $date],
    ];
});
probe('flatten-traversable-backing', "(new Collection(new ArrayIterator([1, 2, 3])))->flatten()", fn () => (new Collection(new ArrayIterator([1, 2, 3])))->flatten()->all());
probe('flatten-string-backing', "(new Collection('abc'))->flatten()", fn () => (new Collection('abc'))->flatten()->all());
probe('flatten-mixed-collection-types', "(new Collection([new Collection(['#foo', new LazyCollection(['#bar'])]), new LazyCollection(['#baz', new Collection(['#zap'])])]))->flatten()->all()", fn () => (new Collection([new Collection(['#foo', new LazyCollection(['#bar'])]), new LazyCollection(['#baz', new Collection(['#zap'])])]))->flatten()->all());

emit();
