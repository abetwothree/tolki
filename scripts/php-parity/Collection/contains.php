<?php

/**
 * Ground truth for Collection::contains().
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

probe('L8 contains loose (assoc)', 'contains() over (new Collection([\'a\'=>1,\'b\'=>3,\'c\'=>5])) with 1,\'1\',2,\'2\'; then [\'a\'=>\'1\'] with \'1\',1; [\'a\'=>null] with false,null,[],0,\'\'; [\'a\'=>0] with 0,\'0\',false,null,fn($v)=>$v<5,fn($v)=>$v>5; [\'a\'=>\'date\',\'b\'=>\'class\',\'c\'=>(object)[\'foo\'=>50]] with \'date\',\'class\',\'foo\'; [\'a\'=>null,\'b\'=>1,\'c\'=>2] with fn($v)=>is_null($v)', function () {
    $r = [];
    $c = new Collection(['a' => 1, 'b' => 3, 'c' => 5]);
    $r['135'] = [$c->contains(1), $c->contains('1'), $c->contains(2), $c->contains('2')];
    $c = new Collection(['a' => '1']);
    $r['str1'] = [$c->contains('1'), $c->contains(1)];
    $c = new Collection(['a' => null]);
    $r['null'] = [$c->contains(false), $c->contains(null), $c->contains([]), $c->contains(0), $c->contains('')];
    $c = new Collection(['a' => 0]);
    $r['zero'] = [$c->contains(0), $c->contains('0'), $c->contains(false), $c->contains(null), $c->contains(fn ($v) => $v < 5), $c->contains(fn ($v) => $v > 5)];
    $c = new Collection(['a' => 'date', 'b' => 'class', 'c' => (object) ['foo' => 50]]);
    $r['date'] = [$c->contains('date'), $c->contains('class'), $c->contains('foo')];
    $c = new Collection(['a' => null, 'b' => 1, 'c' => 2]);
    $r['cbnull'] = [$c->contains(fn ($v) => is_null($v))];
    return $r;
});
probe('F2 contains callback key type for int key', '[\'result\' => (new Collection([1 => \'a\', \'x\' => \'b\']))->contains(fn ($v, $k) => $k === 1), \'seen\' => [gettype($k), $k] per call]', function () {
    $seen = [];
    $r = (new Collection([1 => 'a', 'x' => 'b']))->contains(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return $k === 1; });
    return ['result' => $r, 'seen' => $seen];
});

// ==== contains: the loose block and the 2-arg / 3-arg key-value-operator forms
// (CollectionTest::testContains, testContainsWithOperator). Recorded for the record — @tolki/data
// exposes only the (data, value, strict) signature today; the plan decides whether to widen it.
probe('contains-loose-list', "contains over [null] and [0]", function () {
    $r = [];
    $c = new Collection([null]);
    $r['[null]'] = ['false' => $c->contains(false), 'null' => $c->contains(null), '[]' => $c->contains([]), '0' => $c->contains(0), "''" => $c->contains('')];
    $c = new Collection([0]);
    $r['[0]'] = ["'0'" => $c->contains('0'), 'false' => $c->contains(false), 'null' => $c->contains(null)];

    return $r;
});
probe('contains-two-args-key-value', "(new Collection([['v'=>1],['v'=>3],['v'=>5]]))->contains('v', 1)", fn () => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains('v', 1));
probe('contains-three-args-operator', "(new Collection([['v'=>1],['v'=>3],['v'=>'4'],['v'=>5]]))->contains('v', <op>, 4)", function () {
    $c = new Collection([['v' => 1], ['v' => 3], ['v' => '4'], ['v' => 5]]);

    return ["'='" => $c->contains('v', '=', 4), "'=='" => $c->contains('v', '==', 4), "'==='" => $c->contains('v', '===', 4), "'>'" => $c->contains('v', '>', 4)];
});

// ==== fix-round-3 Group A/E: the whole operatorForWhere operand table. "contains-three-args-
// ==== operator" records only four of the eleven operators, and NO row anywhere in
// ==== docs/php-parity/ records a relational operator against null, or NAN under `<=>`.
probe('r3-operator-table', "(new Collection([['v' => \$retrieved]]))->contains('v', <op>, \$value) for all eleven operators", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        '4 vs 4' => [4, 4],
        '4 vs "4"' => [4, '4'],
        'null vs 4' => [null, 4],
        '1 vs null' => [1, null],
        '0 vs null' => [0, null],
        'null vs null' => [null, null],
        '-1 vs null' => [-1, null],
        '"abc" vs null' => ['abc', null],
        '"" vs null' => ['', null],
        '"10" vs "9"' => ['10', '9'],
        'NAN vs 1' => [NAN, 1],
        '1 vs NAN' => [1, NAN],
        'NAN vs NAN' => [NAN, NAN],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    // The raw operators too: `contains` only reports the truthiness of `<=>`, and the
    // int is what says an uncomparable pair answers 1 rather than 0.
    $table['raw spaceship'] = [
        '1 <=> null' => 1 <=> null,
        'null <=> 1' => null <=> 1,
        'NAN <=> 1' => NAN <=> 1,
        '1 <=> NAN' => 1 <=> NAN,
        'NAN <=> NAN' => NAN <=> NAN,
        '0 <=> null' => 0 <=> null,
        '-1 <=> null' => -1 <=> null,
    ];

    return $table;
});

// ==== fix-round-3 Group E: obj.spec's citations pointed at the list-backed rows above.
// ==== PHP's array is both, so the same calls keyed by string record the record backing.
probe('r3-assoc-backed-contains', "(new Collection(['a'=>['v'=>1],'b'=>['v'=>3],'c'=>['v'=>'4'],'d'=>['v'=>5]]))->contains(...) and the containsStrict twins", function () {
    $rows = ['a' => ['v' => 1], 'b' => ['v' => 3], 'c' => ['v' => '4'], 'd' => ['v' => 5]];
    $three = ['a' => ['v' => 1], 'b' => ['v' => 3], 'c' => ['v' => 5]];

    return [
        'operator' => [
            "'='" => (new Collection($rows))->contains('v', '=', 4),
            "'=='" => (new Collection($rows))->contains('v', '==', 4),
            "'==='" => (new Collection($rows))->contains('v', '===', 4),
            "'>'" => (new Collection($rows))->contains('v', '>', 4),
        ],
        'key-value' => [
            '1' => (new Collection($three))->contains('v', 1),
            '2' => (new Collection($three))->contains('v', 2),
        ],
        'null-key' => [
            '> 1' => (new Collection(['a' => 1, 'b' => 2]))->contains(null, '>', 1),
            '> 9' => (new Collection(['a' => 1, 'b' => 2]))->contains(null, '>', 9),
        ],
        'containsStrict-numeric-string' => [
            "'02'" => (new Collection(['a' => 1, 'b' => 3, 'c' => 5, 'd' => '02']))->containsStrict('02'),
            '2' => (new Collection(['a' => 1, 'b' => 3, 'c' => 5, 'd' => '02']))->containsStrict(2),
        ],
        'containsStrict-two-args' => [
            'array' => (new Collection(['r' => ['tags' => ['a', 'b']]]))->containsStrict('tags', ['a', 'b']),
            'reordered' => (new Collection(['r' => ['t' => ['x' => 1, 'y' => 2]]]))->containsStrict('t', ['y' => 2, 'x' => 1]),
            'null' => (new Collection(['r' => ['name' => null], 's' => ['name' => 'x']]))->containsStrict('name', null),
            'null-missing' => (new Collection(['r' => ['a' => 1]]))->containsStrict('name', null),
            'null-none' => (new Collection(['r' => ['name' => 'x']]))->containsStrict('name', null),
        ],
        'containsStrict-callback-null' => (new Collection(['a' => null, 'b' => 1]))->containsStrict(fn ($value) => $value === null),
    ];
});

// ==== fix-round-3 Group E: the two LIST-backed twins arr.spec needs. "contains-two-args-
// ==== key-value" records only the matching value, and the callback row is record-backed.
probe('r3-list-backed-contains', "(new Collection([['v'=>1],['v'=>3],['v'=>5]]))->contains('v', 2) and (new Collection([null, 1]))->containsStrict(fn (\$v) => is_null(\$v))", fn () => [
    'key-value-no-match' => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains('v', 2),
    'containsStrict-callback-null' => (new Collection([null, 1]))->containsStrict(fn ($v) => is_null($v)),
]);

// ==== fix-round-3 Group B/F: a BOOLEAN value in contains' key/value form, which this port's
// ==== `strict` parameter occupies, plus the non-string operator and the null-key form.
probe('r3-contains-boolean-value', "(new Collection([['active'=>true],['active'=>false]]))->contains('active', true) and the forms around it", function () {
    $rows = [['active' => true], ['active' => false]];
    $mixed = ['date', 'class', ['foo' => 50], ''];

    return [
        'key-true' => (new Collection($rows))->contains('active', true),
        'key-false' => (new Collection($rows))->contains('active', false),
        'key-true-no-match' => (new Collection([['active' => false]]))->contains('active', true),
        'key-operator-true' => (new Collection($rows))->contains('active', '=', true),
        // The reading that treats a member-less string key as a path: PHP does NOT take it
        // for containsStrict, which is why CollectionTest asserts false here.
        'containsStrict-key-of-a-row' => (new Collection($mixed))->containsStrict('foo'),
        'contains-key-of-a-row' => (new Collection($mixed))->contains('foo'),
        // A non-string operator misses every case arm and lands on `default:`, an `=`.
        'non-string-operator' => (new Collection([['v' => 5], ['v' => 6]]))->contains('v', 5, 6),
        'null-key-operator' => (new Collection([['v' => 1], ['v' => 3], ['v' => 5]]))->contains(null, '>', 1),
        'diffKeysUsing-nullish-operand' => (new Collection([1, 2]))->diffKeysUsing(null, 'strcasecmp'),
    ];
});

// ==== fix-round-4 Group A: "r3-operator-table" pairs NAN only with numbers, so nothing
// ==== recorded that PHP casts BOTH sides to bool against a bool or null, NAN included.
probe('r4-nan-bool-null-table', "(new Collection([['v' => NAN]]))->contains('v', <op>, true|false|null) for all eleven operators", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        'NAN vs true' => [NAN, true],
        'true vs NAN' => [true, NAN],
        'NAN vs false' => [NAN, false],
        'false vs NAN' => [false, NAN],
        'NAN vs null' => [NAN, null],
        'null vs NAN' => [null, NAN],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    // The raw ints too: `contains` only reports the truthiness of `<=>`, and 0 is what
    // says `NAN <=> true` is an ORDERED tie rather than the 1 an uncomparable pair gives.
    $table['raw spaceship'] = [
        'NAN <=> true' => NAN <=> true,
        'true <=> NAN' => true <=> NAN,
        'NAN <=> false' => NAN <=> false,
        'false <=> NAN' => false <=> NAN,
        'NAN <=> null' => NAN <=> null,
        'null <=> NAN' => null <=> NAN,
    ];

    return $table;
});

// ==== fix-round-4 Group C: nothing recorded `===`/`!==` over two ARRAYS. PHP compares those
// ==== by value (keys, order and types), and only a real object by identity.
probe('r4-strict-operators', "(new Collection([['v' => \$retrieved]]))->contains('v', '==='|'!==', \$value) over arrays and objects", function () {
    $point = new D4Point(1);
    $stamp = new DateTimeImmutable('@0');

    $pairs = [
        '[1,2] vs [1,2]' => [[1, 2], [1, 2]],
        '[1,2] vs [1,"2"]' => [[1, 2], [1, '2']],
        '[1,2] vs [2,1]' => [[1, 2], [2, 1]],
        '[] vs []' => [[], []],
        "['a'=>1,'b'=>2] vs the same pairs" => [['a' => 1, 'b' => 2], ['a' => 1, 'b' => 2]],
        "['a'=>1,'b'=>2] vs the same pairs reordered" => [['a' => 1, 'b' => 2], ['b' => 2, 'a' => 1]],
        '[[1]] vs [[1]]' => [[[1]], [[1]]],
        'D4Point(1) vs another D4Point(1)' => [$point, new D4Point(1)],
        'D4Point(1) vs itself' => [$point, $point],
        'DateTimeImmutable@0 vs another' => [$stamp, new DateTimeImmutable('@0')],
        '[1,2] vs 1' => [[1, 2], 1],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach (['=', '==', '!=', '<>', '===', '!=='] as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    return $table;
});

// ==== fix-round-4 Group B: operatorForWhere's `is_object` guard. An ARRAY never reaches it,
// ==== so the port's plain object — which models an array — must not either.
probe('r4-object-scalar-guard', "(new Collection([['v' => \$retrieved]]))->contains('v', <op>, \$value) over object/array against scalar", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        'stdClass vs ""' => [new D4Point(1), ''],
        '"" vs stdClass' => ['', new D4Point(1)],
        '"abc" vs stdClass' => ['abc', new D4Point(1)],
        'stdClass vs "abc"' => [new D4Point(1), 'abc'],
        'stdClass vs true' => [new D4Point(1), true],
        'assoc array vs "abc"' => [['x' => 1], 'abc'],
        '"abc" vs assoc array' => ['abc', ['x' => 1]],
        'assoc array vs true' => [['x' => 1], true],
        'empty array vs null' => [[], null],
        'empty array vs "abc"' => [[], 'abc'],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    return $table;
});

// ==== fix-round-4 Group G4/G5: equality.spec asserts two plain integers under all eleven
// ==== operators, and two whole-array `=` comparisons, that no row records.
probe('r4-operator-table-extras', "(new Collection([['v' => \$retrieved]]))->contains('v', <op>, \$value) for two ints and two array pairs", function () {
    $operators = ['=', '==', '!=', '<>', '<', '>', '<=', '>=', '===', '!==', '<=>'];
    $pairs = [
        '1 vs 2' => [1, 2],
        '2 vs 1' => [2, 1],
        '1 vs 1' => [1, 1],
    ];

    $table = [];

    foreach ($pairs as $name => [$retrieved, $value]) {
        foreach ($operators as $operator) {
            $table[$name][$operator] = (new Collection([['v' => $retrieved]]))->contains('v', $operator, $value);
        }
    }

    $table['raw spaceship'] = ['1 <=> 2' => 1 <=> 2, '2 <=> 1' => 2 <=> 1, '1 <=> 1' => 1 <=> 1];
    // Two whole arrays under `=`, and an array against a non-numeric string.
    $table['assoc array vs the same pairs'] = ["'='" => (new Collection([['v' => ['a' => 1]]]))->contains('v', '=', ['a' => 1])];
    $table['assoc array vs "x"'] = ["'='" => (new Collection([['v' => ['a' => 1]]]))->contains('v', '=', 'x')];

    return $table;
});

// ==== fix-round-4 Group G2: obj.spec's non-string-operator assertion is RECORD-backed, and
// ==== "r3-contains-boolean-value" records only the list-backed call.
probe('r4-assoc-backed-operator-forms', "(new Collection(['a'=>['v'=>5],'b'=>['v'=>6]]))->contains('v', 5, 6) and the data.spec twins", function () {
    $assoc = ['a' => ['v' => 5], 'b' => ['v' => 6]];
    $list = [['v' => 5], ['v' => 6]];
    $flags = ['a' => ['active' => true], 'b' => ['active' => false]];

    return [
        'non-string-operator-assoc' => (new Collection($assoc))->contains('v', 5, 6),
        'non-string-operator-list' => (new Collection($list))->contains('v', 5, 6),
        'key-true-assoc' => (new Collection($flags))->contains('active', true),
        'key-operator-true-assoc' => (new Collection($flags))->contains('active', '=', true),
        'key-true-list' => (new Collection([['active' => true], ['active' => false]]))->contains('active', true),
        'null-key-list' => (new Collection([1, 2]))->contains(null, '>', 1),
    ];
});
probe('contains-out-of-order-key-order', '$keys seen by collect(base)->contains($cb returning false)', function () {
    $seen = [];
    collect(e0Base())->contains(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return false;
    });

    return $seen;
});
probe('contains-out-of-order-first-match', "collect(base)->contains(fn (\$v, \$k) => true) stops at the first entry", function () {
    $seen = [];
    collect(e0Base())->contains(function ($value, $key) use (&$seen) {
        $seen[] = $key;

        return true;
    });

    return $seen;
});

probe('contains-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb), false));
probe('contains-out-of-order-early-exit-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => \$v === 'a') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb), fn ($v) => $v === 'a'));
probe('contains-mixed-callback-order', "(new Collection(['x' => 1, 0 => 2, 'y' => 3]))->contains(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(MIXED))->contains($cb), false));
probe('contains-out-of-order-operator-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->contains(fn (\$v, \$k) => false, '=', 'q') => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->contains($cb, '=', 'q'), false));
probe('contains-collision', "(new Collection([1 => 'a', '1' => 'b']))->contains('a')", fn () => (new Collection([1 => 'a', '1' => 'b']))->contains('a'));
probe('C32-C-callback-php-truthiness', 'callbacks returning "0" or [] are falsy: contains / first / search / every / hasSole / hasMany', fn () => [
    'contains' => (new Collection([1]))->contains(fn () => '0'),
    'first' => (new Collection([1, 2]))->first(fn () => '0'),
    'first-array' => (new Collection([1, 2]))->first(fn () => []),
    'search' => (new Collection([1, 2]))->search(fn () => '0'),
    'every' => (new Collection([1, 2]))->every(fn () => '0'),
    'hasSole' => (new Collection([1]))->hasSole(fn () => '0'),
    'hasMany' => (new Collection([1, 2]))->hasMany(fn () => []),
]);
probe('C32-C-two-args-null-value', 'contains / hasSole / hasMany / sole / firstWhere with ("a", null) over [["a" => null], ["a" => 1]]', fn () => [
    'contains' => (new Collection([['a' => null], ['a' => 1]]))->contains('a', null),
    'contains-none' => (new Collection([['a' => 1]]))->contains('a', null),
    'hasSole' => (new Collection([['a' => null], ['a' => 1]]))->hasSole('a', null),
    'hasMany' => (new Collection([['a' => null], ['a' => 0], ['a' => 1]]))->hasMany('a', null),
    'sole' => (new Collection([['a' => null], ['a' => 1]]))->sole('a', null),
    'firstWhere' => (new Collection([['a' => 1], ['a' => null]]))->firstWhere('a', null),
]);
probe('C32-C-collection-rows', 'rows that are Collections: contains("v", 1) / where("v", 1)->count() / firstWhere("v", 1)->all() / value("v")', fn () => [
    (new Collection([new Collection(['v' => 1])]))->contains('v', 1),
    (new Collection([new Collection(['v' => 1])]))->where('v', 1)->count(),
    (new Collection([new Collection(['v' => 1])]))->firstWhere('v', 1)->all(),
    (new Collection([new Collection(['v' => 1])]))->value('v'),
]);

probe('C32-C-collection-rows-by-backing', "c32c_rows(list | keyed): contains('k', 'a') / where('k', 'b')->keys() / firstWhere('k', 'a')->all() / value('v')", fn () => array_map(fn (bool $keyed) => [
    c32c_rows($keyed)->contains('k', 'a'),
    c32c_rows($keyed)->where('k', 'b')->keys()->all(),
    c32c_rows($keyed)->firstWhere('k', 'a')->all(),
    c32c_rows($keyed)->value('v'),
], ['list' => false, 'keyed' => true]));
probe('C32-C-contains-unit-enum-operand', '(new Collection([["n" => C32StaffEnum::Joe]]))->contains("n", "Joe") / contains("n", C32StaffEnum::Joe) / contains("n", "!=", "Joe")', fn () => [
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', 'Joe'),
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', C32StaffEnum::Joe),
    (new Collection([['n' => C32StaffEnum::Joe]]))->contains('n', '!=', 'Joe'),
]);

probe('C32-D-array-rows-by-backing', "c32d_array_rows(list | keyed): contains('k', 'a'), where('k', 'b') v's, firstWhere('k', 'a'), value('v'), pluck('v') and pluck('v', 'k'), sortBy('k') v's, groupBy('k') and keyBy('k') v's, whereIn('k', ['a']) v's", fn () => array_map(fn (bool $keyed) => [
    'contains' => c32d_array_rows($keyed)->contains('k', 'a'),
    'where' => c32d_array_rows($keyed)->where('k', 'b')->pluck('v')->all(),
    'firstWhere' => c32d_array_rows($keyed)->firstWhere('k', 'a'),
    'value' => c32d_array_rows($keyed)->value('v'),
    'pluck' => c32d_array_rows($keyed)->pluck('v')->all(),
    'pluckKeyed' => c32d_array_rows($keyed)->pluck('v', 'k')->all(),
    'sortBy' => c32d_array_rows($keyed)->sortBy('k')->pluck('v')->all(),
    'groupBy' => c32d_array_rows($keyed)->groupBy('k')->map(fn (Collection $group) => $group->pluck('v')->all())->all(),
    'keyBy' => c32d_array_rows($keyed)->keyBy('k')->map(fn (array $row) => $row['v'])->all(),
    'whereIn' => c32d_array_rows($keyed)->whereIn('k', ['a'])->pluck('v')->all(),
], ['list' => false, 'keyed' => true]));

emit();
