<?php

/**
 * Ground truth for Collection::filter().
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

probe('Collection::filter() falsy set', '(new Collection([...]))->filter()', function () {
    return (new Collection([
        'a' => '0', 'b' => '', 'c' => 0, 'd' => [], 'e' => false,
        'f' => null, 'g' => 'x', 'h' => '00', 'i' => '0.0',
    ]))->filter()->all();
});

probe('X16 filter drops PHP-falsy "0" but keeps "00" and "0.0"', 'collect([...])->filter()', function () {
    return (new Collection(['0', '00', '0.0', '', 0, false, null, [], 'a']))->filter()->all();
});
probe('C14 filter by key', '(new Collection([\'id\' => 1, \'first\' => \'Hello\', \'second\' => \'World\']))->filter(fn ($item, $key) => $key !== \'id\')->all()', fn () => (new Collection(['id' => 1, 'first' => 'Hello', 'second' => 'World']))->filter(fn ($item, $key) => $key !== 'id')->all());
probe('F1 filter callback key type for int key', '[\'result\' => (new Collection([1 => \'a\', \'x\' => \'b\']))->filter(fn ($v, $k) => $k === 1)->all(), \'seen\' => [gettype($k), $k] per call]', function () {
    $seen = [];
    $r = (new Collection([1 => 'a', 'x' => 'b']))->filter(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return $k === 1; })->all();
    return ['result' => $r, 'seen' => $seen];
});

probe('filter-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->filter($cb), true));
probe('filter-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(fn (\$v, \$k) => true) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->filter($cb), true));
probe('filter-out-of-order-first-two-visits', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->filter(a callback true for its first two calls)", fn () => arrayablePairs((new Collection(OUT_OF_ORDER))->filter(firstVisits(2))->all()));
probe('filter-mixed-first-visit', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->filter(a callback true for its first call)", fn () => arrayablePairs((new Collection(MIXED))->filter(firstVisits(1))->all()));
probe('filter-mixed-no-callback', "(new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()", fn () => arrayablePairs((new Collection(['x' => 0, 2 => 'c', 'y' => 'y', 0 => '', 1 => 'b']))->filter()->all()));
probe('filter-collision', "(new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn (\$v) => \$v === 'a')", fn () => arrayablePairs((new Collection([1 => 'a', 0 => 'z', '1' => 'b']))->filter(fn ($v) => $v === 'a')->all()));

probe('C32-D-filter-keeps-empty-objects', "(new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count()", fn () => (new Collection([new DateTime('@0'), new stdClass, new ArrayObject, new SplObjectStorage, 'x']))->filter()->count());
probe('C32-D-filter-callback-string-zero', "(new Collection([1, 2]))->filter(fn (\$v) => \$v > 1 ? '0' : 'x')", fn () => pairs((new Collection([1, 2]))->filter(fn ($v) => $v > 1 ? '0' : 'x')));

emit();
