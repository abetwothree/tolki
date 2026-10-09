<?php

/**
 * Ground truth for Collection::containsStrict().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;

probe('L9 containsStrict (assoc)', 'containsStrict() over (new Collection([\'a\'=>1,\'b\'=>3,\'c\'=>5,\'d\'=>\'02\'])) with 1,\'1\',2,\'02\',true,fn($v)=>$v<5,fn($v)=>$v>5; then [\'a\'=>0] with 0,\'0\',false,null; [\'a\'=>1,\'b\'=>null] with null,0,false; [\'a\'=>\'date\',\'b\'=>\'class\',\'c\'=>(object)[\'foo\'=>50],\'d\'=>\'\'] with \'date\',\'class\',\'foo\',null,\'\'', function () {
    $r = [];
    $c = new Collection(['a' => 1, 'b' => 3, 'c' => 5, 'd' => '02']);
    $r['mixed'] = [$c->containsStrict(1), $c->containsStrict('1'), $c->containsStrict(2), $c->containsStrict('02'), $c->containsStrict(true), $c->containsStrict(fn ($v) => $v < 5), $c->containsStrict(fn ($v) => $v > 5)];
    $c = new Collection(['a' => 0]);
    $r['zero'] = [$c->containsStrict(0), $c->containsStrict('0'), $c->containsStrict(false), $c->containsStrict(null)];
    $c = new Collection(['a' => 1, 'b' => null]);
    $r['onenull'] = [$c->containsStrict(null), $c->containsStrict(0), $c->containsStrict(false)];
    $c = new Collection(['a' => 'date', 'b' => 'class', 'c' => (object) ['foo' => 50], 'd' => '']);
    $r['date'] = [$c->containsStrict('date'), $c->containsStrict('class'), $c->containsStrict('foo'), $c->containsStrict(null), $c->containsStrict('')];
    return $r;
});
probe('D2 containsStrict callback matching a null value', '[\'strict\' => (new Collection([\'a\' => null, \'b\' => 1]))->containsStrict(fn ($v) => is_null($v)), \'loose\' => (new Collection([\'a\' => null, \'b\' => 1]))->contains(fn ($v) => is_null($v))]', fn () => [
    'strict' => (new Collection(['a' => null, 'b' => 1]))->containsStrict(fn ($v) => is_null($v)),
    'loose' => (new Collection(['a' => null, 'b' => 1]))->contains(fn ($v) => is_null($v)),
]);
probe('D3 containsStrict NAN', '[\'strict\' => (new Collection([\'a\' => NAN]))->containsStrict(NAN), \'loose\' => (new Collection([\'a\' => NAN]))->contains(NAN)]', fn () => [
    'strict' => (new Collection(['a' => NAN]))->containsStrict(NAN),
    'loose' => (new Collection(['a' => NAN]))->contains(NAN),
]);
probe('D4 containsStrict array by value', '[\'strict_list\' => (new Collection([\'a\' => [1]]))->containsStrict([1]), \'strict_assoc\' => (new Collection([\'a\' => [\'x\' => 1]]))->containsStrict([\'x\' => 1]), \'loose_assoc\' => (new Collection([\'a\' => [\'x\' => 1]]))->contains([\'x\' => \'1\'])]', fn () => [
    'strict_list' => (new Collection(['a' => [1]]))->containsStrict([1]),
    'strict_assoc' => (new Collection(['a' => ['x' => 1]]))->containsStrict(['x' => 1]),
    'loose_assoc' => (new Collection(['a' => ['x' => 1]]))->contains(['x' => '1']),
]);
probe('D10 contains strict vs loose -0/0', '[\'s\' => (new Collection([\'a\' => -0.0]))->containsStrict(0.0)]', fn () => [
    's' => (new Collection(['a' => -0.0]))->containsStrict(0.0),
]);

// ---- === on arrays needs the same pairs in the same order: strict contains, uniqueStrict and duplicatesStrict too
probe('containsStrict-key-order', "['a' => 1, 'b' => 2] === ['b' => 2, 'a' => 1], and containsStrict / in_array(…, true) with a reordered array", fn () => [
    'identical' => ['a' => 1, 'b' => 2] === ['b' => 2, 'a' => 1],
    'same-order' => ['a' => 1, 'b' => 2] === ['a' => 1, 'b' => 2],
    'map' => (new Collection(['a' => ['x' => 1, 'y' => 2]]))->containsStrict(['y' => 2, 'x' => 1]),
    'list' => (new Collection([['x' => 1, 'y' => 2]]))->containsStrict(['y' => 2, 'x' => 1]),
    'nested' => in_array(['n' => ['x' => 1, 'y' => 2]], [['n' => ['y' => 2, 'x' => 1]]], true),
]);

// ---- containsStrict($key, $value) compares data_get($item, $key) === $value whenever two arguments are passed
probe('containsStrict-two-args-by-value', "containsStrict('tags', ['a', 'b']), ('t', a reordered array), ('name', null) with the key null, missing or set", fn () => [
    'array' => (new Collection([['tags' => ['a', 'b']]]))->containsStrict('tags', ['a', 'b']),
    'reordered' => (new Collection([['t' => ['x' => 1, 'y' => 2]]]))->containsStrict('t', ['y' => 2, 'x' => 1]),
    'null' => (new Collection([['name' => null], ['name' => 'x']]))->containsStrict('name', null),
    'null-missing' => (new Collection([['a' => 1]]))->containsStrict('name', null),
    'null-none' => (new Collection([['name' => 'x']]))->containsStrict('name', null),
    'doesnt' => (new Collection([['tags' => ['a', 'b']]]))->doesntContainStrict('tags', ['a', 'b']),
]);
probe('containsStrict-numeric-string', "(new Collection([1, 3, 5, '02']))->containsStrict('02') and ->containsStrict(2)", fn () => [
    "'02'" => (new Collection([1, 3, 5, '02']))->containsStrict('02'),
    '2' => (new Collection([1, 3, 5, '02']))->containsStrict(2),
]);
probe('containsStrict-out-of-order-callback-order', "(new Collection([2 => 'c', 0 => 'a', 1 => 'b']))->containsStrict(fn (\$v, \$k) => false) => keys seen", fn () => keysSeen(fn ($cb) => (new Collection(OUT_OF_ORDER))->containsStrict($cb), false));
probe('containsStrict-out-of-order-null-first-callback', "(new Collection([2 => null, 0 => 'a']))->containsStrict(fn () => true)", fn () => (new Collection([2 => null, 0 => 'a']))->containsStrict(fn () => true));
probe('containsStrict-mixed-null-first-callback', "(new Collection(['x' => null, 0 => 'a']))->containsStrict(fn () => true)", fn () => (new Collection(['x' => null, 0 => 'a']))->containsStrict(fn () => true));
probe('containsStrict-out-of-order-non-null-first-callback', "(new Collection([2 => 'a', 0 => null]))->containsStrict(fn () => true)", fn () => (new Collection([2 => 'a', 0 => null]))->containsStrict(fn () => true));
probe('containsStrict-collision', "(new Collection([1 => 'a', '1' => 'b']))->containsStrict('a')", fn () => (new Collection([1 => 'a', '1' => 'b']))->containsStrict('a'));

// containsStrict with a callback is array_any (laravel/framework#61507): a match holding null counts.
probe('containsStrict-list-null-callback', '(new Collection([1, null, 2]))->containsStrict(fn ($v) => is_null($v))', fn () => (new Collection([1, null, 2]))->containsStrict(fn ($v) => is_null($v)));
probe('containsStrict-list-zero-callback', '(new Collection([1, null, 2]))->containsStrict(fn ($v) => $v === 0)', fn () => (new Collection([1, null, 2]))->containsStrict(fn ($v) => $v === 0));
probe('containsStrict-assoc-null-callback', "(new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn (\$v) => is_null(\$v))", fn () => (new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn ($v) => is_null($v)));
probe('containsStrict-assoc-zero-callback', "(new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn (\$v) => \$v === 0)", fn () => (new Collection(['a' => 1, 'b' => null, 'c' => 2]))->containsStrict(fn ($v) => $v === 0));
probe('containsStrict-null-first-callback', "(new Collection([null, 'a']))->containsStrict(fn () => true)", fn () => (new Collection([null, 'a']))->containsStrict(fn () => true));
probe('containsStrict-out-of-order-callback-keys', "keys a false-answering containsStrict callback sees on [2 => 'c', 0 => 'a', 1 => 'b']", fn () => containsStrictKeysSeen(new Collection([2 => 'c', 0 => 'a', 1 => 'b']), fn () => false));
probe('containsStrict-stops-at-first-match', "keys an is_null callback sees on ['a', null, 'c']", fn () => containsStrictKeysSeen(new Collection(['a', null, 'c']), fn ($v) => is_null($v)));

$c32KeysSeen = function (callable $run, bool $answer = false): array {
    $seen = [];
    $run(function ($v, $k) use (&$seen, $answer) {
        $seen[] = [gettype($k), $k];

        return $answer;
    });

    return $seen;
};
probe('C32-C-callback-key-types-numeric-string-record', 'key types each callback sees on ["1" => "a", "x" => "b"]: containsStrict / search / hasSole / sole / firstOrFail', fn () => [
    'containsStrict' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->containsStrict($cb)),
    'search' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->search($cb)),
    'hasSole' => $c32KeysSeen(fn ($cb) => (new Collection(['1' => 'a', 'x' => 'b']))->hasSole($cb)),
    'sole' => $c32KeysSeen(function ($cb) {
        try {
            (new Collection(['1' => 'a', 'x' => 'b']))->sole($cb);
        } catch (\Throwable) {
        }
    }),
    'firstOrFail' => $c32KeysSeen(function ($cb) {
        try {
            (new Collection(['1' => 'a', 'x' => 'b']))->firstOrFail($cb);
        } catch (\Throwable) {
        }
    }),
]);
probe('C32-C-containsStrict-two-args-dot-path', "containsStrict('user.id', 2) and ('user.id', '2') over [['user' => ['id' => 1]], ['user' => ['id' => 2]]] (list) and ['r' => ['user' => ['id' => 2]]] (keyed)", fn () => [
    'list' => [
        (new Collection([['user' => ['id' => 1]], ['user' => ['id' => 2]]]))->containsStrict('user.id', 2),
        (new Collection([['user' => ['id' => 1]], ['user' => ['id' => 2]]]))->containsStrict('user.id', '2'),
    ],
    'keyed' => [
        (new Collection(['r' => ['user' => ['id' => 2]]]))->containsStrict('user.id', 2),
        (new Collection(['r' => ['user' => ['id' => 2]]]))->containsStrict('user.id', '2'),
    ],
]);

emit();
