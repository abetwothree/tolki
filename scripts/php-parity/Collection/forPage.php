<?php

/**
 * Ground truth for Collection::forPage().
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

// ---- Family G ------------------------------------------------------------

// Key-preserving probes return [[key, value], ...] so integer keys and order survive json_encode.
$pairs = function ($items) use (&$pairs) {
    $out = [];
    foreach ($items instanceof Collection ? $items->all() : $items as $k => $v) {
        $out[] = [$k, $v instanceof Collection ? $pairs($v) : $v];
    }

    return $out;
};
probe('C32-G-forPage-edges', "forPage(-1, 2), forPage(2, 0), forPage(1, -1) over ['one','two','three','four']", fn () => [
    'negative_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(-1, 2)),
    'zero_per_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(2, 0)),
    'negative_per_page' => $pairs((new Collection(['one', 'two', 'three', 'four']))->forPage(1, -1)),
]);
probe('C32-G-forPage-assoc', "(new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->forPage(2, 1)->all()",
    fn () => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->forPage(2, 1)->all());

emit();
