<?php

/**
 * Ground truth for Arr::pluck().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Keeps PHP's deprecation notices off stdout, where they would corrupt emit()'s JSON.
error_reporting(E_ALL & ~E_DEPRECATED);

probe('Arr::pluck wildcard path', 'Arr::pluck($d, "users.*.first")', function () {
    $d = [
        'a' => ['account' => 'a', 'users' => [['first' => 'taylor']]],
        'b' => ['account' => 'b', 'users' => [['first' => 'abigail'], ['first' => 'dayle']]],
    ];

    return Arr::pluck($d, 'users.*.first');
});

probe('Arr::pluck wildcard + key', 'Arr::pluck($d, "users.*.first", "account")', function () {
    $d = [
        'a' => ['account' => 'a', 'users' => [['first' => 'taylor']]],
        'b' => ['account' => 'b', 'users' => [['first' => 'abigail'], ['first' => 'dayle']]],
    ];

    return Arr::pluck($d, 'users.*.first', 'account');
});

probe('Arr::pluck array path', 'Arr::pluck($d, ["developer","name"])', function () {
    $d = ['a' => ['developer' => ['name' => 'Taylor']], 'b' => ['developer' => ['name' => 'Abigail']]];

    return Arr::pluck($d, ['developer', 'name']);
});

probe('Arr::pluck null value keeps the item', 'Arr::pluck($d, null, "name")', function () {
    return Arr::pluck(['a' => ['name' => 'Taylor', 'role' => 'dev']], null, 'name');
});

probe('Arr::pluck missing path', 'Arr::pluck($d, "foo")', function () {
    return Arr::pluck(['a' => ['name' => 'x'], 'b' => ['name' => 'y']], 'foo');
});

// Pins PHP's answer for a missing key field against an explicit null key, where a JS key cast would give "null".
probe('Arr::pluck — missing key field vs explicit null key', 'Arr::pluck($u, "name", "id")', function () {
    $u = [
        'user1' => ['name' => 'John'],       // no 'id' field
        'user2' => ['name' => 'Jane', 'id' => null], // 'id' present but null
    ];

    return Arr::pluck($u, 'name', 'id');
});

// ---- values the arr/collection review found diverging from PHP

// data_get()'s "*" arm gates on is_iterable(), so a keyed and a list outer array expand an assoc inner value alike.
probe('Arr::pluck wildcard over an associative (object-shaped) target, string-keyed outer', 'Arr::pluck(["a"=>$shape], "meta.*.v")', function () {
    $shape = ['meta' => ['x' => ['v' => 1], 'y' => ['v' => 2]]];

    return Arr::pluck(['a' => $shape], 'meta.*.v');
});

probe('Arr::pluck wildcard over an associative (object-shaped) target, list outer', 'Arr::pluck([$shape], "meta.*.v")', function () {
    $shape = ['meta' => ['x' => ['v' => 1], 'y' => ['v' => 2]]];

    return Arr::pluck([$shape], 'meta.*.v');
});

// Minor 7: PHP casts a boolean array key to int (true -> 1, false -> 0),
// not to the string "true"/"false".
probe('Arr::pluck — boolean key casts to int, not string', 'Arr::pluck($u, "name", "flag")', function () {
    $u = [
        'a' => ['flag' => true, 'name' => 'X'],
        'b' => ['flag' => false, 'name' => 'Y'],
    ];

    return Arr::pluck($u, 'name', 'flag');
});

probe('pluck wildcard over a non-iterable', 'Arr::pluck([["meta"=>"x"]], "meta.*.v")', function () {
    return [
        'scalar_string' => Arr::pluck([['meta' => 'not-iterable']], 'meta.*.v'),
        'null' => Arr::pluck([['meta' => null]], 'meta.*.v'),
        'int' => Arr::pluck([['meta' => 5]], 'meta.*.v'),
        'assoc_target' => Arr::pluck(['a' => ['meta' => 'not-iterable']], 'meta.*.v'),
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

// ---- pluck
$data = [
    'post-1' => ['comments' => ['tags' => ['#foo', '#bar']]],
    'post-2' => ['comments' => ['tags' => ['#baz']]],
];
probe('pluck-comments', "Arr::pluck(\$data, 'comments')", fn () => Arr::pluck($data, 'comments'));
probe('pluck-comments.tags', "Arr::pluck(\$data, 'comments.tags')", fn () => Arr::pluck($data, 'comments.tags'));
probe('pluck-foo', "Arr::pluck(\$data, 'foo')", fn () => Arr::pluck($data, 'foo'));
probe('pluck-foo.bar', "Arr::pluck(\$data, 'foo.bar')", fn () => Arr::pluck($data, 'foo.bar'));

$nk = ['a' => ['user' => ['taylor', 'otwell']], 'b' => ['user' => ['dayle', 'rees']]];
probe('pluck-nested-user.0', "Arr::pluck(\$nk, 'user.0')", fn () => Arr::pluck($nk, 'user.0'));
probe('pluck-nested-arr-user-0str', "Arr::pluck(\$nk, ['user', '0'])", fn () => Arr::pluck($nk, ['user', '0']));
probe('pluck-nested-user.1-by-user.0', "Arr::pluck(\$nk, 'user.1', 'user.0')", fn () => Arr::pluck($nk, 'user.1', 'user.0'));
probe('pluck-nested-arr-1-by-0-str', "Arr::pluck(\$nk, ['user', '1'], ['user', '0'])", fn () => Arr::pluck($nk, ['user', '1'], ['user', '0']));

$na = [
    'x' => ['account' => 'a', 'users' => [['first' => 'taylor', 'last' => 'otwell', 'email' => 'taylorotwell@gmail.com']]],
    'y' => ['account' => 'b', 'users' => [['first' => 'abigail', 'last' => 'otwell'], ['first' => 'dayle', 'last' => 'rees']]],
];
probe('pluck-wildcard-email', "Arr::pluck(\$na, 'users.*.email')", fn () => Arr::pluck($na, 'users.*.email'));

$ao = ['a' => (object) ['name' => 'taylor', 'email' => 'foo'], 'b' => ['name' => 'dayle', 'email' => 'bar']];
probe('pluck-obj-and-array-rows-name', "Arr::pluck(\$ao, 'name')", fn () => Arr::pluck($ao, 'name'));
probe('pluck-obj-and-array-rows-email-by-name', "Arr::pluck(\$ao, 'email', 'name')", fn () => Arr::pluck($ao, 'email', 'name'));
probe('pluck-with-keys-null-assoc', "Arr::pluck(['a'=>['name'=>'Taylor','role'=>'developer'],'b'=>['name'=>'Abigail','role'=>'developer']], null, 'name')", fn () => Arr::pluck(['a' => ['name' => 'Taylor', 'role' => 'developer'], 'b' => ['name' => 'Abigail', 'role' => 'developer']], null, 'name'));

$pluckRows = [2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']];
$pluckColliding = [2 => ['n' => 'c', 'k' => 'same'], 0 => ['n' => 'a', 'k' => 'same'], 1 => ['n' => 'b', 'k' => 'other']];
probe('pluck-out-of-order', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], 'n')", fn () => arrayablePairs(Arr::pluck($pluckRows, 'n')));
probe('pluck-out-of-order-keyed', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], 'n', 'k')", fn () => arrayablePairs(Arr::pluck($pluckRows, 'n', 'k')));
probe('pluck-out-of-order-keyed-collision', "Arr::pluck([2 => ['n' => 'c', 'k' => 'same'], 0 => ['n' => 'a', 'k' => 'same'], 1 => ['n' => 'b', 'k' => 'other']], 'n', 'k')", fn () => arrayablePairs(Arr::pluck($pluckColliding, 'n', 'k')));
probe('pluck-mixed', "Arr::pluck(['x' => ['n' => 'X'], 0 => ['n' => 'Z'], 'y' => ['n' => 'Y']], 'n')", fn () => arrayablePairs(Arr::pluck(['x' => ['n' => 'X'], 0 => ['n' => 'Z'], 'y' => ['n' => 'Y']], 'n')));
probe('pluck-collision', "Arr::pluck([1 => ['n' => 'a'], 0 => ['n' => 'z'], '1' => ['n' => 'b']], 'n')", fn () => arrayablePairs(Arr::pluck([1 => ['n' => 'a'], 0 => ['n' => 'z'], '1' => ['n' => 'b']], 'n')));
probe('pluck-out-of-order-whole-items-keyed', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], null, 'k')", fn () => arrayablePairs(Arr::pluck($pluckRows, null, 'k')));
probe('pluck-out-of-order-callback-order', "Arr::pluck([2 => ['n' => 'c', 'k' => 'kc'], 0 => ['n' => 'a', 'k' => 'ka'], 1 => ['n' => 'b', 'k' => 'kb']], fn (\$item) => \$item['n'], fn (\$item) => \$item['k']) => 'v:' . \$item['n'] per value call, 'k:' . \$item['n'] per key call", function () use ($pluckRows) {
    $seen = [];

    Arr::pluck(
        $pluckRows,
        function ($item) use (&$seen) {
            $seen[] = 'v:' . $item['n'];

            return $item['n'];
        },
        function ($item) use (&$seen) {
            $seen[] = 'k:' . $item['n'];

            return $item['k'];
        },
    );

    return $seen;
});

emit();
