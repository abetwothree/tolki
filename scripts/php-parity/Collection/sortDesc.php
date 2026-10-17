<?php

/**
 * Ground truth for Collection::sortDesc().
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

probe('sortDesc over the same fixture', 'collect([30,10,20])->sortDesc()', function () {
    return (new Collection([30, 10, 20]))->sortDesc()->all();
});

probe('sortDesc ties fall back to original order, not a full reverse', 'collect([[id=a,k=2],[id=b,k=1],[id=c,k=2],[id=d,k=3]])->sortByDesc(fn($i)=>$i["k"])->pluck("id")->values()->all()', function () {
    $items = [
        ['id' => 'a', 'k' => 2],
        ['id' => 'b', 'k' => 1],
        ['id' => 'c', 'k' => 2],
        ['id' => 'd', 'k' => 3],
    ];

    return collect($items)->sortByDesc(fn ($i) => $i['k'])->pluck('id')->values()->all();
});

probe('sortDesc on integer-keyed collection reorders values (PHP)', 'collect([0=>3,1=>1,2=>2])->sortDesc()->all()', function () {
    return collect([0 => 3, 1 => 1, 2 => 2])->sortDesc()->all();
});

// sortDesc's no-callback guard: `sort` was aligned on PHP falsiness in both
// packages, `sortDesc` was not. PHP reads a string as a SORT_* flag, so only
// the numeric-string form has an answer at all.
probe('Collection::sortDesc — a string callback is a sort flag, not a field path', 'sortDesc(""), sortDesc("0"), sortDesc("age")', function () {
    $c = new Collection(['a' => 3, 'b' => 1, 'c' => 2]);

    $attempt = static function ($flag) use ($c) {
        try {
            return $c->sortDesc($flag)->all();
        } catch (\Throwable $e) {
            return ['threw' => get_class($e), 'message' => $e->getMessage()];
        }
    };

    return [
        'empty_string' => $attempt(''),
        'zero_string' => $attempt('0'),
        'non_numeric_string' => $attempt('age'),
    ];
});

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Collection::sortDesc orders numeric strings numerically', 'collect(["9","10","1",5])->sortDesc()->values()', fn () => collect($mixed)->sortDesc()->values()->all());
probe('C32-G-sortDesc-callback-throws', '(new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)',
    fn () => (new Collection([1, 3, 2]))->sortDesc(fn ($v) => $v)->all());

emit();
