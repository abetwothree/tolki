<?php

/**
 * Ground truth for Arr::set().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::set preserves a sibling "__proto__" key', 'Arr::set([["__proto__"=>["isAdmin"=>true],"z"=>1]],"0.z",2)', function () { $a = [['__proto__' => ['isAdmin' => true], 'z' => 1]]; Arr::set($a, '0.z', 2); return $a; });

// D1 — constructor and prototype are ordinary keys
probe('Arr::set writes a "constructor" key', 'Arr::set([], "constructor", 5)', function () { $a = []; Arr::set($a, 'constructor', 5); return $a; });
probe('Arr::set writes a "prototype" key', 'Arr::set([], "prototype", 5)', function () { $a = []; Arr::set($a, 'prototype', 5); return $a; });
probe('Arr::set writes a nested "constructor.prototype" path', 'Arr::set([], "constructor.prototype.polluted", 5)', function () { $a = []; Arr::set($a, 'constructor.prototype.polluted', 5); return $a; });
probe('Arr::set writes a "__proto__" key', 'Arr::set([], "__proto__", 5)', function () { $a = []; Arr::set($a, '__proto__', 5); return $a; });

// ---- set
probe('set-overwrite-nested', "set(['products'=>['desk'=>['price'=>100]]], 'products.desk.price', 200)", function () { $a = ['products' => ['desk' => ['price' => 100]]]; Arr::set($a, 'products.desk.price', 200); return $a; });
probe('set-scalar-intermediate', "set(['products'=>'desk'], 'products.desk.price', 200)", function () { $a = ['products' => 'desk']; Arr::set($a, 'products.desk.price', 200); return $a; });
probe('set-int-key', "set([1=>'test'], 1, 'hAz')", function () { $a = [1 => 'test']; return Arr::set($a, 1, 'hAz'); });
probe('set-int-key-string', "set([1=>'test'], '1', 'hAz')", function () { $a = [1 => 'test']; return Arr::set($a, '1', 'hAz'); });
probe('set-list-input', "set([0=>'products'], 'products.desk.price', 200)", function () { $a = ['products']; Arr::set($a, 'products.desk.price', 200); return $a; });

// ---- set: is_null($key) is checked before $array is touched, even for a null array
probe('set-null-array-null-key', "\$a = null; Arr::set(\$a, null, 5)", function () {
    $a = null;
    $v = Arr::set($a, null, 5);

    return ['value' => $v, 'array' => $a];
});

// ==== set: creating a dot path under a key that does not exist yet (ArrTest::testSet)
probe('set-creates-missing-path', "set(['products'=>['desk'=>['price'=>100]]], 'table.price', 500)", function () {
    $a = ['products' => ['desk' => ['price' => 100]]];
    Arr::set($a, 'table', 500);
    $flat = $a;
    Arr::set($a, 'table.price', 500);

    return ['flat write' => $flat, 'then dotted write' => $a];
});

// ==== D4 (F-12): Arr::set, push and forget pass each dot segment to the array subscript, so PHP's key cast applies:
// "01" and "" stay strings, "1" and "-1" become ints, "1.5" is two segments. Rows record the key types separately.

$d4Segments = ['01', '1', '-1', '1.5', ''];

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

$d4Set = function (array $array, string $key) use ($d4Shape): array {
    Arr::set($array, $key, 'V');

    return $d4Shape($array);
};

probe('set-list-key-cast', "Arr::set(['a','b'], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Set) {
    return array_combine($d4Segments, array_map(fn ($s) => $d4Set(['a', 'b'], $s), $d4Segments));
});
probe('set-record-key-cast', "Arr::set(['x'=>1], \$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Set) {
    return array_combine($d4Segments, array_map(fn ($s) => $d4Set(['x' => 1], $s), $d4Segments));
});
probe('set-nested-list-key-cast', "Arr::set([['a','b']], '0.'.\$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['a', 'b']];
        Arr::set($array, '0.' . $s, 'V');

        return $d4Shape($array[0]);
    }, $d4Segments));
});
probe('set-nested-record-key-cast', "Arr::set([['x'=>1]], '0.'.\$seg, 'V') for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['x' => 1]];
        Arr::set($array, '0.' . $s, 'V');

        return $d4Shape($array[0]);
    }, $d4Segments));
});
probe('set-then-get-noncanonical-index', "\$a = []; Arr::set(\$a, '01', 5); Arr::get(\$a, '01')", function () {
    $a = [];
    Arr::set($a, '01', 5);

    return Arr::get($a, '01');
});
probe('set-then-get-noncanonical-index-nested', "\$a = [[]]; Arr::set(\$a, '0.01', 5); Arr::get(\$a, '0.01')", function () {
    $a = [[]];
    Arr::set($a, '0.01', 5);

    return ['written' => $a, 'read back' => Arr::get($a, '0.01')];
});

// An empty MIDDLE segment is a real "" key too, not a segment to skip.
probe('set-empty-middle-segment', "\$a = []; Arr::set(\$a, '0..1', 'V')", function () use ($d4Shape) {
    $a = [];
    Arr::set($a, '0..1', 'V');

    return ['outer' => $d4Shape($a), 'inner' => $d4Shape($a[0])];
});

// ==== D5 (F-24a): a dot path under a list index replaces the scalar with a record.
probe('set-dot-path-under-a-list-index', "\$a = ['a', 'b']; Arr::set(\$a, '0.x', 5)", function () {
    $a = ['a', 'b'];
    Arr::set($a, '0.x', 5);

    return $a;
});

probe('set-scalar-element-empty-trailing-segment', "\$a = ['a']; Arr::set(\$a, '0.', 'value')", function () use ($d4Shape) {
    $a = ['a'];
    Arr::set($a, '0.', 'value');

    return ['outer' => $d4Shape($a), 'inner' => $d4Shape($a[0])];
});

// ==== fix-round-1 Group H: the own-property channel. PHP holds '01', '' and '-1' as real
// ==== array keys, so the write is readable again and survives the other helpers; the port
// ==== stores them as the list's own properties, which only some helpers carry.
$h1Shape = function (array $a) {
    $keys = [];
    foreach (array_keys($a) as $k) {
        $keys[] = gettype($k) . ':' . $k;
    }

    return ['json' => $a, 'keys' => $keys];
};
$h1Base = function () {
    $a = ['a', 'b'];
    Arr::set($a, '01', 'V');

    return $a;
};
probe('own-key-channel-round-trip', "\$a = ['a','b']; Arr::set(\$a, '01', 'V'); then Arr::get / Arr::has", function () use ($h1Shape, $h1Base) {
    return [
        'written' => $h1Shape($h1Base()),
        'get' => Arr::get($h1Base(), '01', '<<miss>>'),
        'has' => Arr::has($h1Base(), '01'),
    ];
});
// ==== E3: the EMPTY list root, which the non-empty rows above do not cover. PHP draws no
// ==== distinction — the key lands the same way whether the array already held elements.
probe('e3-own-key-channel-empty-root', "\$a = []; \$a['01'] = 'V'; and \$b = []; Arr::set(\$b, '01', 'V')", function () use ($h1Shape) {
    $a = [];
    $a['01'] = 'V';
    $b = [];
    Arr::set($b, '01', 'V');

    return [
        'raw subscript' => $h1Shape($a),
        'Arr::set' => $h1Shape($b),
        'get' => Arr::get($b, '01', '<<miss>>'),
        'has' => Arr::has($b, '01'),
    ];
});
probe('own-key-channel-negative-index-round-trip', "\$a = ['a','b']; Arr::set(\$a, '-1', 'V'); then Arr::get / Arr::has", function () use ($h1Shape) {
    $a = ['a', 'b'];
    Arr::set($a, '-1', 'V');

    return [
        'written' => $h1Shape($a),
        'get' => Arr::get($a, '-1', '<<miss>>'),
        'has' => Arr::has($a, '-1'),
    ];
});
probe('own-key-channel-survives-other-helpers', "on \$a = ['a','b'] + Arr::set(\$a,'01','V'): except, add, set, only, forget", function () use ($h1Shape, $h1Base) {
    $added = $h1Base();
    $set = $h1Base();
    Arr::set($set, '2', 'c');
    $forgotten = $h1Base();
    Arr::forget($forgotten, '01');

    return [
        "except ['zzz']" => $h1Shape(Arr::except($h1Base(), ['zzz'])),
        "add '2'" => $h1Shape(Arr::add($added, '2', 'c')),
        "set '2'" => $h1Shape($set),
        'only [0]' => $h1Shape(Arr::only($h1Base(), [0])),
        "forget '01'" => $h1Shape($forgotten),
    ];
});

// ==== Task D6 Step 4c: Arr::set descends by is_array too, so a nested object on the path
// ==== is replaced wholesale rather than written into. The add twin is recorded above.
probe('d6-set-assoc-nested-object-is-replaced-wholesale', "\$src = ['a' => new D4Point(1)]; Arr::set(\$src, 'a.y', 2)", function () {
    $src = ['a' => new D4Point(1)];
    Arr::set($src, 'a.y', 2);

    return [
        'result' => $src,
        'result_type' => get_debug_type($src['a']),
    ];
});

// ==== fix-round-2 Group C: no recorded row carried the '01.x' shape — a non-canonical index
// ==== HEAD with a rest. The write stores "01" on the array itself and rebuilds no element.
probe('r2-set-noncanonical-index-head-with-rest', "\$a = ['a','b']; Arr::set(\$a, '01.x', 5)", function () {
    $a = ['a', 'b'];
    Arr::set($a, '01.x', 5);

    return [
        'written' => $a,
        'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($a)),
    ];
});

// ==== E3: the exact call arr-mutations.test-d.ts asserts. The recorded nested row starts from
// ==== [[]]; this one starts from a scalar element, which is what the type assertion widens.
probe('e3-set-noncanonical-index-nested-scalar-element', "\$a = ['a','b']; Arr::set(\$a, '0.01', 5)", function () {
    $a = ['a', 'b'];
    Arr::set($a, '0.01', 5);

    return [
        'written' => $a,
        'keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($a)),
        'element 0 keys' => array_map(fn ($key) => get_debug_type($key) . ':' . $key, array_keys($a[0])),
        'read back' => Arr::get($a, '0.01'),
    ];
});

// ==== fix-round-3 Group C: no row records Arr::set descending a LIST backing into a nested
// ==== object. "add-nested-object-is-replaced-wholesale" records only the Arr::add twin.
probe('r3-set-list-nested-object-is-replaced-wholesale', "\$src = [new D4Point(1)]; Arr::set(\$src, '0.y', 2)", function () {
    $src = [new D4Point(1)];
    Arr::set($src, '0.y', 2);

    return [
        'result' => $src,
        'result_type' => get_debug_type($src[0]),
    ];
});

// ==== fix-round-4 Group G1: "d6-nested-list-in-a-list-is-descended" records only the Arr::add
// ==== call, yet arr.spec and data.spec assert the Arr::set twin against it.
probe('r4-set-nested-list-in-a-list-is-descended', "\$src = [['q']]; Arr::set(\$src, '0.1', 'y')", function () {
    $src = [['q']];
    $result = Arr::set($src, '0.1', 'y');

    return ['set' => $result, 'source-after-set' => $src];
});

setOn('set-interior-empty-segment', "Arr::set(\$a, 'a..b', 9)", 'a..b');
setOn('set-leading-empty-segment', "Arr::set(\$a, '.a', 9)", '.a');
setOn('set-trailing-empty-segment', "Arr::set(\$a, 'a.', 9)", 'a.');
setOn('set-only-empty-segments', "Arr::set(\$a, '..', 9)", '..');
setOn('set-empty-key', "Arr::set(\$a, '', 9)", '');

emit();
