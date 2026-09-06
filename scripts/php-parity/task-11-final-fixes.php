<?php

/**
 * Task 11 ground truth — the final-review fixes.
 *
 * Run: php scripts/php-parity/task-11-final-fixes.php > docs/php-parity/task-11-final-fixes.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('unshift renumbers existing integer keys', 'array_unshift([10,20,30,40],1,2)', function () {
    $a = [10, 20, 30, 40];
    array_unshift($a, 1, 2);

    return $a;
});

probe('unshift keeps string keys, prepends at 0', "array_unshift(['x'=>1,'y'=>2],9)", function () {
    $a = ['x' => 1, 'y' => 2];
    array_unshift($a, 9);

    return $a;
});

probe('unshift on mixed keys: integers renumber, strings stay', "array_unshift([0=>'a','x'=>1,1=>'b'],9)", function () {
    $a = [0 => 'a', 'x' => 1, 1 => 'b'];
    array_unshift($a, 9);

    return $a;
});

probe('unshift via Collection', 'collect([10,20,30,40])->unshift(1,2)', function () {
    return collect([10, 20, 30, 40])->unshift(1, 2)->all();
});

probe('pad appends after the original entries', 'array_pad([10,20,30,40],6,0)', function () {
    return array_pad([10, 20, 30, 40], 6, 0);
});

probe('pad with string keys numbers the pad slots from 0', "array_pad(['a'=>1,'b'=>2],4,0)", function () {
    return array_pad(['a' => 1, 'b' => 2], 4, 0);
});

probe('pad with mixed keys continues past the highest integer key', "array_pad([0=>'a','x'=>1],4,'p')", function () {
    return array_pad([0 => 'a', 'x' => 1], 4, 'p');
});

probe('negative pad numbers the pad slots first', 'array_pad([10,20,30,40],-6,0)', function () {
    return array_pad([10, 20, 30, 40], -6, 0);
});

probe('pad via Collection', 'collect([10,20,30,40])->pad(6,0)', function () {
    return collect([10, 20, 30, 40])->pad(6, 0)->all();
});

probe('reverse preserves keys and reverses entry order', 'collect([10,20,30,40])->reverse()', function () {
    return collect([10, 20, 30, 40])->reverse()->all();
});

probe('reverse on string keys', "collect(['a'=>1,'b'=>2,'c'=>3])->reverse()", function () {
    return collect(['a' => 1, 'b' => 2, 'c' => 3])->reverse()->all();
});

probe('flatten at a finite depth descends exactly that many levels', 'Arr::flatten([1,[2,[3]]],2)', function () {
    return Arr::flatten([1, [2, [3]]], 2);
});

probe('flatten depth 1 stops one level down', 'Arr::flatten([1,[2,[3]]],1)', function () {
    return Arr::flatten([1, [2, [3]]], 1);
});

probe('flatten depth 0 keeps descending (only 1 stops it)', 'Arr::flatten([1,[2,[3]]],0)', function () {
    return Arr::flatten([1, [2, [3]]], 0);
});

probe('flatten ignores keys at every level', "Arr::flatten(['a'=>1,'b'=>['c'=>2,'d'=>['e'=>3]]],2)", function () {
    return Arr::flatten(['a' => 1, 'b' => ['c' => 2, 'd' => ['e' => 3]]], 2);
});

probe('add stores a string key on a list', "Arr::add(['a','b'],'length','X')", function () {
    return Arr::add(['a', 'b'], 'length', 'X');
});

probe('add stores any other string key on a list', "Arr::add(['a','b'],'foo','X')", function () {
    return Arr::add(['a', 'b'], 'foo', 'X');
});

probe('only accepts a bare scalar key', 'Arr::only([10,20,30,40],1)', function () {
    return Arr::only([10, 20, 30, 40], 1);
});

probe('only casts a null key to an empty key list', 'Arr::only([10,20,30,40],null)', function () {
    return Arr::only([10, 20, 30, 40], null);
});

probe('union treats null as an empty operand', 'collect([10,20])->union(null)', function () {
    return collect([10, 20])->union(null)->all();
});

probe('sortBy with no comparisons leaves the order alone', 'collect([3,1,2])->sortBy([])', function () {
    return collect([3, 1, 2])->sortBy([])->all();
});

probe('sort with no comparisons leaves the order alone', 'Arr::sort([3,1,2],[])', function () {
    return Arr::sort([3, 1, 2], []);
});

probe('splice inserts a scalar replacement as one element', 'collect([10,20,30,40])->splice(1,2,99)', function () {
    $c = new Collection([10, 20, 30, 40]);
    $removed = $c->splice(1, 2, 99);

    return ['removed' => $removed->all(), 'remaining' => $c->all()];
});

probe('splice with a scalar replacement on string keys', "collect(['a'=>1,'b'=>2,'c'=>3,'d'=>4])->splice(1,2,99)", function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4]);
    $removed = $c->splice(1, 2, 99);

    return ['removed' => $removed->all(), 'remaining' => $c->all()];
});

emit();
