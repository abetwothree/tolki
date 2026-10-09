<?php

/**
 * Ground truth for Collection::pad().
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

probe('X18/pad positive padding appends', 'collect([10,20,30,40])->pad(6,0)', function () {
    return ['padded' => (new Collection(nums()))->pad(6, 0)->all(), 'noPad' => (new Collection(nums()))->pad(2, 0)->all()];
});

probe('pad via Collection', 'collect([10,20,30,40])->pad(6,0)', function () {
    return collect([10, 20, 30, 40])->pad(6, 0)->all();
});
probe('PAD1 pad on assoc (list fixture shapes)', '[\'p4\' => (new Collection([\'a\' => 1, \'b\' => 2, \'c\' => 3]))->pad(4, 0)->all(), \'p4big\' => (new Collection([\'a\' => 1, \'b\' => 2, \'c\' => 3, \'d\' => 4, \'e\' => 5]))->pad(4, 0)->all(), \'n4\' => ...->pad(-4, 0)->all(), \'n4big\' => ...->pad(-4, 0)->all()]', fn () => [
    'p4' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->pad(4, 0)->all(),
    'p4big' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->pad(4, 0)->all(),
    'n4' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->pad(-4, 0)->all(),
    'n4big' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->pad(-4, 0)->all(),
]);
probe('pad-negative-int-key', "(new Collection([-1 => 'a', 'x' => 'b']))->pad(4, 0), ->pad(-4, 0), ->pad(2, 0)", fn () => [
    'right' => (new Collection([-1 => 'a', 'x' => 'b']))->pad(4, 0)->all(),
    'left' => (new Collection([-1 => 'a', 'x' => 'b']))->pad(-4, 0)->all(),
    'none' => (new Collection([-1 => 'a', 'x' => 'b']))->pad(2, 0)->all(),
]);
probe('order-pad', "collect(base)->pad(5, 'z')", fn () => d8Views(collect(d8Base())->pad(5, 'z')));
probe('order-pad-negative', "collect(base)->pad(-5, 'z')", fn () => d8Views(collect(d8Base())->pad(-5, 'z')));
probe('order-pad-no-padding', "collect(base)->pad(2, 'z')", fn () => d8Views(collect(d8Base())->pad(2, 'z')));
probe('order-pad-does-not-mutate', "\$c = collect(base); \$c->pad(5, 'z'); \$c", function () {
    $c = collect(d8Base());
    $c->pad(5, 'z');

    return d8Views($c);
});
probe('order-mixed-pad', "collect([2 => 'c', 'x' => 'a', 1 => 'b'])->pad(5, 'p')", fn () => d8Views(
    collect([2 => 'c', 'x' => 'a', 1 => 'b'])->pad(5, 'p'),
));

probe('pad-out-of-order-grow-right', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(6, 'P')", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->pad(6, 'P')->all()));
probe('pad-out-of-order-grow-left', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(-6, 'P')", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->pad(-6, 'P')->all()));
probe('pad-out-of-order-no-op', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->pad(2, 'P')", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->pad(2, 'P')->all()));
probe('pad-mixed-grow-right', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->pad(5, 'P')", fn () => arrayablePairs((new Collection(MIXED))->pad(5, 'P')->all()));
probe('pad-mixed-grow-left', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->pad(-5, 'P')", fn () => arrayablePairs((new Collection(MIXED))->pad(-5, 'P')->all()));
probe('pad-collision-grow-right', "(new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->pad(3, 'P')", fn () => arrayablePairs((new Collection([1 => 'a', 'x' => 'b', '1' => 'c']))->pad(3, 'P')->all()));
probe('C32-B-pad-past-a-string-key-order', "\$c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); keys/values", function () { $c = collect([5 => 'a', 'x' => 'b'])->pad(4, 0); return ['keys' => $c->keys()->all(), 'values' => $c->values()->all()]; });

$keysAndValues = fn (Collection $c) => ['keys' => $c->keys()->all(), 'values' => $c->values()->all()];

// array_pad() and array_splice() read their counts as int parameters: a fraction is dropped (with a deprecation,
// silenced here), and a float no int can hold is refused before anything changes
$padSizes = ['7.5' => 7.5, '-7.5' => -7.5, '0.5' => 0.5, 'NAN' => NAN, 'INF' => INF, '-INF' => -INF, '1e19' => 1e19, '-1e19' => -1e19];
probe('C32-B-pad-fractional-and-non-int-sizes', "pad(\$size, 0) over collect([1, 2, 3]) and collect(['a' => 1, 'b' => 2, 'c' => 3]) for 7.5, -7.5, 0.5, NAN, INF, -INF, 1e19 and -1e19: the keys and values, or the class and message thrown", fn () => array_map(fn (array $items) => array_map(fn ($size) => c32c_outcome(fn () => $keysAndValues(@collect($items)->pad($size, 0))), $padSizes), ['list' => [1, 2, 3], 'keyed' => ['a' => 1, 'b' => 2, 'c' => 3]]));
probe('C32-B-pad-past-maximum-array-size', "collect([1, 2, 3])->pad(\$size, 0) for 1073741825, -1073741825 and 1e18: the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => collect([1, 2, 3])->pad($size, 0)->all()), ['1073741825' => 1073741825, '-1073741825' => -1073741825, '1e18' => 1e18]));
probe('C32-B-pad-fractional-size-out-of-order-keys', "collect([2 => 'c', 0 => 'a', 1 => 'b'])->pad(\$size, 'P') for 4.5, -4.5 and NAN: the keys and values, or the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => $keysAndValues(@collect([2 => 'c', 0 => 'a', 1 => 'b'])->pad($size, 'P'))), ['4.5' => 4.5, '-4.5' => -4.5, 'NAN' => NAN]));
probe('C32-B-pad-far-past-maximum-array-size', "collect([1, 2, 3])->pad(\$size, 0) for 1e18 and -1e18: the class and message thrown", fn () => array_map(fn ($size) => c32c_outcome(fn () => collect([1, 2, 3])->pad($size, 0)->all()), ['1e18' => 1e18, '-1e18' => -1e18]));

emit();
