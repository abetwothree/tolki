<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

// F-2 — the array arm of PHP 8's <=>, which compareValues replaced with a
// compare of the two JSON.stringify forms. PHP counts the entries first, then
// walks the LEFT operand's keys in order; a key the right side lacks makes the
// pair uncomparable, and <=> answers 1 for it whichever side is missing one.

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

// F-2 — array against scalar, the rows task-19-spaceship.json does not carry.
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

// F-2 — the same rule seen through Arr::sort, which is the entry point this
// port mirrors: counts order the rows before any element is looked at.
probe('Arr::sort orders lists of arrays by count first', 'Arr::sort([[9,9],[10],[1,2,3]])', fn () => array_values(Arr::sort([[9, 9], [10], [1, 2, 3]])));
probe('Arr::sort orders equal-count rows element-wise', 'Arr::sort([["id"=>2],["id"=>10],["id"=>1]])', fn () => array_values(Arr::sort([['id' => 2], ['id' => 10], ['id' => 1]])));

emit();
