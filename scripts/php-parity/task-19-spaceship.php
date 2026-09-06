<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

// B6 — the scalar arms of PHP 8's <=> that compareValues has to reproduce.
// Two numeric operands compare numerically; anything else against a string
// compares as strings; null or a bool against a non-string compares as bools.
probe('spaceship on two numeric strings, wider on the left', '"10" <=> "9"', fn () => '10' <=> '9');
probe('spaceship on numeric strings spelled differently', '"1" <=> "01"', fn () => '1' <=> '01');
probe('spaceship on an int and its numeric string', '1 <=> "1"', fn () => 1 <=> '1');
probe('spaceship on an int and a non-numeric string', '5 <=> "abc"', fn () => 5 <=> 'abc');
probe('spaceship on a non-numeric string and an int', '"abc" <=> 0', fn () => 'abc' <=> 0);
probe('spaceship on a negative int and an empty string', '-1 <=> ""', fn () => -1 <=> '');
probe('spaceship on null and a non-numeric string', 'null <=> "abc"', fn () => null <=> 'abc');
probe('spaceship on null and the string zero', 'null <=> "0"', fn () => null <=> '0');
probe('spaceship on null and a positive int', 'null <=> 5', fn () => null <=> 5);
probe('spaceship on null and an empty array', 'null <=> []', fn () => null <=> []);
probe('spaceship on false and a non-numeric string', 'false <=> "abc"', fn () => false <=> 'abc');
probe('spaceship on false and a negative int', 'false <=> -1', fn () => false <=> -1);
probe('spaceship on true and a positive int', 'true <=> 5', fn () => true <=> 5);
probe('spaceship on true and an empty string', 'true <=> ""', fn () => true <=> '');
probe('spaceship on true and the string zero', 'true <=> "0"', fn () => true <=> '0');
probe('spaceship on null and zero', 'null <=> 0', fn () => null <=> 0);
probe('spaceship on null and an empty string', 'null <=> ""', fn () => null <=> '');
probe('spaceship on null and a one-element array', 'null <=> [1]', fn () => null <=> [1]);
probe('spaceship on true and false', 'true <=> false', fn () => true <=> false);
probe('spaceship on false and an empty array', 'false <=> []', fn () => false <=> []);

// B6 — the array arm this port does NOT source: PHP orders every array above
// every scalar, which compareValues leaves to JS coercion. Captured so the
// divergence is ground truth rather than an assumption.
probe('spaceship on an int and a one-element array', '5 <=> [1]', fn () => 5 <=> [1]);
probe('spaceship on a one-element array and an int', '[1] <=> 5', fn () => [1] <=> 5);

// B6 — the same ordering seen through every sort entry point the port mirrors.
$mixed = ['9', '10', '1', 5];
probe('Arr::sort orders numeric strings numerically', 'Arr::sort(["9","10","1",5])', fn () => array_values(Arr::sort($mixed)));
probe('Arr::sortDesc orders numeric strings numerically', 'Arr::sortDesc(["9","10","1",5])', fn () => array_values(Arr::sortDesc($mixed)));
probe('Collection::sort orders numeric strings numerically', 'collect(["9","10","1",5])->sort()->values()', fn () => collect($mixed)->sort()->values()->all());
probe('Collection::sortDesc orders numeric strings numerically', 'collect(["9","10","1",5])->sortDesc()->values()', fn () => collect($mixed)->sortDesc()->values()->all());
probe('Collection::sortBy(null) orders numeric strings numerically', 'collect(["9","10","1",5])->sortBy(null)->values()', fn () => collect($mixed)->sortBy(null)->values()->all());
probe('Collection::sortByDesc(null) orders numeric strings numerically', 'collect(["9","10","1",5])->sortByDesc(null)->values()', fn () => collect($mixed)->sortByDesc(null)->values()->all());

// B6 — a keyed backing, which is what Obj.sort and sortByMany walk.
$rows = [['n' => '9'], ['n' => '10'], ['n' => '1'], ['n' => 5]];
probe('Arr::sort by key orders numeric strings numerically', 'Arr::sort($rows, "n")', fn () => array_values(Arr::sort($rows, 'n')));
probe('Collection::sortBy([key]) orders numeric strings numerically', 'collect($rows)->sortBy(["n"])->pluck("n")', fn () => collect($rows)->sortBy(['n'])->pluck('n')->all());

// B6 — the falsy ties, seen through asort/arsort, that obj.spec pins. PHP has
// no `undefined`; the rows below drop it and this port compares it as null.
probe('asort ties zero and null, keeping insertion order', 'asort(["user1"=>0,"user2"=>null,"user3"=>25])', function () {
    $a = ['user1' => 0, 'user2' => null, 'user3' => 25];
    asort($a);
    return array_keys($a);
});
$falsy = ['user0' => 100, 'user1' => 30, 'user2' => null, 'user3' => 25, 'user4' => []];
probe('asort ties null and an empty array, keeping insertion order', 'asort(["user2"=>null,"user4"=>[],...])', function () use ($falsy) {
    asort($falsy);
    return array_keys($falsy);
});
probe('arsort over the same null and empty-array fixture', 'arsort(["user2"=>null,"user4"=>[],...])', function () use ($falsy) {
    arsort($falsy);
    return array_keys($falsy);
});

// B6 follow-up — the precision arms. Number() collapses integer strings past
// 2^53 and overflows exponents to one infinity; PHP compares the first exactly
// and falls back to strcmp on the second.
probe('spaceship on integer strings one apart past 2^53', '"9007199254740993" <=> "9007199254740992"', fn () => '9007199254740993' <=> '9007199254740992');
probe('spaceship on integer strings one apart past 2^53, ascending', '"9007199254740993" <=> "9007199254740994"', fn () => '9007199254740993' <=> '9007199254740994');
probe('spaceship on negative integer strings past 2^53', '"-9007199254740993" <=> "-9007199254740992"', fn () => '-9007199254740993' <=> '-9007199254740992');
probe('spaceship on integer strings past the int64 range', '"99999999999999999999" <=> "99999999999999999998"', fn () => '99999999999999999999' <=> '99999999999999999998');
probe('spaceship on a leading-zero integer string that is larger', '"0000123" <=> "99"', fn () => '0000123' <=> '99');
probe('spaceship on a leading-zero integer string that is smaller', '"00001" <=> "99"', fn () => '00001' <=> '99');
probe('spaceship on a whitespace-padded integer string', '" 42 " <=> "42"', fn () => ' 42 ' <=> '42');
probe('spaceship on exponent strings that overflow to infinity', '"1e400" <=> "1e401"', fn () => '1e400' <=> '1e401');
probe('spaceship on identical exponent strings that overflow', '"1e400" <=> "1e400"', fn () => '1e400' <=> '1e400');
probe('spaceship on decimal strings spelled differently', '"1.5" <=> "1.50"', fn () => '1.5' <=> '1.50');
probe('spaceship on an integer string and a decimal string', '"42" <=> "1.5"', fn () => '42' <=> '1.5');

// B6 follow-up — an object-backed natural sort, which the list rows above do
// not cover: obj.spec pins asort/arsort over this literal, not sort/rsort.
$keyed = ['a' => '9', 'b' => '10', 'c' => '1', 'd' => 5];
probe('asort over a keyed mix of numeric strings and an int', 'asort(["a"=>"9","b"=>"10","c"=>"1","d"=>5])', function () use ($keyed) {
    asort($keyed);
    return array_values($keyed);
});
probe('arsort over a keyed mix of numeric strings and an int', 'arsort(["a"=>"9","b"=>"10","c"=>"1","d"=>5])', function () use ($keyed) {
    arsort($keyed);
    return array_values($keyed);
});

// B6 follow-up — whereNotBetween is a non-sort consumer of the same comparison.
$between = [['v' => '9'], ['v' => '10'], ['v' => '1'], ['v' => 5], ['v' => null], ['v' => 0]];
probe('whereNotBetween over numeric strings and falsy values', 'collect($between)->whereNotBetween("v",["1","5"])->pluck("v")', fn () => collect($between)->whereNotBetween('v', ['1', '5'])->pluck('v')->all());
probe('whereBetween over the same items', 'collect($between)->whereBetween("v",["1","5"])->pluck("v")', fn () => collect($between)->whereBetween('v', ['1', '5'])->pluck('v')->all());

emit();
