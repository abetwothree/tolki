<?php

/**
 * Ground truth for Arr::add().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('add stores a string key on a list', "Arr::add(['a','b'],'length','X')", function () {
    return Arr::add(['a', 'b'], 'length', 'X');
});

probe('add stores any other string key on a list', "Arr::add(['a','b'],'foo','X')", function () {
    return Arr::add(['a', 'b'], 'foo', 'X');
});

// ==== ArrTest parity: testAccessible .. testHasAnyMethod
// --- add
probe('add-empty-dotted', "Arr::add([], 'developer.name', 'Ferid')", fn () => Arr::add([], 'developer.name', 'Ferid'));
probe('add-int-key', "Arr::add([], 1, 'hAz')", fn () => Arr::add([], 1, 'hAz'));
probe('add-float-key', "Arr::add([], 1.1, 'hAz')", fn () => Arr::add([], 1.1, 'hAz'));

// ==== D5 (F-18): Arr::add takes $array by value, so the caller's nested array is untouched; Arr::push takes it
// by reference and mutates it, which the port deliberately does not follow.
probe('add-leaves-the-caller-value-untouched', "\$src = [['desk' => 100]]; Arr::add(\$src, '0.chair', 150)", function () {
    $src = [['desk' => 100]];
    $result = Arr::add($src, '0.chair', 150);

    return ['source' => $src, 'result' => $result];
});
probe('add-list-leaves-the-caller-value-untouched', "\$src = [[100]]; Arr::add(\$src, '0.1', 150)", function () {
    $src = [[100]];
    $result = Arr::add($src, '0.1', 150);

    return ['source' => $src, 'result' => $result];
});
probe('add-existing-key-is-a-no-op', "\$src = [['desk' => 100]]; Arr::add(\$src, '0.desk', 150)", function () {
    $src = [['desk' => 100]];

    return Arr::add($src, '0.desk', 150);
});

probe('add-nested-list-leaves-the-caller-value-untouched', "\$src = ['products', ['desk']]; Arr::add(\$src, '1.1', 200)", function () {
    $src = ['products', ['desk']];
    $result = Arr::add($src, '1.1', 200);

    return ['source' => $src, 'result' => $result];
});
probe('add-nested-record-leaves-the-caller-value-untouched', "\$src = ['a' => ['z' => 1]]; Arr::add(\$src, 'a.y', 2)", function () {
    $src = ['a' => ['z' => 1]];
    $result = Arr::add($src, 'a.y', 2);

    return ['source' => $src, 'result' => $result];
});

// ==== fix-round-1 Group D: what Arr::set does when a path descends through a nested
// ==== OBJECT. Arr::set's descend test is `is_array`, so an object is no container.
probe('add-nested-object-is-replaced-wholesale', "\$src = [new D4Point(1)]; Arr::add(\$src, '0.y', 2)", function () {
    $src = [new D4Point(1)];
    $result = Arr::add($src, '0.y', 2);

    return [
        'source' => $src,
        'source_type' => get_debug_type($src[0]),
        'result' => $result,
        'result_type' => get_debug_type($result[0]),
    ];
});
probe('add-assoc-nested-object-is-replaced-wholesale', "\$src = ['a' => new D4Point(1)]; Arr::add(\$src, 'a.y', 2)", function () {
    $src = ['a' => new D4Point(1)];
    $result = Arr::add($src, 'a.y', 2);

    return [
        'source' => $src,
        'source_type' => get_debug_type($src['a']),
        'result' => $result,
        'result_type' => get_debug_type($result['a']),
    ];
});
probe('add-nested-arrayaccess-is-replaced-wholesale', "\$src = [new ArrayObject(['z' => 1])]; Arr::add(\$src, '0.y', 2)", function () {
    $src = [new ArrayObject(['z' => 1])];
    $result = Arr::add($src, '0.y', 2);

    return [
        'source_count' => count($src[0]),
        'result' => $result,
        'result_type' => get_debug_type($result[0]),
    ];
});

// ==== Task D6 Step 4c: the other half of the descend test — a nested LIST is a container,
// ==== so Arr::add and Arr::set write into it rather than replacing it.
probe('d6-nested-list-is-descended-not-replaced', "\$src = ['a' => ['q']]; Arr::add(\$src, 'a.1', 'y') and Arr::set(\$src, 'a.1', 'y')", function () {
    $added = ['a' => ['q']];
    $addResult = Arr::add($added, 'a.1', 'y');
    $set = ['a' => ['q']];
    Arr::set($set, 'a.1', 'y');

    return ['add' => $addResult, 'set' => $set, 'source-after-add' => $added];
});
probe('d6-nested-list-in-a-list-is-descended', "\$src = [['q']]; Arr::add(\$src, '0.1', 'y')", function () {
    $src = [['q']];

    return ['add' => Arr::add($src, '0.1', 'y'), 'source-after-add' => $src];
});

// ---- 3. Arr::add against a key that already holds null.
probe('add-over-null-list-value', 'Arr::add([null], 0, 9)', fn () => Arr::add([null], 0, 9));
probe('add-over-null-keyed-value', "Arr::add(['a'=>null], 'a', 9)", fn () => Arr::add(['a' => null], 'a', 9));
probe('add-over-null-nested-list', "Arr::add([['b'=>null]], '0.b', 9)", fn () => Arr::add([['b' => null]], '0.b', 9));
probe('add-over-null-nested-keyed', "Arr::add(['a'=>['b'=>null]], 'a.b', 9)", fn () => Arr::add(['a' => ['b' => null]], 'a.b', 9));
probe('add-leaves-false-alone', 'Arr::add([false], 0, 9)', fn () => Arr::add([false], 0, 9));
probe('add-leaves-zero-alone', "Arr::add(['a'=>0], 'a', 9)", fn () => Arr::add(['a' => 0], 'a', 9));

emit();
