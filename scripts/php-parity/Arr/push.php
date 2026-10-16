<?php

/**
 * Ground truth for Arr::push().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Arr::push() takes $array by reference, so it must be assigned to a variable first —
// passing a literal dies with "could not be passed by reference" before the body runs.
probe('push requires an array at the key', 'Arr::push($pa = [1,2,3], 0, 9)', function () {
    $pa = [1, 2, 3];
    Arr::push($pa, 0, 9);

    return ['unreachable' => $pa];
});

probe('push through an explicit null', 'Arr::push($pb = ["name"=>null], "name", 9)', function () {
    $pb = ['name' => null];
    Arr::push($pb, 'name', 9);

    return ['unreachable' => $pb];
});

probe('push at a missing key creates the array', 'Arr::push($pc = [], "name", 9)', function () {
    $pc = [];
    Arr::push($pc, 'name', 9);

    return $pc;
});

// A multi-segment key resolves to the same array-or-throw guard at its final segment,
// regardless of how many segments precede it.
probe('push at a multi-segment key still requires an array at the resolved path', 'Arr::push($pd = [["Desk"]], "0.0", "Chair", "Lamp")', function () {
    $pd = [['Desk']];
    Arr::push($pd, '0.0', 'Chair', 'Lamp');

    return ['unreachable' => $pd];
});

// The null-vs-missing distinction through a dotted path — the hard part of D5 — since a
// flat key can't tell "hasOwn but null" apart from "no own key" the way a dotted path can.
probe('push through an explicit null at a dotted path', 'Arr::push($e1 = ["a"=>["b"=>null]], "a.b", 9)', function () {
    $e1 = ['a' => ['b' => null]];
    Arr::push($e1, 'a.b', 9);

    return ['unreachable' => $e1];
});

probe('push at a missing dotted path creates the array', 'Arr::push($e2 = ["a"=>[]], "a.b", 9)', function () {
    $e2 = ['a' => []];
    Arr::push($e2, 'a.b', 9);

    return $e2;
});

// Surprise: a non-array intermediate segment does NOT throw.
// Arr::get()'s dot-walk returns the [] default the moment a segment isn't accessible,
// so Arr::set() silently overwrites 1.5 with a fresh array instead of ever raising.
probe('push through a float in a middle segment does not throw', 'Arr::push($e3 = [1.5, [2]], "0.1", 9)', function () {
    $e3 = [1.5, [2]];
    Arr::push($e3, '0.1', 9);

    return $e3;
});

probe('push appends into the array AT the key, never beside it', 'Arr::push($a = [["Desk"]], "0", "Chair")', function () {
    return [
        'existing_leaf' => pushed([['Desk']], '0', 'Chair'),
        'existing_leaf_two_values' => pushed(['a', ['b']], '1', 'c', 'd'),
        'existing_leaf_named' => pushed([['a']], '0', 'b'),
        'empty_leaf' => pushed([[]], '0', 'a', 'b'),
        'missing_leaf' => pushed([], '0', 'value'),
        'missing_leaf_bool' => pushed([], '0', true),
        'missing_leaf_dotted' => pushed([], '0.0', 'deep'),
        'missing_leaf_dotted_value' => pushed([], '0.0', 'value'),
        'missing_leaf_dotted_desk' => pushed([], '0.0', 'Desk'),
        'missing_leaf_dotted_three' => pushed([], '0.0.0', 'value'),
        'missing_leaf_dotted_three_deep' => pushed([], '0.0.0', 'deep'),
        'jsdoc_existing_leaf' => pushed([['x']], '0', 'y'),
        'jsdoc_dotted_leaf' => pushed(['a', ['b']], '1.1', 'c'),
        'null_intermediate' => pushed([null], '0.0', 'value'),
        'empty_intermediate' => pushed([[]], '0.0', 'value'),
        'existing_nested_leaf' => pushed([['existing']], '0.1', 'new'),
        'array_value_pushed_into_leaf' => pushed([['a', 'b'], ['c', 'd']], 1, ['x', 'y']),
        'assoc_leaf_two_values' => pushed(['items' => ['a', 'b']], 'items', 'c', 'd'),
        'nested_leaf_in_place' => pushed([[[1]]], '0.0', 9),
        'assoc_nested_leaf_in_place' => pushed(['a' => ['b' => [1]]], 'a.b', 9),
    ];
});

probe('push rejects a boolean at the leaf', 'Arr::push($a = [true], "0", "value")', function () {
    return pushed([true], '0', 'value');
});

// The port is array-backed: it clamps an out-of-range index to an append rather
// than producing PHP's gapped integer key, which a JS array cannot express.
probe('push at an out-of-range index writes a gapped key in PHP', 'Arr::push($a = [], "2", "value")', function () {
    return [
        'flat_gap' => pushed([], '2', 'value'),
        'nested_gap' => pushed([], '0.1', 'nested'),
        'nested_gap_deep' => pushed([], '0.1.2', 'deep-value'),
        'nested_gap_mid' => pushed([], '0.1.0', 'value'),
        'intermediate_gap' => pushed([['existing']], '5.0', 'value'),
        'leaf_gap_after_root' => pushed([], '1.0', 'item'),
    ];
});

// B10 — push with a null key
probe('Arr::push with a null key appends', 'Arr::push(["a"=>1], null, 9)', function () { $a = ['a' => 1]; return Arr::push($a, null, 9); });
probe('Arr::push with a null key on a list', 'Arr::push([1,2], null, 9)', function () { $a = [1, 2]; return Arr::push($a, null, 9); });

// --- push
probe('push-dotted-chain', "push office.furniture Desk; then Chair, Lamp", function () {
    $a = [];
    Arr::push($a, 'office.furniture', 'Desk');
    $first = $a;
    Arr::push($a, 'office.furniture', 'Chair', 'Lamp');

    return ['first' => $first, 'second' => $a];
});
probe('push-boolean-at-dotted', "Arr::push(['foo' => ['bar' => false]], 'foo.bar', 'baz')", function () {
    $a = ['foo' => ['bar' => false]];

    return Arr::push($a, 'foo.bar', 'baz');
});

// ==== D4 (F-12): Arr::set, push and forget pass each dot segment to the array subscript, so PHP's key cast applies:
// "01" and "" stay strings, "1" and "-1" become ints, "1.5" is two segments. Rows record the key types separately.

$d4Segments = ['01', '1', '-1', '1.5', ''];

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

probe('push-list-key-cast', "Arr::push([['a']], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['a']];
        Arr::push($array, $s, 'V');

        return $d4Shape($array);
    }, $d4Segments));
});
probe('push-record-key-cast', "Arr::push(['k'=>['a']], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = ['k' => ['a']];
        Arr::push($array, $s, 'V');

        return $d4Shape($array);
    }, $d4Segments));
});
probe('push-mutates-the-caller-by-reference', "\$src = [['a']]; Arr::push(\$src, '0', 'b')", function () {
    $src = [['a']];
    $result = Arr::push($src, '0', 'b');

    return ['source' => $src, 'result' => $result];
});
probe('push-missing-index-stores-an-empty-array', "\$src = [1, 2, 3]; Arr::push(\$src, 4)", function () {
    $src = [1, 2, 3];
    Arr::push($src, 4);

    return ['source' => $src, 'keys' => array_keys($src)];
});

// ==== fix-round-1 Group A: the existing push-mutates row uses the STRING key '0'. The
// ==== defect was on the integer key, so the contrast needs its own recorded call.
probe('push-integer-key-mutates-the-caller-by-reference', "\$src = [['x']]; Arr::push(\$src, 0, 'y')", function () {
    $src = [['x']];
    $result = Arr::push($src, 0, 'y');

    return ['source' => $src, 'result' => $result];
});

// ==== D7: a dot path walks into an associative array inside a list, which the port holds as a plain-object row.
probe('push-list-of-assoc-rows', "\$a = [['x' => [1]]]; Arr::push(\$a, '0.x', 2)", function () {
    $a = [['x' => [1]]];
    Arr::push($a, '0.x', 2);

    return $a;
});
probe('push-empty-assoc-row', "\$a = [[]]; Arr::push(\$a, '0.1', 'v')", function () {
    $a = [[]];
    Arr::push($a, '0.1', 'v');

    return $a;
});
probe('push-null-row-string-segment', "\$a = [null]; Arr::push(\$a, '0.child', 'v')", function () {
    $a = [null];
    Arr::push($a, '0.child', 'v');

    return $a;
});
probe('push-string-row-string-segment', "\$a = ['existing']; Arr::push(\$a, '0.name', 'v')", function () {
    $a = ['existing'];
    Arr::push($a, '0.name', 'v');

    return $a;
});
probe('push-boolean-row', "\$a = [true]; Arr::push(\$a, '0.1', 'v')", function () {
    $a = [true];
    Arr::push($a, '0.1', 'v');

    return $a;
});
probe('push-string-row-integer-segment', "\$a = ['a']; Arr::push(\$a, '0.0', 'v')", function () {
    $a = ['a'];
    Arr::push($a, '0.0', 'v');

    return $a;
});
probe('push-missing-path-under-a-new-row', "\$a = []; Arr::push(\$a, '0.name.items', 'v')", function () {
    $a = [];
    Arr::push($a, '0.name.items', 'v');

    return $a;
});
probe('push-1-non-array-under-a-new-row', "\$a = []; Arr::push(\$a, '0.1.non-array', 'v')", function () {
    $a = [];
    Arr::push($a, '0.1.non-array', 'v');

    return $a;
});
probe('push-proto-key-on-a-row', "\$a = [[]]; Arr::push(\$a, '0.__proto__', 'v')", function () {
    $a = [[]];
    Arr::push($a, '0.__proto__', 'v');

    return $a;
});
probe('push-proto-segment-through-a-row', "\$a = [[]]; Arr::push(\$a, '0.__proto__.x', 'v')", function () {
    $a = [[]];
    Arr::push($a, '0.__proto__.x', 'v');

    return $a;
});
probe('push-assoc-through-a-list-row', "\$a = ['rows' => [['x' => [1]]]]; Arr::push(\$a, 'rows.0.x', 2)", function () {
    $a = ['rows' => [['x' => [1]]]];
    Arr::push($a, 'rows.0.x', 2);

    return $a;
});
probe('push-string-segment-under-a-list-row', "\$a = [['a']]; Arr::push(\$a, '0.name', 'v')", function () {
    $a = [['a']];
    Arr::push($a, '0.name', 'v');

    return $a;
});
probe('push-assoc-leaf-appends', "\$a = [['x' => ['k' => 1]]]; Arr::push(\$a, '0.x', 'v')", function () {
    $a = [['x' => ['k' => 1]]];
    Arr::push($a, '0.x', 'v');

    return $a;
});

probe('push-object-along-the-path', "\$a = [['d' => (object) ['k' => 1]]]; Arr::push(\$a, '0.d.k', 'v')", function () {
    // A stdClass is neither an array nor ArrayAccess, so get() stops at it and set() swaps it for a fresh array.
    $a = [['d' => (object) ['k' => 1]]];
    Arr::push($a, '0.d.k', 'v');

    return $a;
});

// Key order is returned beside the data because the JSON reader re-sorts integer keys.
probe('push-through-a-nested-out-of-order-array', "Arr::push(\$a, 'm.0', 'x'), Arr::push(\$l, '0.0', 'x') on [2 => ['c'], 0 => ['a']]", function () {
    $a = ['m' => [2 => ['c'], 0 => ['a']]];
    $l = [[2 => ['c'], 0 => ['a']]];
    Arr::push($a, 'm.0', 'x');
    Arr::push($l, '0.0', 'x');

    return ['assoc' => $a, 'assoc_keys' => array_keys($a['m']), 'list_keys' => array_keys($l[0]), 'list_0' => $l[0][0]];
});
probe('push-out-of-order-leaf-appends-after-highest', "Arr::push(\$a, 'm', 'x'), Arr::push(\$l, '0', 'x') on [2 => 'c', 0 => 'a']", function () {
    $a = ['m' => [2 => 'c', 0 => 'a']];
    $l = [[2 => 'c', 0 => 'a']];
    Arr::push($a, 'm', 'x');
    Arr::push($l, '0', 'x');

    return ['assoc_keys' => array_keys($a['m']), 'list_keys' => array_keys($l[0]), 'value' => $a['m'][3]];
});
probe('push-leaf-after-highest-int-key', "\$a = [['x' => ['k' => 1, 5 => 'z']]]; Arr::push(\$a, '0.x', 'v', 'w')", function () {
    $a = [['x' => ['k' => 1, 5 => 'z']]];
    Arr::push($a, '0.x', 'v', 'w');

    return ['data' => $a, 'keys' => array_keys($a[0]['x'])];
});
probe('push-leaf-negative-int-key', "Arr::push(\$a, '0.x', 'v') on [['x' => [-5 => 'n']]]; Arr::push(\$b, 'x', 'v') on ['x' => ['k' => 1, -5 => 'n']]", function () {
    $a = [['x' => [-5 => 'n']]];
    $b = ['x' => ['k' => 1, -5 => 'n']];
    Arr::push($a, '0.x', 'v');
    Arr::push($b, 'x', 'v');

    return ['list_keys' => array_keys($a[0]['x']), 'assoc_keys' => array_keys($b['x'])];
});
probe('push-null-key-negative-int-key', "\$a = ['-5' => 'a']; Arr::push(\$a, null, 'b')", function () {
    $a = ['-5' => 'a'];
    Arr::push($a, null, 'b');

    return ['keys' => array_keys($a), 'values' => array_values($a)];
});
probe('push-object-at-the-key', "\$a = ['p' => (object) ['x' => 1]]; Arr::push(\$a, 'p', 1)", function () {
    $a = ['p' => (object) ['x' => 1]];
    Arr::push($a, 'p', 1);

    return ['unreachable' => $a];
});

emit();
