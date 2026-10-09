<?php

/**
 * Ground truth for Arr::query().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::query with booleans', 'Arr::query(["foo"=>"bar","bar"=>true])', function () {
    return [
        'true'  => Arr::query(['foo' => 'bar', 'bar' => true]),
        'false' => Arr::query(['foo' => 'bar', 'bar' => false]),
        'empty' => Arr::query(['foo' => 'bar', 'bar' => '']),
        'null'  => Arr::query(['foo' => 'bar', 'bar' => null]),
        'none'  => Arr::query([]),
    ];
});

probe('X21 query casts booleans to 1/0', "Arr::query(['a'=>true,'b'=>false])", function () {
    return ['bools' => Arr::query(['a' => true, 'b' => false]), 'list' => Arr::query(['a', 'b'])];
});

// ---- 5. Arr::query's RFC3986 encoding.
probe('query-nested-key-brackets', "Arr::query(['a'=>['b'=>1]])", fn () => Arr::query(['a' => ['b' => 1]]));
probe('query-list-value-brackets', "Arr::query(['a'=>[1,2]])", fn () => Arr::query(['a' => [1, 2]]));
probe('query-deep-nested-brackets', "Arr::query(['a'=>['b'=>['c'=>1]]])", fn () => Arr::query(['a' => ['b' => ['c' => 1]]]));
probe('query-bracket-inside-a-key', "Arr::query(['a[b]'=>1])", fn () => Arr::query(['a[b]' => 1]));
probe('query-rfc3986-sub-delimiters', "Arr::query([\"k!'()*~-._\" => \"v!'()*~-._\"])", fn () => Arr::query(["k!'()*~-._" => "v!'()*~-._"]));
probe('query-space-and-plus', "Arr::query(['a b'=>'c d','f+o'=>'b&r'])", fn () => Arr::query(['a b' => 'c d', 'f+o' => 'b&r']));
probe('query-flat-list', 'Arr::query([1,2,3])', fn () => Arr::query([1, 2, 3]));

probe('query-out-of-order', "Arr::query([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => Arr::query(OUT_OF_ORDER));
probe('query-mixed', "Arr::query(['x' => 1, 0 => 2, 'y' => 3])", fn () => Arr::query(MIXED));
probe('query-out-of-order-nested', "Arr::query(['u' => [1 => 'p', 0 => 'q'], 'v' => 1])", fn () => Arr::query(['u' => [1 => 'p', 0 => 'q'], 'v' => 1]));
probe('query-out-of-order-nested-in-list', "Arr::query(['l' => [[1 => 'p', 0 => 'q'], 'x']])", fn () => Arr::query(['l' => [[1 => 'p', 0 => 'q'], 'x']]));
probe('query-out-of-order-nested-twice', "Arr::query(['a' => ['b' => [1 => 'p', 0 => 'q']], 1 => 'one', 0 => 'zero'])", fn () => Arr::query(['a' => ['b' => [1 => 'p', 0 => 'q']], 1 => 'one', 0 => 'zero']));
probe('query-collision', "Arr::query([1 => 'a', 0 => 'z', '1' => 'b'])", fn () => Arr::query([1 => 'a', 0 => 'z', '1' => 'b']));

emit();
