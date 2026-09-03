<?php

/**
 * Task 11 ground truth — the cross-backing agreement sweep.
 *
 * One probe per defect-matrix row (X1-X30), all over the same conceptual
 * PHP array, so the TypeScript sweep can pin keys and values rather than
 * only checking the two backings agree with each other.
 *
 * Run: php scripts/php-parity/task-11-cross-backing.php > docs/php-parity/task-11-cross-backing.json
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/** The one fixture every row that can use it uses: keys 0..3, values 10..40. */
function nums(): array
{
    return [10, 20, 30, 40];
}

probe('X1 pop mutates and returns the last value', 'collect([10,20,30,40])->pop()', function () {
    $c = new Collection(nums());
    $one = $c->pop();
    $d = new Collection(nums());
    $two = $d->pop(2);

    return ['pop' => $one, 'after' => $c->all(), 'pop2' => $two->all(), 'after2' => $d->all()];
});

probe('X2 shift mutates and returns the first value', 'collect([10,20,30,40])->shift()', function () {
    $c = new Collection(nums());
    $one = $c->shift();
    $d = new Collection(nums());
    $two = $d->shift(2);

    return ['shift' => $one, 'after' => $c->all(), 'shift2' => $two->all(), 'after2' => $d->all()];
});

probe('X3 shift throws on a negative count', 'collect([10,20,30,40])->shift(-1)', function () {
    return (new Collection(nums()))->shift(-1);
});

probe('X4 shift on empty returns null for any count', 'collect([])->shift(3)', function () {
    return ['count3' => (new Collection([]))->shift(3), 'count1' => (new Collection([]))->shift()];
});

probe('X5 unshift mutates and renumbers integer keys', 'collect([10,20,30,40])->unshift(1,2)', function () {
    $c = new Collection(nums());
    $c->unshift(1, 2);

    return $c->all();
});

probe('X6 splice mutates and returns the removed items', 'collect([10,20,30,40])->splice(1,2)', function () {
    $c = new Collection(nums());
    $removed = $c->splice(1, 2);

    return ['removed' => $removed->all(), 'after' => $c->all()];
});

probe('X7 splice one-arg form removes offset to end', 'collect([10,20,30,40])->splice(1)', function () {
    $c = new Collection(nums());
    $removed = $c->splice(1);

    return ['removed' => $removed->all(), 'after' => $c->all()];
});

probe('X8 splice keeps string keys, reindexes integer keys', "array_splice(['x'=>1,'y'=>2,'z'=>3],1,1)", function () {
    $a = ['x' => 1, 'y' => 2, 'z' => 3];
    $removed = array_splice($a, 1, 1);
    $b = [10 => 'a', 20 => 'b', 30 => 'c'];
    $removedB = array_splice($b, 1, 1);

    return ['strRemoved' => $removed, 'strAfter' => $a, 'intRemoved' => $removedB, 'intAfter' => $b];
});

probe('X9 replace does not mutate', "collect([10,20,30,40])->replace([1=>'d'])", function () {
    $c = new Collection(nums());
    $out = $c->replace([1 => 'd']);

    return ['result' => $out->all(), 'source' => $c->all()];
});

probe('X10 replaceRecursive does not mutate', 'collect([[a=>1],[b=>2]])->replaceRecursive([[c=>3]])', function () {
    $c = new Collection([['a' => 1], ['b' => 2]]);
    $out = $c->replaceRecursive([['c' => 3]]);

    return ['result' => $out->all(), 'source' => $c->all()];
});

probe('X11 replace/replaceRecursive treat null as a no-op', 'collect([10,20,30,40])->replace(null)', function () {
    return [
        'replace' => (new Collection(nums()))->replace(null)->all(),
        'replaceRecursive' => (new Collection(nums()))->replaceRecursive(null)->all(),
    ];
});

probe('X12 intersect compares values only', 'collect([10,20,30,40])->intersect([20,40])', function () {
    return (new Collection(nums()))->intersect([20, 40])->all();
});

probe('X13 diff compares values only', 'collect([10,20,30,40])->diff([20,40])', function () {
    return (new Collection(nums()))->diff([20, 40])->all();
});

probe('X14 intersect variants treat null as empty', 'collect([10,20,30,40])->intersect(null)', function () {
    return [
        'intersect' => (new Collection(nums()))->intersect(null)->all(),
        'intersectAssoc' => (new Collection(nums()))->intersectAssoc(null)->all(),
        'intersectByKeys' => (new Collection(nums()))->intersectByKeys(null)->all(),
    ];
});

probe('X15 slice with a negative offset and a length', 'collect([10,20,30,40])->slice(-3,2)', function () {
    return (new Collection(nums()))->slice(-3, 2)->all();
});

probe('X16 filter drops PHP-falsy "0" but keeps "00" and "0.0"', 'collect([...])->filter()', function () {
    return (new Collection(['0', '00', '0.0', '', 0, false, null, [], 'a']))->filter()->all();
});

probe('X17 pad numbers negative pad slots from 0', "array_pad(['a'=>1,'b'=>2],-5,0)", function () {
    return ['strings' => array_pad(['a' => 1, 'b' => 2], -5, 0), 'ints' => array_pad(nums(), -6, 0)];
});

probe('X18/pad positive padding appends', 'collect([10,20,30,40])->pad(6,0)', function () {
    return ['padded' => (new Collection(nums()))->pad(6, 0)->all(), 'noPad' => (new Collection(nums()))->pad(2, 0)->all()];
});

probe('X19 combine throws on a key/value count mismatch', "array_combine(['a','b'],[1])", function () {
    return array_combine(['a', 'b'], [1]);
});

probe('X19 combine on matching counts', "collect(['a','b','c'])->combine([1,2,3])", function () {
    return (new Collection(['a', 'b', 'c']))->combine([1, 2, 3])->all();
});

probe('X20 union lets the left operand win, null value included', "['a'=>null] + ['a'=>1]", function () {
    return ['nullWins' => ['a' => null] + ['a' => 1], 'ints' => (new Collection([10, 20]))->union([1, 1, 50, 60])->all()];
});

probe('X21 query casts booleans to 1/0', "Arr::query(['a'=>true,'b'=>false])", function () {
    return ['bools' => Arr::query(['a' => true, 'b' => false]), 'list' => Arr::query(['a', 'b'])];
});

probe('X22 CSS helpers emit the value for numeric keys', "Arr::toCssClasses(['font-bold','text-red'])", function () {
    return [
        'classes' => Arr::toCssClasses(['font-bold', 'text-red']),
        'styles' => Arr::toCssStyles(['color:red', 'font-size:14px']),
        'conditional' => Arr::toCssClasses(['font-bold', 'hidden' => false, 'active' => true]),
    ];
});

probe('X23 random throws before the empty guard', 'Arr::random([],1)', function () {
    return Arr::random([], 1);
});

probe('X24 random preserveKeys defaults to false', 'Arr::random([10,20,30,40],2)', function () {
    $reindexed = Arr::random(nums(), 2);
    $preserved = Arr::random(nums(), 2, true);

    // Which keys get drawn is CSPRNG-driven; only the key SHAPE is stable.
    return [
        'keys' => array_keys($reindexed),
        'preserved_count' => count($preserved),
        'preserved_keys_are_original' => array_values(
            array_diff(array_keys($preserved), array_keys(nums()))
        ) === [],
    ];
});

probe('X25 only accepts a bare key and null', 'Arr::only([10,20,30,40],1)', function () {
    return [
        'bare' => Arr::only(nums(), 1),
        'null' => Arr::only(nums(), null),
        'list' => Arr::only(nums(), [1, 3]),
    ];
});

probe('X26 get/has/exists resolve a literal dotted key first', "Arr::get(['a.b'=>'literal','a'=>['b'=>'nested']],'a.b')", function () {
    $data = ['a.b' => 'literal', 'a' => ['b' => 'nested']];

    return [
        'get' => Arr::get($data, 'a.b'),
        'has' => Arr::has($data, 'a.b'),
        'exists' => Arr::exists($data, 'a.b'),
        'getList' => Arr::get(nums(), 2),
        'hasList' => Arr::has(nums(), 2),
        'existsList' => Arr::exists(nums(), 2),
    ];
});

probe('X27 pluck supports wildcard and array paths', "Arr::pluck(...,'name')", function () {
    $records = [['id' => 3, 'name' => 'c'], ['id' => 1, 'name' => 'a'], ['id' => 2, 'name' => 'b']];
    $nested = [['posts' => [['title' => 'p1'], ['title' => 'p2']]]];

    return [
        'plain' => Arr::pluck($records, 'name'),
        'keyed' => Arr::pluck($records, 'name', 'id'),
        'wildcard' => Arr::pluck($nested, 'posts.*.title'),
    ];
});

probe('X28 sort accepts multi-key and [key, direction] descriptors', 'Arr::sort(..., [...])', function () {
    $records = [['id' => 3, 'name' => 'c'], ['id' => 1, 'name' => 'a'], ['id' => 2, 'name' => 'b']];

    return [
        'byKey' => array_values(Arr::sort($records, 'id')),
        'descriptor' => array_values(Arr::sort($records, [['id', false]])),
        'plain' => Arr::sort([30, 10, 20]),
        'empty' => Arr::sort([3, 1, 2], []),
    ];
});

probe('X29 flatten defaults to INF', 'Arr::flatten([1,[2,[3]]])', function () {
    return [
        'default' => Arr::flatten([1, [2, [3]]]),
        'depth1' => Arr::flatten([1, [2, [3]]], 1),
        'depth2' => Arr::flatten([1, [2, [3]]], 2),
    ];
});

probe('X30 mapWithKeys returns one plain container', "Arr::mapWithKeys(...)", function () {
    $records = [['id' => 3, 'name' => 'c'], ['id' => 1, 'name' => 'a'], ['id' => 2, 'name' => 'b']];

    return [
        'stringKeys' => Arr::mapWithKeys($records, fn ($i) => [$i['name'] => $i['id']]),
        'numericKeys' => Arr::mapWithKeys($records, fn ($i) => [$i['id'] => $i['name']]),
    ];
});

probe('keys/values over the same fixture', 'collect([10,20,30,40])->keys()', function () {
    return ['keys' => (new Collection(nums()))->keys()->all(), 'values' => (new Collection(nums()))->values()->all()];
});

probe('reverse over the same fixture', 'collect([10,20,30,40])->reverse()', function () {
    return (new Collection(nums()))->reverse()->all();
});

probe('pull removes and returns the value', 'collect([10,20,30,40])->pull(1)', function () {
    $c = new Collection(nums());
    $pulled = $c->pull(1);

    return ['pulled' => $pulled, 'after' => $c->all()];
});

probe('undot rebuilds the nested list', "Arr::undot(['0'=>'a','1.0'=>'b','1.1'=>'c'])", function () {
    return Arr::undot(['0' => 'a', '1.0' => 'b', '1.1' => 'c']);
});

probe('sortDesc over the same fixture', 'collect([30,10,20])->sortDesc()', function () {
    return (new Collection([30, 10, 20]))->sortDesc()->all();
});

probe('diffAssocUsing / diffKeysUsing with a real comparator', 'array_diff_uassoc / array_diff_ukey', function () {
    $cmp = fn ($a, $b) => $a <=> $b;

    return [
        'assoc' => array_diff_uassoc(nums(), [10, 999, 30, 40], $cmp),
        'keys' => array_diff_ukey(nums(), [1 => 'x', 3 => 'y'], $cmp),
    ];
});

probe('intersectAssoc / intersectAssocUsing / intersectByKeys', 'array_intersect_assoc family', function () {
    $cmp = fn ($a, $b) => $a <=> $b;

    return [
        'assoc' => array_intersect_assoc(nums(), [10, 999, 30]),
        'assocUsing' => array_intersect_uassoc(nums(), [10, 999, 30], $cmp),
        'byKeys' => array_intersect_key(nums(), [1 => 'x', 3 => 'y']),
    ];
});

emit();
