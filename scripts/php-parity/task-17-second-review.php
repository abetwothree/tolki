<?php

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Arr;

// C1 — getArrayableItems operand unwrapping
probe('diff with a Collection operand', 'collect(["a"=>10,"b"=>20])->diff(collect([20]))', fn () => collect(['a' => 10, 'b' => 20])->diff(collect([20]))->all());
probe('intersect with a Collection operand', 'collect(["a"=>10,"b"=>20])->intersect(collect([20]))', fn () => collect(['a' => 10, 'b' => 20])->intersect(collect([20]))->all());
probe('diff with a Traversable operand', 'collect(["a"=>10,"b"=>20])->diff(new ArrayIterator([20]))', fn () => collect(['a' => 10, 'b' => 20])->diff(new ArrayIterator([20]))->all());
probe('getArrayableItems rejects a bare object', 'collect([1])->diff(new stdClass())', fn () => collect([1])->diff(new stdClass())->all());

// C2 — intersect over object items
probe('intersect over array items collapses to "Array"', 'collect([["id"=>1],["id"=>2]])->intersect([["id"=>1]])', fn () => collect([['id' => 1], ['id' => 2]])->intersect([['id' => 1]])->all());
probe('diff over array items collapses to "Array"', 'collect([["id"=>1],["id"=>2]])->diff([["id"=>1]])', fn () => collect([['id' => 1], ['id' => 2]])->diff([['id' => 1]])->all());

// B1 — splice with an associative replacement
probe('splice with an assoc replacement on a list', 'collect([1,2,3])->splice(1,1,["foo"=>"bar"])', function () {
    $c = collect([1, 2, 3]);
    $removed = $c->splice(1, 1, ['foo' => 'bar']);
    return ['removed' => $removed->all(), 'after' => $c->all()];
});

// B2 — push key classification
foreach (['01' => 'lead', '1e2' => 'exp', '-1' => 'neg', '5' => 'five'] as $k => $v) {
    probe("push onto a {\"{$k}\"}-keyed array", "collect([\"{$k}\"=>\"{$v}\"])->push(9)", fn () => collect([$k => $v])->push(9)->all());
}

// B3 — krsort / ksort key ordering
probe('ksort on integer keys', 'ksort([5=>"e",2=>"b",9=>"z"])', function () { $a = [5 => 'e', 2 => 'b', 9 => 'z']; ksort($a); return $a; });
probe('krsort on integer keys', 'krsort([5=>"e",2=>"b",9=>"z"])', function () { $a = [5 => 'e', 2 => 'b', 9 => 'z']; krsort($a); return $a; });
probe('krsort on a packed list', 'krsort([0=>"a",1=>"b",2=>"c"])', function () { $a = [0 => 'a', 1 => 'b', 2 => 'c']; krsort($a); return $a; });
probe('krsort mixes integer and string keys', 'krsort([10=>"j","b"=>"bee",2=>"c"])', function () { $a = [10 => 'j', 'b' => 'bee', 2 => 'c']; krsort($a); return $a; });

// B4 — sortBy over array values
probe('sortBy(null) over array values', 'collect(["a"=>["n"=>2],"b"=>["n"=>1],"c"=>["n"=>3]])->sortBy(null)->values()', fn () => collect(['a' => ['n' => 2], 'b' => ['n' => 1], 'c' => ['n' => 3]])->sortBy(null)->values()->all());

// B5 — sortByMany tie-breaking
probe('sortByMany falls through on an equal first key', 'collect([["a"=>[],"b"=>2],["a"=>[],"b"=>1]])->sortBy([["a","asc"],["b","asc"]])->values()', fn () => collect([['a' => [], 'b' => 2], ['a' => [], 'b' => 1]])->sortBy([['a', 'asc'], ['b', 'asc']])->values()->all());
probe('sortByMany treats 1 and "1" as a tie', 'collect([["a"=>1,"b"=>2],["a"=>"1","b"=>1]])->sortBy([["a","asc"],["b","asc"]])->values()', fn () => collect([['a' => 1, 'b' => 2], ['a' => '1', 'b' => 1]])->sortBy([['a', 'asc'], ['b', 'asc']])->values()->all());

// B6 — numeric-string ordering
probe('sort orders numeric strings numerically', 'sort(["9","10"])', function () { $a = ['9', '10']; sort($a); return $a; });
probe('rsort orders numeric strings numerically', 'rsort(["9","10"])', function () { $a = ['9', '10']; rsort($a); return $a; });
probe('spaceship on two numeric strings', '"5" <=> "10"', fn () => '5' <=> '10');
probe('spaceship on a numeric and a non-numeric string', '"5" <=> "abc"', fn () => '5' <=> 'abc');
probe('spaceship on zero and empty string', '0 <=> ""', fn () => 0 <=> '');
probe('spaceship on null and false', 'null <=> false', fn () => null <=> false);

// B7 — assoc family string-cast comparison
probe('array_intersect_assoc casts values to string', 'array_intersect_assoc(["a"=>0],["a"=>"0"])', fn () => array_intersect_assoc(['a' => 0], ['a' => '0']));
probe('array_diff_assoc casts values to string', 'array_diff_assoc(["a"=>0],["a"=>"0"])', fn () => array_diff_assoc(['a' => 0], ['a' => '0']));
probe('array_diff_assoc casts a float to string', 'array_diff_assoc(["a"=>1.0],["a"=>"1"])', fn () => array_diff_assoc(['a' => 1.0], ['a' => '1']));
probe('array_intersect_key never compares values', 'array_intersect_key(["a"=>0],["a"=>"zzz"])', fn () => array_intersect_key(['a' => 0], ['a' => 'zzz']));

// B8 — dot and set keep a "__proto__" key as data
probe('Arr::dot keeps a "__proto__" key', 'Arr::dot(["__proto__"=>1])', fn () => Arr::dot(['__proto__' => 1]));
probe('Arr::dot keeps a "__proto__" array value', 'Arr::dot(["__proto__"=>[]])', fn () => Arr::dot(['__proto__' => []]));
probe('Arr::set preserves a sibling "__proto__" key', 'Arr::set([["__proto__"=>["isAdmin"=>true],"z"=>1]],"0.z",2)', function () { $a = [['__proto__' => ['isAdmin' => true], 'z' => 1]]; Arr::set($a, '0.z', 2); return $a; });

// B9 — "length" is an ordinary key in PHP
probe('put uses "length" as an ordinary key', 'collect([1,2])->put("length",5)', fn () => collect([1, 2])->put('length', 5)->all());

// B10 — push with a null key
probe('Arr::push with a null key appends', 'Arr::push(["a"=>1], null, 9)', function () { $a = ['a' => 1]; return Arr::push($a, null, 9); });
probe('Arr::push with a null key on a list', 'Arr::push([1,2], null, 9)', function () { $a = [1, 2]; return Arr::push($a, null, 9); });

// B11 — undot with a large integer key
probe('Arr::undot with a billion-index key', 'Arr::undot(["1000000000"=>"x"])', fn () => array_keys(Arr::undot(['1000000000' => 'x'])));
probe('Arr::undot with a negative integer key', 'Arr::undot(["-1"=>"x"])', fn () => array_keys(Arr::undot(['-1' => 'x'])));

// D1 — constructor and prototype are ordinary keys
probe('Arr::set writes a "constructor" key', 'Arr::set([], "constructor", 5)', function () { $a = []; Arr::set($a, 'constructor', 5); return $a; });
probe('Arr::set writes a nested "constructor.prototype" path', 'Arr::set([], "constructor.prototype.polluted", 5)', function () { $a = []; Arr::set($a, 'constructor.prototype.polluted', 5); return $a; });
probe('Arr::set writes a "__proto__" key', 'Arr::set([], "__proto__", 5)', function () { $a = []; Arr::set($a, '__proto__', 5); return $a; });

// T1 — flatten depth
probe('Arr::flatten defaults to unlimited depth', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]])', fn () => Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]]));
probe('Arr::flatten honours an explicit depth of 2', 'Arr::flatten(["a"=>["b"=>["c"=>["d"=>1]]]], 2)', fn () => Arr::flatten(['a' => ['b' => ['c' => ['d' => 1]]]], 2));

emit();
