<?php

/**
 * Ground truth for PHP's <=> operator.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('spaceship on two numeric strings', '"5" <=> "10"', fn () => '5' <=> '10');
probe('spaceship on a numeric and a non-numeric string', '"5" <=> "abc"', fn () => '5' <=> 'abc');
probe('spaceship on zero and empty string', '0 <=> ""', fn () => 0 <=> '');
probe('spaceship on null and false', 'null <=> false', fn () => null <=> false);

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

// F-2: PHP 8's <=> on arrays counts entries first, then walks the left operand's keys in order; a key the right
// side lacks makes the pair uncomparable, and <=> answers 1 whichever side is missing one.

// F-2 — count first: the shorter array wins outright, whatever it holds.
probe('spaceship on arrays of different length, shorter on the left', '[1] <=> [1, 2]', fn () => [1] <=> [1, 2]);
probe('spaceship on arrays of different length, longer on the left', '[1, 2] <=> [1]', fn () => [1, 2] <=> [1]);
probe('spaceship where the longer array holds the smaller elements', '[9, 9] <=> [10]', fn () => [9, 9] <=> [10]);
probe('spaceship on an empty array and a one-element array', '[] <=> [1]', fn () => [] <=> [1]);
probe('spaceship on two empty arrays', '[] <=> []', fn () => [] <=> []);

// F-2 — equal counts: element-wise by key, first difference decides.
probe('spaceship on equal-length arrays differing in the last element', '[1, 2] <=> [1, 3]', fn () => [1, 2] <=> [1, 3]);
probe('spaceship on equal-length arrays differing in the first element', '[2, 1] <=> [1, 9]', fn () => [2, 1] <=> [1, 9]);
probe('spaceship on identical arrays', '[1, 2] <=> [1, 2]', fn () => [1, 2] <=> [1, 2]);
probe('spaceship on arrays of numeric strings', '["9"] <=> ["10"]', fn () => ['9'] <=> ['10']);

// F-2 — string keys: same keys compare element-wise, a missing key does not.
probe('spaceship on keyed arrays sharing their keys', '["a"=>1] <=> ["a"=>2]', fn () => ['a' => 1] <=> ['a' => 2]);
probe('spaceship on keyed arrays with disjoint keys', '["a"=>1] <=> ["b"=>1]', fn () => ['a' => 1] <=> ['b' => 1]);
probe('spaceship on keyed arrays with disjoint keys, reversed', '["b"=>1] <=> ["a"=>1]', fn () => ['b' => 1] <=> ['a' => 1]);
probe('spaceship on a keyed array and a list of the same length', '["a"=>1] <=> [1]', fn () => ['a' => 1] <=> [1]);
probe('spaceship on keyed arrays holding the same pairs in another order', '["a"=>1,"b"=>2] <=> ["b"=>2,"a"=>1]', fn () => ['a' => 1, 'b' => 2] <=> ['b' => 2, 'a' => 1]);
probe('spaceship walks the left operand keys in their own order', '["z"=>1,""=>9] <=> ["z"=>2,""=>8]', fn () => ['z' => 1, '' => 9] <=> ['z' => 2, '' => 8]);

// F-2 — the rule recurses, so an inner count outranks an inner element.
probe('spaceship on nested arrays differing one level down', '[[1],[2]] <=> [[1],[3]]', fn () => [[1], [2]] <=> [[1], [3]]);
probe('spaceship on nested arrays differing in an inner count', '[[1]] <=> [[1,2]]', fn () => [[1]] <=> [[1, 2]]);

// F-2 — stdClass, the other shape a plain JS object can stand for. Same class,
// so PHP compares the two property tables exactly as it compares two arrays.
probe('spaceship on stdClass objects sharing a property', '(object)["x"=>1] <=> (object)["x"=>2]', fn () => (object) ['x' => 1] <=> (object) ['x' => 2]);
probe('spaceship on stdClass objects with equal properties', '(object)["x"=>1] <=> (object)["x"=>1]', fn () => (object) ['x' => 1] <=> (object) ['x' => 1]);
probe('spaceship on stdClass objects with disjoint properties', '(object)["x"=>1] <=> (object)["y"=>1]', fn () => (object) ['x' => 1] <=> (object) ['y' => 1]);

// F-2 — array against scalar, the rows above do not carry.
// PHP sorts every array above every scalar; this port keeps JS coercion here.
probe('spaceship on an empty array and zero', '[] <=> 0', fn () => [] <=> 0);
probe('spaceship on a one-element array and its only element as a string', '["a"] <=> "a"', fn () => ['a'] <=> 'a');
probe('spaceship on a one-element array and a numeric string', '[1] <=> "1"', fn () => [1] <=> '1');

// F-2 — cyclic input. PHP refuses outright with a catchable Error; this port
// ties the repeated pair instead, so a sort over cyclic rows still finishes.
probe('spaceship on two self-referencing arrays', '$c = [1]; $c[1] = &$c; $c <=> $d', function () {
    $c = [1];
    $c[1] = &$c;
    $d = [1];
    $d[1] = &$d;

    return $c <=> $d;
});
probe('spaceship on two self-referencing stdClass objects', '$o->self = $o; $o <=> $p', function () {
    $o = new stdClass();
    $o->self = $o;
    $p = new stdClass();
    $p->self = $p;

    return $o <=> $p;
});

// F-2 review round 1 — DateTime, the one exotic object this port also models.
// Its state is not a property table, so PHP does NOT take the array rule for
// it: two DateTime objects compare chronologically, whatever they hold.
probe('spaceship on two DateTime objects, earlier on the left', "new DateTime('2020-01-01') <=> new DateTime('2021-01-01')", fn () => new DateTime('2020-01-01') <=> new DateTime('2021-01-01'));
probe('spaceship on two DateTime objects, later on the left', "new DateTime('2021-01-01') <=> new DateTime('2020-01-01')", fn () => new DateTime('2021-01-01') <=> new DateTime('2020-01-01'));
probe('spaceship on two DateTime objects of the same instant', "new DateTime('2020-01-01') <=> new DateTime('2020-01-01')", fn () => new DateTime('2020-01-01') <=> new DateTime('2020-01-01'));

// F-2 review round 1 — a DateTime against the shapes a plain JS object stands
// for. Two objects of different classes are uncomparable and answer 1 either
// way; an object against an ARRAY is ordered, every object above every array.
probe('spaceship on a DateTime and a stdClass', "new DateTime('2020-01-01') <=> new stdClass()", fn () => new DateTime('2020-01-01') <=> new stdClass());
probe('spaceship on a stdClass and a DateTime', "new stdClass() <=> new DateTime('2020-01-01')", fn () => new stdClass() <=> new DateTime('2020-01-01'));
probe('spaceship on a DateTime and an empty array', "new DateTime('2020-01-01') <=> []", fn () => new DateTime('2020-01-01') <=> []);
probe('spaceship on an empty array and a DateTime', "[] <=> new DateTime('2020-01-01')", fn () => [] <=> new DateTime('2020-01-01'));
probe('spaceship on a keyed array and a DateTime', "['a'=>1] <=> new DateTime('2020-01-01')", fn () => ['a' => 1] <=> new DateTime('2020-01-01'));

// E3 — the cells `.changeset/utils-obj-release-readiness.md` names as remaining divergences.
// Only "spaceship on an empty array and zero" was recorded; these back the rest of the claim.
probe('e3 spaceship on a keyed array and a non-numeric string', "['x'=>1] <=> 'abc'", fn () => ['x' => 1] <=> 'abc');
probe('e3 greater-than on a keyed array and a non-numeric string', "['x'=>1] > 'abc'", fn () => ['x' => 1] > 'abc');
probe('e3 spaceship on an empty array and true', '[] <=> true', fn () => [] <=> true);
probe('e3 spaceship on a one-element array and true', '[1] <=> true', fn () => [1] <=> true);

emit();
