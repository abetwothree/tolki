<?php

/**
 * Ground truth for Arr::undot().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::undot — integer segments rebuild a list', 'Arr::undot([...])', function () {
    return Arr::undot([
        'user.languages.0' => 'PHP',
        'user.languages.1' => 'C#',
        'user.name' => 'Taylor',
    ]);
});

probe('undot rebuilds the nested list', "Arr::undot(['0'=>'a','1.0'=>'b','1.1'=>'c'])", function () {
    return Arr::undot(['0' => 'a', '1.0' => 'b', '1.1' => 'c']);
});

probe('undot only canonicalises canonical integer keys', 'Arr::undot(["1e2"=>"x"])', function () {
    return [
        'exp' => Arr::undot(['1e2' => 'x']),
        'leading_space' => Arr::undot([' 1' => 'x']),
        'plus' => Arr::undot(['+1' => 'x']),
        'leading_zero' => Arr::undot(['01' => 'x']),
        'canonical' => Arr::undot(['1' => 'x']),
    ];
});

// B11 — undot with a large integer key
probe('Arr::undot with a billion-index key', 'Arr::undot(["1000000000"=>"x"])', fn () => array_keys(Arr::undot(['1000000000' => 'x'])));
probe('Arr::undot with a negative integer key', 'Arr::undot(["-1"=>"x"])', fn () => array_keys(Arr::undot(['-1' => 'x'])));

// --- undot
probe('undot-mixed-keys', "Arr::undot(['foo', 'foo.bar' => 'baz', 'foo.baz' => ['a' => 'b']])", fn () => Arr::undot(['foo', 'foo.bar' => 'baz', 'foo.baz' => ['a' => 'b']]));
probe('undot-out-of-order-int-keys', "Arr::undot(['a.1' => 'y', 'a.0' => 'x']) and Arr::undot(['a.0' => 'x', 'a.1' => 'y']): each result, and whether its 'a' is a list", function () {
    $outOfOrder = Arr::undot(['a.1' => 'y', 'a.0' => 'x']);
    $inOrder = Arr::undot(['a.0' => 'x', 'a.1' => 'y']);

    return [
        'out of order' => ['value' => $outOfOrder, 'isList' => array_is_list($outOfOrder['a'])],
        'in order' => ['value' => $inOrder, 'isList' => array_is_list($inOrder['a'])],
    ];
});

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

$d4Set = function (array $array, string $key) use ($d4Shape): array {
    Arr::set($array, $key, 'V');

    return $d4Shape($array);
};

// Arr::undot keeps a non-canonical key a string key, at the top level and inside a path.
probe('undot-noncanonical-index', "Arr::undot(['01' => 'a']) and Arr::undot(['0.01' => 'a'])", function () use ($d4Shape) {
    return ['top level' => $d4Shape(Arr::undot(['01' => 'a'])), 'nested' => $d4Shape(Arr::undot(['0.01' => 'a'])[0])];
});

probe('undot-out-of-order', "Arr::undot([2 => 'c', 0 => 'a', 1 => 'b'])", fn () => arrayablePairs(Arr::undot(OUT_OF_ORDER)));
probe('undot-dotted-first-collision', "Arr::undot(['0.a' => 'y', 0 => 'x'])", fn () => arrayablePairs(Arr::undot(['0.a' => 'y', 0 => 'x'])));
probe('undot-plain-first-collision', "Arr::undot([0 => 'x', '0.a' => 'y'])", fn () => arrayablePairs(Arr::undot([0 => 'x', '0.a' => 'y'])));
probe('undot-mixed-dotted-first-collision', "Arr::undot(['1.a' => 'y', 1 => 'x', 'b' => 'z'])", fn () => arrayablePairs(Arr::undot(['1.a' => 'y', 1 => 'x', 'b' => 'z'])));
probe('undot-list-dotted-first-collision', "Arr::undot(['1.0' => 'y', 1 => ['z']])", fn () => arrayablePairs(Arr::undot(['1.0' => 'y', 1 => ['z']])));
probe('undot-list-plain-first-collision', "Arr::undot([1 => ['z'], '1.0' => 'y'])", fn () => arrayablePairs(Arr::undot([1 => ['z'], '1.0' => 'y'])));

emit();
