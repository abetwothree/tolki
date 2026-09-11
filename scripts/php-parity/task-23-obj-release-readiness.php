<?php

/**
 * Ground truth for docs/superpowers/plans/2026-09-10-tolki-obj-release-readiness.md.
 * Run: pnpm php:parity
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== ArrTest parity: testAccessible .. testHasAnyMethod
// --- add
probe('add-empty-dotted', "Arr::add([], 'developer.name', 'Ferid')", fn () => Arr::add([], 'developer.name', 'Ferid'));
probe('add-int-key', "Arr::add([], 1, 'hAz')", fn () => Arr::add([], 1, 'hAz'));
probe('add-float-key', "Arr::add([], 1.1, 'hAz')", fn () => Arr::add([], 1.1, 'hAz'));

// --- push
probe('push-dotted-chain', "push office.furniture Desk; then Chair, Lamp", function () {
    $a = [];
    Arr::push($a, 'office.furniture', 'Desk');
    $first = $a;
    Arr::push($a, 'office.furniture', 'Chair', 'Lamp');

    return ['first' => $first, 'second' => $a];
});
probe('push-boolean-at-dotted', "Arr::push(['foo' => ['bar' => false]], 'foo.bar', 'baz')", function () {
    $a = ['foo' => ['bar' => false]];

    return Arr::push($a, 'foo.bar', 'baz');
});

// --- collapse (assoc groups with integer keys: array_merge renumbers)
probe('collapse-int-keys', "Arr::collapse(['g1' => ['a' => 1, 5 => 'x'], 'g2' => [5 => 'y']])", fn () => Arr::collapse(['g1' => ['a' => 1, 5 => 'x'], 'g2' => [5 => 'y']]));
probe('collapse-string-keys', "Arr::collapse(['a' => ['x' => 1, 'y' => 2], 'b' => ['x' => 3, 'z' => 4]])", fn () => Arr::collapse(['a' => ['x' => 1, 'y' => 2], 'b' => ['x' => 3, 'z' => 4]]));
probe('collapse-assoc-of-lists', "Arr::collapse(['a' => [1, 2], 'b' => [3]])", fn () => Arr::collapse(['a' => [1, 2], 'b' => [3]]));

// --- crossJoin (string-keyed spread is the analogue of an obj crossJoin argument)
probe('crossJoin-no-args', 'Arr::crossJoin()', fn () => Arr::crossJoin());
probe('crossJoin-string-spread', "Arr::crossJoin(...['size' => ['S','M'], 'color' => ['red','blue']])", fn () => Arr::crossJoin(...['size' => ['S', 'M'], 'color' => ['red', 'blue']]));
probe('crossJoin-string-spread-empty', "Arr::crossJoin(...['a' => [], 'b' => ['x']])", fn () => Arr::crossJoin(...['a' => [], 'b' => ['x']]));

// --- divide
probe('divide-empty-and-int-key', "Arr::divide(['' => 'Null', 1 => 'one'])", fn () => Arr::divide(['' => 'Null', 1 => 'one']));
probe('divide-int-key-types', "array_map('gettype', Arr::divide(['' => 'Null', 1 => 'one'])[0])", fn () => array_map('gettype', Arr::divide(['' => 'Null', 1 => 'one'])[0]));

// --- dot
probe('dot-int-key', 'Arr::dot([10 => 100])', fn () => Arr::dot([10 => 100]));
probe('dot-nested-int-key', "Arr::dot(['foo' => [10 => 100]])", fn () => Arr::dot(['foo' => [10 => 100]]));
probe('dot-empty-leaf', "Arr::dot(['foo' => []])", fn () => Arr::dot(['foo' => []]));
probe('dot-nested-empty-leaf', "Arr::dot(['foo' => ['bar' => []]])", fn () => Arr::dot(['foo' => ['bar' => []]]));
probe('dot-mixed-keys', "Arr::dot(['foo', 'foo' => ['bar' => 'baz', 'baz' => ['a' => 'b']]])", fn () => Arr::dot(['foo', 'foo' => ['bar' => 'baz', 'baz' => ['a' => 'b']]]));
probe('dot-prepend-no-dot', "Arr::dot(['name' => 'John'], 'user')", fn () => Arr::dot(['name' => 'John'], 'user'));
probe('dot-prepend-no-dot-depth', "Arr::dot(['user' => ['name' => 'Taylor']], 'prefix', 1)", fn () => Arr::dot(['user' => ['name' => 'Taylor']], 'prefix', 1));
probe('dot-prepend-with-dot-depth', "Arr::dot(['user' => ['name' => 'Taylor']], 'prefix.', 1)", fn () => Arr::dot(['user' => ['name' => 'Taylor']], 'prefix.', 1));
probe('dot-prepend-trailing-dots', "Arr::dot(['a' => 1], 'prefix...')", fn () => Arr::dot(['a' => 1], 'prefix...'));
probe('dot-list-prepend-no-dot', "Arr::dot(['x', ['y']], 'user')", fn () => Arr::dot(['x', ['y']], 'user'));
probe('dot-list-of-assoc', "Arr::dot([['a' => 1], ['b' => ['c' => 2]]])", fn () => Arr::dot([['a' => 1], ['b' => ['c' => 2]]]));

// --- undot
probe('undot-mixed-keys', "Arr::undot(['foo', 'foo.bar' => 'baz', 'foo.baz' => ['a' => 'b']])", fn () => Arr::undot(['foo', 'foo.bar' => 'baz', 'foo.baz' => ['a' => 'b']]));

// --- except
probe('except-int-key', "Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2)", fn () => Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2));
probe('except-float-key', "Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2.5)", fn () => Arr::except([1 => 'hAz', 2 => [5 => 'foo', 12 => 'baz']], 2.5));
probe('except-mixed-list', "Arr::except(fw, ['name', 'framework.name'])", fn () => Arr::except(['name' => 'taylor', 'framework' => ['language' => 'PHP', 'name' => 'Laravel']], ['name', 'framework.name']));

// --- exceptValues
probe('exceptValues-empty', "Arr::exceptValues([], 'foo')", fn () => Arr::exceptValues([], 'foo'));

// --- exists
probe('exists-null-value', "Arr::exists(['a' => null], 'a')", fn () => Arr::exists(['a' => null], 'a'));
probe('exists-int-miss', "Arr::exists(['a' => 1], 0)", fn () => Arr::exists(['a' => 1], 0));
probe('exists-no-dot-traversal', "Arr::exists(['user' => ['name' => 'John']], 'user.name')", fn () => Arr::exists(['user' => ['name' => 'John']], 'user.name'));
probe('exists-no-dot-traversal-miss', "Arr::exists(['user' => ['name' => 'John']], 'user.age')", fn () => Arr::exists(['user' => ['name' => 'John']], 'user.age'));
probe('exists-null-key-empty-string', "Arr::exists(['' => 1], null)", fn () => Arr::exists(['' => 1], null));
probe('exists-float-key', "Arr::exists(['1.5' => 1], 1.5)", fn () => Arr::exists(['1.5' => 1], 1.5));
probe('exists-literal-dotted', "Arr::exists(['user.name' => 'John'], 'user.name')", fn () => Arr::exists(['user.name' => 'John'], 'user.name'));

// --- whereNotNull on assoc
probe('whereNotNull-assoc-falsy', "Arr::whereNotNull(['a' => null, 'b' => 0, 'c' => false, 'd' => '', 'e' => null, 'f' => []])", fn () => Arr::whereNotNull(['a' => null, 'b' => 0, 'c' => false, 'd' => '', 'e' => null, 'f' => []]));

// --- first / last on assoc
probe('first-assoc-no-match', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v) => \$v > 300)", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300));
probe('first-assoc-closure-default', "Arr::first(assoc, fn > 300, fn () => 'baz')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300, fn () => 'baz'));
probe('first-assoc-falsy-match', "Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn (\$v) => \$v === 0)", fn () => Arr::first(['a' => 0, 'b' => 10, 'c' => 20], fn ($v) => $v === 0));
probe('last-assoc-key-callback', "Arr::last(['first' => 100, 'second' => 200, 'third' => 300], fn (\$v, \$k) => \$k !== 'third')", fn () => Arr::last(['first' => 100, 'second' => 200, 'third' => 300], fn ($v, $k) => $k !== 'third'));

// --- join
probe('join-assoc-two', "Arr::join(['a' => 'a', 'b' => 'b'], ', ', ' and ')", fn () => Arr::join(['a' => 'a', 'b' => 'b'], ', ', ' and '));

// --- get
probe('get-null-value', "Arr::get(['foo' => null], 'foo', 'default')", fn () => Arr::get(['foo' => null, 'bar' => ['baz' => null]], 'foo', 'default'));
probe('get-nested-null-value', "Arr::get(['bar' => ['baz' => null]], 'bar.baz', 'default')", fn () => Arr::get(['foo' => null, 'bar' => ['baz' => null]], 'bar.baz', 'default'));
probe('get-through-list', "Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.0.name')", fn () => Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.0.name'));
probe('get-through-list-2', "Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.1.name')", fn () => Arr::get(['products' => [['name' => 'desk'], ['name' => 'chair']]], 'products.1.name'));
probe('get-through-list-missing', "Arr::get(['products' => [['name' => 'desk']]], 'products.2.name', 'none')", fn () => Arr::get(['products' => [['name' => 'desk']]], 'products.2.name', 'none'));
probe('get-through-list-length', "Arr::get(['products' => [1, 2, 3]], 'products.length', 'none')", fn () => Arr::get(['products' => [1, 2, 3]], 'products.length', 'none'));
probe('get-through-list-leading-zero', "Arr::get(['products' => [1, 2, 3]], 'products.01', 'none')", fn () => Arr::get(['products' => [1, 2, 3]], 'products.01', 'none'));
probe('get-false', "Arr::get(false, 'foo', 'default')", fn () => Arr::get(false, 'foo', 'default'));
probe('get-empty-null-key', 'Arr::get([], null)', fn () => Arr::get([], null));
probe('get-empty-null-key-default', "Arr::get([], null, 'default')", fn () => Arr::get([], null, 'default'));
probe('get-empty-string-key', "Arr::get(['' => 'bar'], '')", fn () => Arr::get(['' => 'bar'], ''));
probe('get-dot-only-key', "Arr::get(['' => ['' => 'bar']], '.')", fn () => Arr::get(['' => ['' => 'bar']], '.'));
probe('get-through-null', "Arr::get(['parent' => ['products' => ['desk' => null]]], 'parent.products.desk.price')", fn () => Arr::get(['parent' => ['products' => ['desk' => null]]], 'parent.products.desk.price'));

// --- has
probe('has-null-value', "Arr::has(['foo' => null, 'bar' => ['baz' => null]], 'foo')", fn () => Arr::has(['foo' => null, 'bar' => ['baz' => null]], 'foo'));
probe('has-nested-null-value', "Arr::has(['foo' => null, 'bar' => ['baz' => null]], 'bar.baz')", fn () => Arr::has(['foo' => null, 'bar' => ['baz' => null]], 'bar.baz'));
foreach (['foo', 'bar', 'bar.baz', 'xxx', 'xxx.yyy', 'foo.xxx', 'bar.xxx'] as $k) {
    probe("has-plain-tens-{$k}", "Arr::has(['foo' => 10, 'bar' => ['baz' => 10]], '{$k}')", fn () => Arr::has(['foo' => 10, 'bar' => ['baz' => 10]], $k));
}
probe('has-assoc-null-key', "Arr::has(['a' => 1], null)", fn () => Arr::has(['a' => 1], null));
probe('has-false', "Arr::has(false, 'foo')", fn () => Arr::has(false, 'foo'));
probe('has-null-null', 'Arr::has(null, null)', fn () => Arr::has(null, null));
probe('has-empty-null', 'Arr::has([], null)', fn () => Arr::has([], null));
probe('has-through-list', "Arr::has(['products' => [['name' => 'desk']]], 'products.0.name')", fn () => Arr::has(['products' => [['name' => 'desk']]], 'products.0.name'));
probe('has-through-list-miss', "Arr::has(['products' => [['name' => 'desk']]], 'products.0.price')", fn () => Arr::has(['products' => [['name' => 'desk']]], 'products.0.price'));
probe('has-empty-string-key-null-in-list', "Arr::has(['' => 'some'], [null])", fn () => Arr::has(['' => 'some'], [null]));
probe('has-empty-key', "Arr::has(['' => 'some'], '')", fn () => Arr::has(['' => 'some'], ''));
probe('has-empty-key-list', "Arr::has(['' => 'some'], [''])", fn () => Arr::has(['' => 'some'], ['']));

// --- hasAny: does the stray third argument count?
probe('hasAny-stray-arg-hit', "Arr::hasAny(['name' => 'Taylor', 'email' => 'foo'], 'surname', 'email')", fn () => Arr::hasAny(['name' => 'Taylor', 'email' => 'foo'], 'surname', 'email'));

// --- typed getters: gettype wording for Arr::array
probe('array-list-value', "Arr::array(['string' => 'foo bar', 'array' => ['foo', 'bar']], 'array')", fn () => Arr::array(['string' => 'foo bar', 'array' => ['foo', 'bar']], 'array'));
probe('array-null-value', "Arr::array(['a' => null], 'a')", fn () => Arr::array(['a' => null], 'a'));
probe('array-int-value', "Arr::array(['a' => 5], 'a')", fn () => Arr::array(['a' => 5], 'a'));
probe('array-float-value', "Arr::array(['a' => 1.5], 'a')", fn () => Arr::array(['a' => 1.5], 'a'));
probe('array-bool-value', "Arr::array(['a' => true], 'a')", fn () => Arr::array(['a' => true], 'a'));
probe('array-missing-on-list', "Arr::array([['name' => 'John']], 'name')", fn () => Arr::array([['name' => 'John']], 'name'));
probe('string-int-value', "Arr::string(['string' => 'foo bar', 'integer' => 1234], 'integer')", fn () => Arr::string(['string' => 'foo bar', 'integer' => 1234], 'integer'));

// --- accessible / arrayable analogues
probe('accessible-datetime', 'Arr::accessible(new DateTime)', fn () => Arr::accessible(new DateTime));
probe('arrayable-datetime', 'Arr::arrayable(new DateTime)', fn () => Arr::arrayable(new DateTime));

// ==== ArrTest parity: gettype wording and accessible analogues
probe('exceptValues-assoc-strict', "Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true)", fn () => Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true));
probe('exceptValues-assoc-loose', "Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3])", fn () => Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3]));
probe('flatten-assoc-nulls', "Arr::flatten(['a' => ['#foo', null], 'b' => '#baz', 'c' => null])", fn () => Arr::flatten(['a' => ['#foo', null], 'b' => '#baz', 'c' => null]));
probe('last-assoc-no-match', "Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v) => \$v > 300)", fn () => Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300));
probe('last-assoc-closure-default', "Arr::last(assoc, fn > 300, fn () => 'baz')", fn () => Arr::last(['a' => 100, 'b' => 200, 'c' => 300], fn ($v) => $v > 300, fn () => 'baz'));
probe('first-assoc-key-callback', "Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn (\$v, \$k) => \$k !== 'a')", fn () => Arr::first(['a' => 100, 'b' => 200, 'c' => 300], fn ($v, $k) => $k !== 'a'));
probe('crossJoin-string-spread-3', "Arr::crossJoin(...['a' => [1, 2], 'b' => ['x'], 'c' => ['I', 'II']])", fn () => Arr::crossJoin(...['a' => [1, 2], 'b' => ['x'], 'c' => ['I', 'II']]));
probe('has-null-key-nonempty-assoc', "Arr::has(['a' => 1], [null, 'a'])", fn () => Arr::has(['a' => 1], [null, 'a']));

// ==== ArrTest parity: testEvery .. testPartition
// ---- only
probe('only-none-exist', "Arr::only(['name'=>'Desk','price'=>100], ['nonExistingKey'])", fn () => Arr::only(['name' => 'Desk', 'price' => 100], ['nonExistingKey']));
probe('only-mixed-int-as-string', "Arr::only([0=>'foo','bar'=>'baz'], '0')", fn () => Arr::only([0 => 'foo', 'bar' => 'baz'], '0'));
probe('only-mixed-string', "Arr::only([0=>'foo','bar'=>'baz'], 'bar')", fn () => Arr::only([0 => 'foo', 'bar' => 'baz'], 'bar'));

// ---- onlyValues
probe('onlyValues-empty-data', "Arr::onlyValues([], 'foo')", fn () => Arr::onlyValues([], 'foo'));
probe('onlyValues-empty-values-assoc', "Arr::onlyValues(['a'=>'foo','b'=>'bar'], [])", fn () => Arr::onlyValues(['a' => 'foo', 'b' => 'bar'], []));
probe('onlyValues-strict-numstr-assoc', "Arr::onlyValues(['a'=>1,'b'=>'1','c'=>2,'d'=>'2','e'=>3], [1,2,3], true)", fn () => Arr::onlyValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true));
probe('onlyValues-loose-numstr-assoc', "Arr::onlyValues(['a'=>1,'b'=>'1','c'=>2,'d'=>'2','e'=>3], [1,2,3])", fn () => Arr::onlyValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3]));

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

// ---- mapSpread
$ms = ['x' => [1, 'a'], 'y' => [2, 'b']];
probe('mapSpread-tuples', "Arr::mapSpread(\$ms, fn(\$n,\$c) => \"\$n-\$c\")", fn () => Arr::mapSpread($ms, fn ($n, $c) => "{$n}-{$c}"));
probe('mapSpread-tuples-key', "Arr::mapSpread(\$ms, fn(\$n,\$c,\$k) => \"\$n-\$c-\$k\")", fn () => Arr::mapSpread($ms, fn ($n, $c, $k) => "{$n}-{$c}-{$k}"));

// ---- prepend
probe('prepend-empty-key', "Arr::prepend(['one'=>1,'two'=>2], 0, '')", fn () => Arr::prepend(['one' => 1, 'two' => 2], 0, ''));
probe('prepend-null-key', "Arr::prepend(['one'=>1,'two'=>2], 0, null)", fn () => @Arr::prepend(['one' => 1, 'two' => 2], 0, null));
probe('prepend-existing-empty-key', "Arr::prepend(['one','two',''=>'three'], ['zero'], '')", fn () => Arr::prepend(['one', 'two', '' => 'three'], ['zero'], ''));
probe('prepend-existing-empty-key-null', "Arr::prepend(['one','two',''=>'three'], ['zero'], null)", fn () => @Arr::prepend(['one', 'two', '' => 'three'], ['zero'], null));
probe('prepend-existing-key-assoc', "Arr::prepend(['a'=>1,'b'=>2], 9, 'b')", fn () => Arr::prepend(['a' => 1, 'b' => 2], 9, 'b'));
probe('prepend-existing-key-assoc-keys', "array_keys(Arr::prepend(['a'=>1,'b'=>2], 9, 'b'))", fn () => array_keys(Arr::prepend(['a' => 1, 'b' => 2], 9, 'b')));

// ---- pull
probe('pull-nested-dotted-key', "Arr::pull(\$a=['emails'=>['joe@example.com'=>'Joe','jane@localhost'=>'Jane']], 'emails.joe@example.com')", function () {
    $a = ['emails' => ['joe@example.com' => 'Joe', 'jane@localhost' => 'Jane']];
    $v = Arr::pull($a, 'emails.joe@example.com');
    return ['value' => $v, 'array' => $a];
});

// ---- random
probe('random-empty-2', "Arr::random([], 2)", fn () => Arr::random([], 2));

// ---- set
probe('set-overwrite-nested', "set(['products'=>['desk'=>['price'=>100]]], 'products.desk.price', 200)", function () { $a = ['products' => ['desk' => ['price' => 100]]]; Arr::set($a, 'products.desk.price', 200); return $a; });
probe('set-scalar-intermediate', "set(['products'=>'desk'], 'products.desk.price', 200)", function () { $a = ['products' => 'desk']; Arr::set($a, 'products.desk.price', 200); return $a; });
probe('set-int-key', "set([1=>'test'], 1, 'hAz')", function () { $a = [1 => 'test']; return Arr::set($a, 1, 'hAz'); });
probe('set-int-key-string', "set([1=>'test'], '1', 'hAz')", function () { $a = [1 => 'test']; return Arr::set($a, '1', 'hAz'); });
probe('set-list-input', "set([0=>'products'], 'products.desk.price', 200)", function () { $a = ['products']; Arr::set($a, 'products.desk.price', 200); return $a; });

// ---- shuffle
probe('shuffle-assoc-keys', "array_keys(Arr::shuffle(['a'=>1,'b'=>2,'c'=>3]))", fn () => array_keys(Arr::shuffle(['a' => 1, 'b' => 2, 'c' => 3])));
probe('shuffle-assoc-values-sorted', "sorted values", function () { $s = Arr::shuffle(['a' => 1, 'b' => 2, 'c' => 3]); sort($s); return $s; });

// ---- sole
probe('sole-rows-callback', "Arr::sole(['a'=>['name'=>'foo'],'b'=>['name'=>'bar']], fn(\$v)=>\$v['name']==='foo')", fn () => Arr::sole(['a' => ['name' => 'foo'], 'b' => ['name' => 'bar']], fn (array $value) => $value['name'] === 'foo'));
probe('sole-assoc-multi-callback', "Arr::sole(['a'=>'baz','b'=>'foo','c'=>'baz'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['a' => 'baz', 'b' => 'foo', 'c' => 'baz'], fn ($v) => $v === 'baz'));

// ---- sort
probe('sort-rows-natural', "Arr::sort(['a'=>['name'=>'Desk'],'b'=>['name'=>'Chair']])", fn () => Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']]));
probe('sort-rows-natural-keys', "array_keys(...)", fn () => array_keys(Arr::sort(['a' => ['name' => 'Desk'], 'b' => ['name' => 'Chair']])));
probe('sortDesc-rows-natural', "Arr::sortDesc(['a'=>['name'=>'Chair'],'b'=>['name'=>'Desk']])", fn () => Arr::sortDesc(['a' => ['name' => 'Chair'], 'b' => ['name' => 'Desk']]));
probe('sortDesc-rows-natural-keys', "array_keys(...)", fn () => array_keys(Arr::sortDesc(['a' => ['name' => 'Chair'], 'b' => ['name' => 'Desk']])));

$sbm = [
    'a' => ['name' => 'John', 'age' => 8, 'meta' => ['key' => 3]],
    'b' => ['name' => 'John', 'age' => 10, 'meta' => ['key' => 5]],
    'c' => ['name' => 'Dave', 'age' => 10, 'meta' => ['key' => 3]],
    'd' => ['name' => 'John', 'age' => 8, 'meta' => ['key' => 2]],
];
probe('sortByMany-keys', "Arr::sort(\$sbm, ['name','age','meta.key'])", fn () => Arr::sort($sbm, ['name', 'age', 'meta.key']));
probe('sortByMany-keys-order', "array_keys", fn () => array_keys(Arr::sort($sbm, ['name', 'age', 'meta.key'])));
probe('sortByMany-order', "Arr::sort(\$sbm, ['name',['age',false],['meta.key',true]])", fn () => array_keys(Arr::sort($sbm, ['name', ['age', false], ['meta.key', true]])));
probe('sortByMany-callable', "Arr::sort(\$sbm, [cmp name, cmp age desc, ['meta.key', true]])", fn () => Arr::sort($sbm, [
    fn ($a, $b) => $a['name'] <=> $b['name'],
    fn ($a, $b) => $b['age'] <=> $a['age'],
    ['meta.key', true],
]));
probe('sortByMany-callable-keys', "array_keys", fn () => array_keys(Arr::sort($sbm, [
    fn ($a, $b) => $a['name'] <=> $b['name'],
    fn ($a, $b) => $b['age'] <=> $a['age'],
    ['meta.key', true],
])));

// ---- sortRecursive (literal from ArrTest)
$sr = [
    'users' => [
        ['name' => 'joe', 'mail' => 'joe@example.com', 'numbers' => [2, 1, 0]],
        ['name' => 'jane', 'age' => 25],
    ],
    'repositories' => [['id' => 1], ['id' => 0]],
    20 => [2, 1, 0],
    30 => [2 => 'a', 1 => 'b', 0 => 'c'],
];
probe('sortRecursive-literal', "Arr::sortRecursive(\$sr)", fn () => Arr::sortRecursive($sr));
probe('sortRecursive-numbers-lexical', "Arr::sortRecursive(['a'=>[10,9,1]])", fn () => Arr::sortRecursive(['a' => [10, 9, 1]]));
probe('sortRecursive-list-of-objects', "Arr::sortRecursive(['r'=>[['id'=>2],['id'=>10],['id'=>1]]])", fn () => Arr::sortRecursive(['r' => [['id' => 2], ['id' => 10], ['id' => 1]]]));

$srd = [
    'empty' => [],
    'nested' => ['level1' => ['level2' => ['level3' => [2, 3, 1]], 'values' => [4, 5, 6]]],
    'mixed' => ['a' => 1, 2 => 'b', 'c' => 3, 1 => 'd'],
    'numbered_index' => [1 => 'e', 3 => 'c', 4 => 'b', 5 => 'a', 2 => 'd'],
];
probe('sortRecursiveDesc-literal', "Arr::sortRecursiveDesc(\$srd)", fn () => Arr::sortRecursiveDesc($srd));
probe('sortRecursiveDesc-numbers', "Arr::sortRecursiveDesc(['a'=>[1,9,10]])", fn () => Arr::sortRecursiveDesc(['a' => [1, 9, 10]]));

// ---- where
probe('whereKey-numeric', "Arr::where(['10'=>1,'foo'=>3,20=>2], fn(\$v,\$k)=>is_numeric(\$k))", fn () => Arr::where(['10' => 1, 'foo' => 3, 20 => 2], fn ($v, $k) => is_numeric($k)));

// ---- forget
$f = function ($array, $keys) { Arr::forget($array, $keys); return $array; };
probe('forget-null', "forget(products, null)", fn () => $f(['products' => ['desk' => ['price' => 100]]], null));
probe('forget-empty-array', "forget(products, [])", fn () => $f(['products' => ['desk' => ['price' => 100]]], []));
probe('forget-products.desk', "forget(products, 'products.desk')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.desk'));
probe('forget-products.desk.price', "forget(products, 'products.desk.price')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.desk.price'));
probe('forget-missing-intermediate', "forget(products, 'products.final.price')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.final.price'));
probe('forget-shop', "forget(['shop'=>['cart'=>[150=>0]]], 'shop.final.cart')", fn () => $f(['shop' => ['cart' => [150 => 0]]], 'shop.final.cart'));
probe('forget-taxes', "forget(..., 'products.desk.price.taxes')", fn () => $f(['products' => ['desk' => ['price' => ['original' => 50, 'taxes' => 60]]]], 'products.desk.price.taxes'));
probe('forget-final-taxes', "forget(..., 'products.desk.final.taxes')", fn () => $f(['products' => ['desk' => ['price' => ['original' => 50, 'taxes' => 60]]]], 'products.desk.final.taxes'));
probe('forget-empty-string-sibling', "forget(['products'=>['desk'=>['price'=>50],''=>'something']], ['products.amount.all','products.desk.price'])", fn () => $f(['products' => ['desk' => ['price' => 50], '' => 'something']], ['products.amount.all', 'products.desk.price']));
probe('forget-emails-nested', "forget(emails, ['emails.joe@example.com','emails.jane@localhost'])", fn () => $f(['emails' => ['joe@example.com' => ['name' => 'Joe'], 'jane@localhost' => ['name' => 'Jane']]], ['emails.joe@example.com', 'emails.jane@localhost']));
probe('forget-int-key', "forget(['name'=>'hAz','1'=>'test',2=>'bAz'], 1)", fn () => $f(['name' => 'hAz', '1' => 'test', 2 => 'bAz'], 1));
probe('forget-int-key-string', "forget(['name'=>'hAz','1'=>'test',2=>'bAz'], '1')", fn () => $f(['name' => 'hAz', '1' => 'test', 2 => 'bAz'], '1'));
probe('forget-float', "forget([2=>[1=>'products',3=>'users']], 2.3)", fn () => $f([2 => [1 => 'products', 3 => 'users']], 2.3));
probe('forget-float-string', "forget([2=>[1=>'products',3=>'users']], '2.3')", fn () => $f([2 => [1 => 'products', 3 => 'users']], '2.3'));
probe('forget-joe-top', "forget(['joe@example.com'=>'Joe','jane@example.com'=>'Jane'], 'joe@example.com')", fn () => $f(['joe@example.com' => 'Joe', 'jane@example.com' => 'Jane'], 'joe@example.com'));

// ---- from
probe('from-stdclass', "Arr::from((object)['foo'=>'bar'])", fn () => Arr::from((object) ['foo' => 'bar']));

// ---- wrap
probe('wrap-empty-string', "Arr::wrap('')", fn () => Arr::wrap(''));
probe('wrap-false', "Arr::wrap(false)", fn () => Arr::wrap(false));
probe('wrap-zero', "Arr::wrap(0)", fn () => Arr::wrap(0));

// ---- select
$sel = ['a' => ['name' => 'Taylor', 'role' => 'Developer', 'age' => 1], 'b' => ['name' => 'Abigail', 'role' => 'Infrastructure', 'age' => 2]];
probe('select-name-age', "Arr::select(\$sel, ['name','age'])", fn () => Arr::select($sel, ['name', 'age']));
probe('select-missing', "Arr::select(\$sel, 'nonExistingKey')", fn () => Arr::select($sel, 'nonExistingKey'));
probe('select-null', "Arr::select(\$sel, null)", fn () => Arr::select($sel, null));

// ---- prependKeysWith
probe('prependKeysWith-literal', "Arr::prependKeysWith([...], 'test.')", fn () => Arr::prependKeysWith(['id' => '123', 'data' => '456', 'list' => [1, 2, 3], 'meta' => ['key' => 1]], 'test.'));

// ---- keyBy
probe('keyBy-assoc-rows', "Arr::keyBy(['x'=>['id'=>'123','data'=>'abc'],'y'=>['id'=>'345','data'=>'def'],'z'=>['id'=>'498','data'=>'hgi']], 'id')", fn () => Arr::keyBy(['x' => ['id' => '123', 'data' => 'abc'], 'y' => ['id' => '345', 'data' => 'def'], 'z' => ['id' => '498', 'data' => 'hgi']], 'id'));

// ---- map null values
probe('map-null-values', "Arr::map(['first'=>'taylor','last'=>null], fn(\$v,\$k)=>\$k.'-'.\$v)", fn () => Arr::map(['first' => 'taylor', 'last' => null], static fn ($value, $key) => $key . '-' . $value));

// ==== ArrTest parity: follow-up rows
probe('sole-none', "Arr::sole(['a'=>'foo'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['a' => 'foo'], fn ($v) => $v === 'baz'));
probe('sole-multi-list', "Arr::sole(['baz','foo','baz'], fn(\$v)=>\$v==='baz')", fn () => Arr::sole(['baz', 'foo', 'baz'], fn ($v) => $v === 'baz'));
probe('mapSpread-assoc-rows', "Arr::mapSpread(['user1'=>['name'=>'John','age'=>25]], fn(\$n,\$a)=>\"\$n is \$a\")", fn () => Arr::mapSpread(['user1' => ['name' => 'John', 'age' => 25]], fn ($n, $a) => "$n is $a"));
probe('mapSpread-scalar-row', "Arr::mapSpread(['item2'=>'simple_value'], fn(...\$a)=>count(\$a))", fn () => Arr::mapSpread(['item2' => 'simple_value'], fn (...$a) => count($a)));
probe('shuffle-empty', "Arr::shuffle([])", fn () => Arr::shuffle([]));
probe('prepend-zero-key-order', "array_keys(Arr::prepend(['one'=>1,'two'=>2], 0, 'zero'))", fn () => array_keys(Arr::prepend(['one' => 1, 'two' => 2], 0, 'zero')));
probe('wrap-stdclass-is-wrapped', "Arr::wrap(new stdClass) is list", fn () => array_is_list(Arr::wrap(new stdClass)) && count(Arr::wrap(new stdClass)) === 1);
probe('wrap-datetime', "Arr::wrap(new DateTime) count", fn () => count(Arr::wrap(new DateTime('@0'))));
probe('map-by-reference-strrev', "Arr::map(['first'=>'taylor','last'=>'otwell'], 'strrev')", fn () => Arr::map(['first' => 'taylor', 'last' => 'otwell'], 'strrev'));
probe('mapWithKeys-assoc-rows', "Arr::mapWithKeys(['b'=>[...],'c'=>[...],'d'=>[...]], fn(\$p)=>[\$p['name']=>\$p['type']])", fn () => Arr::mapWithKeys(['b' => ['name' => 'Blastoise', 'type' => 'Water', 'idx' => 9], 'c' => ['name' => 'Charmander', 'type' => 'Fire', 'idx' => 4], 'd' => ['name' => 'Dragonair', 'type' => 'Dragon', 'idx' => 148]], fn ($p) => [$p['name'] => $p['type']]));
probe('pluck-with-keys-null-assoc', "Arr::pluck(['a'=>['name'=>'Taylor','role'=>'developer'],'b'=>['name'=>'Abigail','role'=>'developer']], null, 'name')", fn () => Arr::pluck(['a' => ['name' => 'Taylor', 'role' => 'developer'], 'b' => ['name' => 'Abigail', 'role' => 'developer']], null, 'name'));

// ==== ArrTest parity: follow-up rows
probe('prepend-list-null-empty-key', "prepend(['one','two'], null, '')", fn () => Arr::prepend(['one', 'two'], null, ''));
probe('prepend-list-array-key', "prepend(['one','two'], ['zero'], 'key')", fn () => Arr::prepend(['one', 'two'], ['zero'], 'key'));
probe('prepend-list-array-empty-key', "prepend(['one','two'], ['zero'], '')", fn () => Arr::prepend(['one', 'two'], ['zero'], ''));

// ==== ArrTest parity: follow-up rows
probe('sortRecursive-key-case', "array_keys(Arr::sortRecursive(['b'=>1,'B'=>2,'a'=>3,'_x'=>4]))", fn () => array_keys(Arr::sortRecursive(['b' => 1, 'B' => 2, 'a' => 3, '_x' => 4])));
probe('sortRecursive-list-strings-case', "Arr::sortRecursive(['l'=>['b','B','a']])", fn () => Arr::sortRecursive(['l' => ['b', 'B', 'a']]));

// ==== CollectionTest parity
// ---- literal ports (assoc / int-keyed non-list)
probe('C1 values resets int keys', 'C1 values resets int keys', fn () => (new Collection([1 => 'a', 2 => 'b', 3 => 'c']))->values()->all());
probe('C2 flip one', 'C2 flip one', fn () => (new Collection(['name' => 'taylor']))->flip()->all());
probe('C3 flip two', 'C3 flip two', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->flip()->all());
probe('C4 flip empty', 'C4 flip empty', fn () => (new Collection)->flip()->all());
probe('C5 reverse assoc', 'C5 reverse assoc', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->reverse()->all());
probe('C6 diffAssoc testDiffAssoc', 'C6 diffAssoc testDiffAssoc', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello', 'not_affected' => 'value']))->diffAssoc(new Collection(['id' => 123, 'foo_bar' => 'Hello', 'not_affected' => 'value']))->all());
probe('C7 diffAssoc case keys', 'C7 diffAssoc case keys', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->diffAssoc(new Collection(['A' => 'green', 'yellow', 'red']))->all());
probe('C8 diffAssocUsing strcasecmp', 'C8 diffAssocUsing strcasecmp', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->diffAssocUsing(new Collection(['A' => 'green', 'yellow', 'red']), 'strcasecmp')->all());
probe('C9 intersectAssocUsing strcasecmp', 'C9 intersectAssocUsing strcasecmp', fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssocUsing(new Collection(['a' => 'GREEN', 'B' => 'brown', 'yellow', 'red']), 'strcasecmp')->all());
probe('C10 combine list keys, offset values', 'C10 combine list keys, offset values', fn () => (new Collection(['name', 'family']))->combine([1 => 'taylor', 2 => 'otwell'])->toArray());
probe('C11 combine offset keys, list values', 'C11 combine offset keys, list values', fn () => (new Collection([1 => 'name', 2 => 'family']))->combine(['taylor', 'otwell'])->toArray());
probe('C12 combine offset both', 'C12 combine offset both', fn () => (new Collection([1 => 'name', 2 => 'family']))->combine([2 => 'taylor', 3 => 'otwell'])->toArray());
probe('C13 combine lists -> int keys', 'C13 combine lists -> int keys', fn () => (new Collection([1, 2, 3]))->combine([4, 5, 6])->toArray());
probe('C14 filter by key', 'C14 filter by key', fn () => (new Collection(['id' => 1, 'first' => 'Hello', 'second' => 'World']))->filter(fn ($item, $key) => $key !== 'id')->all());
probe('C15 keys assoc', 'C15 keys assoc', fn () => (new Collection(['name' => 'taylor', 'framework' => 'laravel']))->keys()->all());
probe('C16 replace assoc', 'C16 replace assoc', fn () => (new Collection(['name' => 'amir', 'family' => 'otwell']))->replace(['name' => 'taylor', 'age' => 26])->all());
probe('C17 union array', 'C17 union array', fn () => (new Collection(['name' => 'Hello']))->union(['id' => 1])->all());
probe('C18 union collection', 'C18 union collection', fn () => (new Collection(['name' => 'Hello']))->union(new Collection(['name' => 'World', 'id' => 1]))->all());
probe('union-list-operand', "(new Collection(['a' => 1]))->union([5])", fn () => (new Collection(['a' => 1]))->union([5])->all());
probe('C19 intersectByKeys 2', 'C19 intersectByKeys 2', fn () => (new Collection(['name' => 'taylor', 'family' => 'otwell', 'age' => 26]))->intersectByKeys(new Collection(['height' => 180, 'name' => 'amir', 'family' => 'moharami']))->all());
probe('C20 intersectByKeys 1', 'C20 intersectByKeys 1', fn () => (new Collection(['name' => 'Mateus', 'age' => 18]))->intersectByKeys(new Collection(['name' => 'Mateus', 'surname' => 'Guimaraes']))->all());
probe('intersectAssoc-collection', "(new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssoc(new Collection(['a' => 'green', 'b' => 'yellow', 'blue', 'red']))", fn () => (new Collection(['a' => 'green', 'b' => 'brown', 'c' => 'blue', 'red']))->intersectAssoc(new Collection(['a' => 'green', 'b' => 'yellow', 'blue', 'red']))->all());
probe('C21 diff collection', 'C21 diff collection', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diff(new Collection(['first_word' => 'Hello', 'last_word' => 'World']))->all());
probe('C22 diffKeysUsing', 'C22 diffKeysUsing', fn () => (new Collection(['id' => 1, 'first_word' => 'Hello']))->diffKeysUsing(new Collection(['ID' => 123, 'foo_bar' => 'Hello']), 'strcasecmp')->all());
probe('C23 replace int-keyed replacer on int-keyed', 'C23 replace int-keyed replacer on int-keyed', fn () => (new Collection(['a', 'b', 'c']))->replace([1 => 'd', 2 => 'e', 3 => 'f', 4 => 'g'])->all());
probe('C24 replaceRecursive list fixture', 'C24 replaceRecursive list fixture', fn () => (new Collection(['a', 'b', ['c', 'd']]))->replaceRecursive(['z', 2 => [1 => 'e'], 'f'])->all());

// ---- LIST-derived shapes on assoc keys
$eight = ['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5, 'f' => 6, 'g' => 7, 'h' => 8];
probe('L1 slice(3) assoc', 'L1 slice(3) assoc', fn () => (new Collection($eight))->slice(3)->all());
probe('L2 slice(-3) assoc', 'L2 slice(-3) assoc', fn () => (new Collection($eight))->slice(-3)->all());
probe('L3 slice(3,3) assoc', 'L3 slice(3,3) assoc', fn () => (new Collection($eight))->slice(3, 3)->all());
probe('L4 slice(3,-1) assoc', 'L4 slice(3,-1) assoc', fn () => (new Collection($eight))->slice(3, -1)->all());
probe('L5 slice(-5,3) assoc', 'L5 slice(-5,3) assoc', fn () => (new Collection($eight))->slice(-5, 3)->all());
probe('L6 slice(-6,-2) assoc', 'L6 slice(-6,-2) assoc', fn () => (new Collection($eight))->slice(-6, -2)->all());
probe('L7 chunkBy single item assoc', 'L7 chunkBy single item assoc', fn () => (new Collection(['x' => ['key' => 'a']]))->chunkBy('key')->map->all()->all());
probe('L8 contains loose (assoc)', 'L8 contains loose (assoc)', function () {
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
probe('L9 containsStrict (assoc)', 'L9 containsStrict (assoc)', function () {
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

// ---- divergences
probe('D1 unshift assoc item onto assoc', 'D1 unshift assoc item onto assoc', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(['a' => 1]);
    return $c->all();
});
probe('D1b unshift two assoc items onto assoc', 'D1b unshift two assoc items onto assoc', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(['a' => 1], ['d' => 'house']);
    return $c->all();
});
probe('D1c testUnshiftWithOneItem sequence on assoc', 'D1c testUnshiftWithOneItem sequence on assoc', function () {
    $c = new Collection(['x' => 4]);
    $c->unshift(['a', 'b', 'c']);
    $c->unshift(['who' => 'Jonny', 'preposition' => 'from', 'where' => 'Laroe']);
    return $c->unshift('Jonny from Laroe')->toArray();
});
probe('D1d unshift spread string-keyed', 'D1d unshift spread string-keyed', function () {
    $c = new Collection(['b' => 2]);
    $c->unshift(...['a' => 1]);
    return $c->all();
});
probe('D1e unshift int-keyed item overlapping', 'D1e unshift int-keyed item overlapping', function () {
    $c = new Collection(['z' => 3]);
    $c->unshift([0 => 'zero'], 9);
    return $c->all();
});
probe('D1f unshift with no items on assoc', 'D1f unshift with no items on assoc', function () {
    $c = new Collection([5 => 'a', 'x' => 'b']);
    return $c->unshift()->all();
});
probe('D2 containsStrict callback matching a null value', 'D2 containsStrict callback matching a null value', fn () => [
    'strict' => (new Collection(['a' => null, 'b' => 1]))->containsStrict(fn ($v) => is_null($v)),
    'loose' => (new Collection(['a' => null, 'b' => 1]))->contains(fn ($v) => is_null($v)),
]);
probe('D3 containsStrict NAN', 'D3 containsStrict NAN', fn () => [
    'strict' => (new Collection(['a' => NAN]))->containsStrict(NAN),
    'loose' => (new Collection(['a' => NAN]))->contains(NAN),
]);
probe('D4 containsStrict array by value', 'D4 containsStrict array by value', fn () => [
    'strict_list' => (new Collection(['a' => [1]]))->containsStrict([1]),
    'strict_assoc' => (new Collection(['a' => ['x' => 1]]))->containsStrict(['x' => 1]),
    'loose_assoc' => (new Collection(['a' => ['x' => 1]]))->contains(['x' => '1']),
]);
probe('D5 combine null/bool/float keys', 'D5 combine null/bool/float keys', fn () => [
    'null' => (new Collection(['k' => null]))->combine([1])->all(),
    'true' => (new Collection(['k' => true]))->combine([1])->all(),
    'false' => (new Collection(['k' => false]))->combine([1])->all(),
    'float' => (new Collection(['k' => 1.5]))->combine([1])->all(),
    'numstr' => (new Collection(['k' => '7']))->combine([1])->all(),
]);
probe('D6 shift/pop on collect(null)', 'D6 shift/pop on collect(null)', fn () => [
    'shift2' => (new Collection(null))->shift(2),
    'shift1' => (new Collection(null))->shift(),
    'pop3' => (new Collection(null))->pop(3)->all(),
]);
probe('D7 replaceRecursive nested list replaced by offset map', 'D7 replaceRecursive nested list replaced by offset map', fn () => (new Collection(['k' => ['c', 'd']]))->replaceRecursive(['k' => [1 => 'e']])->all());
probe('D8 pop(2) on assoc returns list', 'D8 pop(2) on assoc returns list', function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3]);
    return ['returned' => $c->pop(2)->all(), 'remaining' => $c->all()];
});
probe('D9 flip numeric-string value', 'D9 flip numeric-string value', fn () => (new Collection(['a' => '1', 'b' => '01', 'c' => '-0']))->flip()->all());
probe('D10 contains strict vs loose -0/0', 'D10 contains strict vs loose -0/0', fn () => [
    's' => (new Collection(['a' => -0.0]))->containsStrict(0.0),
]);

// ==== CollectionTest parity: keys, splice, pop, shift, pad
probe('K1 keys of numeric-looking string keys', 'K1 keys of numeric-looking string keys', function () {
    $keys = (new Collection(['1.5' => 'a', 'Infinity' => 'b', '-1' => 'c', '01' => 'd', '1e3' => 'e', '10' => 'f', '1e+21' => 'g']))->keys()->all();
    return array_map(fn ($k) => [gettype($k), $k], $keys);
});
probe('K2 chunkWhile callback key types', 'K2 chunkWhile callback key types', function () {
    $seen = [];
    (new Collection(['a' => 0, '01' => 'd', '1.5' => 'x', '1e3' => 'e', ' 1' => 'g', '-1' => 'c', '10' => 'f']))
        ->chunkWhile(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return true; });
    return $seen;
});
probe('R1 replaceRecursive nested map replaced by list', 'R1 replaceRecursive nested map replaced by list', fn () => (new Collection(['k' => [0 => 'c', 1 => 'd']]))->replaceRecursive(['k' => ['x']])->all());
probe('replaceRecursive-list-with-assoc', "(new Collection(['k' => ['c']]))->replaceRecursive(['k' => ['x' => 1]])", fn () => (new Collection(['k' => ['c']]))->replaceRecursive(['k' => ['x' => 1]])->all());
probe('S1 splice on assoc with scalar replacement mid', 'S1 splice on assoc with scalar replacement mid', function () {
    $c = new Collection(['a' => 1, 'b' => 2, 'c' => 3]);
    $removed = $c->splice(1, 1, 'bar');
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('S2 splice assoc insert scalar, length 0', 'S2 splice assoc insert scalar, length 0', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $removed = $c->splice(1, 0, 'bar');
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('S3 splice assoc insert array', 'S3 splice assoc insert array', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $c->splice(1, 0, ['bar']);
    return $c->all();
});
probe('S4 splice assoc (1,1) no replacement', 'S4 splice assoc (1,1) no replacement', function () {
    $c = new Collection(['foo' => 'f', 'baz' => 'z']);
    $removed = $c->splice(1, 1);
    return ['removed' => $removed->all(), 'after' => $c->all()];
});
probe('P1 pop on assoc', 'P1 pop on assoc', function () {
    $c = new Collection(['foo' => 'f', 'bar' => 'b']);
    return ['popped' => $c->pop(), 'first' => $c->first(), 'all' => $c->all()];
});
probe('P2 pop(2)/pop(6) on assoc', 'P2 pop(2)/pop(6) on assoc', function () {
    $c = new Collection(['foo' => 'f', 'bar' => 'b', 'baz' => 'z']);
    $two = $c->pop(2)->all();
    $first = $c->first();
    $six = (new Collection(['foo' => 'f', 'bar' => 'b', 'baz' => 'z']))->pop(6)->all();
    return ['two' => $two, 'first' => $first, 'six' => $six];
});
probe('SH1 shift sequence on assoc', 'SH1 shift sequence on assoc', function () {
    $c = new Collection(['first' => 'Taylor', 'last' => 'Otwell']);
    $a = $c->shift(); $f1 = $c->first(); $b = $c->shift(); $f2 = $c->first();
    return [$a, $f1, $b, $f2];
});
probe('SH2 shift(2), shift(6), shift(0) on assoc', 'SH2 shift(2), shift(6), shift(0) on assoc', function () {
    $c = new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']);
    $two = $c->shift(2)->all(); $first = $c->first(); $rem = $c->all();
    $six = (new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']))->shift(6)->all();
    $c0 = new Collection(['a' => 'foo', 'b' => 'bar', 'c' => 'baz']);
    $zero = $c0->shift(0)->all();
    return ['two' => $two, 'first' => $first, 'rem' => $rem, 'six' => $six, 'zero' => $zero, 'after0' => $c0->all()];
});
probe('SH3 shift(-2) throws', 'SH3 shift(-2) throws', fn () => (new Collection(['a' => 1]))->shift(-2));
probe('PAD1 pad on assoc (list fixture shapes)', 'PAD1 pad on assoc (list fixture shapes)', fn () => [
    'p4' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->pad(4, 0)->all(),
    'p4big' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->pad(4, 0)->all(),
    'n4' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3]))->pad(-4, 0)->all(),
    'n4big' => (new Collection(['a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5]))->pad(-4, 0)->all(),
]);

// ==== CollectionTest parity: unshift(null) and callback key types
probe('U1 unshift(null) onto assoc', 'U1 unshift(null) onto assoc', function () { $c = new Collection(['a' => 1]); $c->unshift(null); return $c->all(); });
probe('F1 filter callback key type for int key', 'F1 filter callback key type for int key', function () {
    $seen = [];
    $r = (new Collection([1 => 'a', 'x' => 'b']))->filter(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return $k === 1; })->all();
    return ['result' => $r, 'seen' => $seen];
});
probe('F2 contains callback key type for int key', 'F2 contains callback key type for int key', function () {
    $seen = [];
    $r = (new Collection([1 => 'a', 'x' => 'b']))->contains(function ($v, $k) use (&$seen) { $seen[] = [gettype($k), $k]; return $k === 1; });
    return ['result' => $r, 'seen' => $seen];
});
// ---- callback key types: PHP hands a callback an integer key as an int
$keyTypes = function (callable $run, mixed $result = true): array {
    $seen = [];

    try {
        $run(function ($value, $key) use (&$seen, $result) {
            $seen[] = gettype($key);

            return $result;
        });
    } catch (\Throwable) {
    }

    return $seen;
};
$intKeyed = [1 => 'a', 'x' => 'b'];
probe('callback-key every', 'Arr::every([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::every($intKeyed, $cb)));
probe('callback-key some', 'Arr::some([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::some($intKeyed, $cb), false));
probe('callback-key first', 'Arr::first([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::first($intKeyed, $cb), false));
probe('callback-key last', 'Arr::last([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::last($intKeyed, $cb), false));
probe('callback-key map', 'Arr::map([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::map($intKeyed, $cb)));
probe('callback-key mapWithKeys', 'Arr::mapWithKeys([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::mapWithKeys($intKeyed, $cb), ['k' => 'v']));
probe('callback-key where', 'Arr::where([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::where($intKeyed, $cb)));
probe('callback-key reject', 'Arr::reject([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::reject($intKeyed, $cb)));
probe('callback-key partition', 'Arr::partition([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::partition($intKeyed, $cb)));
probe('callback-key sole', 'Arr::sole([1 => "a", "x" => "b"], $cb returning false)', fn () => $keyTypes(fn ($cb) => Arr::sole($intKeyed, $cb), false));
probe('callback-key sort', 'Arr::sort([1 => "a", "x" => "b"], $cb)', fn () => $keyTypes(fn ($cb) => Arr::sort($intKeyed, $cb), 0));
probe('callback-key keyBy', 'Arr::keyBy([1 => ["id" => 1], "x" => ["id" => 2]], $cb)', fn () => $keyTypes(fn ($cb) => Arr::keyBy([1 => ['id' => 1], 'x' => ['id' => 2]], $cb), 'k'));
probe('callback-key mapSpread', 'Arr::mapSpread([1 => ["a"], "x" => ["b"]], fn ($v, $k) => ...)', fn () => $keyTypes(fn ($cb) => Arr::mapSpread([1 => ['a'], 'x' => ['b']], $cb)));
probe('callback-key diffKeysUsing', 'Collection([1 => "a", "x" => "b"])->diffKeysUsing([1 => "z"], $cmp)', function () {
    $seen = [];
    (new Collection([1 => 'a', 'x' => 'b']))->diffKeysUsing([1 => 'z'], function ($a, $b) use (&$seen) {
        $seen[] = [gettype($a), gettype($b)];

        return $a <=> $b;
    });

    return $seen;
});
probe('keyBy callback receives the key', 'Arr::keyBy(["x" => ["id" => 1]], fn ($item, $key) => $key)', fn () => Arr::keyBy(['x' => ['id' => 1]], fn ($item, $key) => $key));

// ---- prepend's two-argument form is array_unshift
probe('prepend-assoc-no-key', "Arr::prepend(['one' => 1, 'two' => 2], 0)", fn () => Arr::prepend(['one' => 1, 'two' => 2], 0));
probe('prepend-mixed-no-key', "Arr::prepend([5 => 'five', 'one' => 1], 0)", fn () => Arr::prepend([5 => 'five', 'one' => 1], 0));

// ---- keys that become values (divide, flip) keep PHP's integer cast
probe('flip-int-key-type', "array_map('gettype', (new Collection([0 => 'a', 'b' => 'c']))->flip()->all())", fn () => array_map('gettype', (new Collection([0 => 'a', 'b' => 'c']))->flip()->all()));

// ---- replaceRecursive recurses only when both values are arrays; an object is a leaf
probe('replaceRecursive-list-element-map', "(new Collection(['y' => [1, 2]]))->replaceRecursive(['y' => [[1 => 'x']]])", fn () => (new Collection(['y' => [1, 2]]))->replaceRecursive(['y' => [[1 => 'x']]])->all());
probe('replaceRecursive-list-elements-kept-whole', "(new Collection([1, 2]))->replaceRecursive([[1 => 'x']]); (new Collection(['a', 'b', 'c']))->replaceRecursive(['x', [4 => 'e'], 'z'])", fn () => [
    'pair' => (new Collection([1, 2]))->replaceRecursive([[1 => 'x']])->all(),
    'three' => (new Collection(['a', 'b', 'c']))->replaceRecursive(['x', [4 => 'e'], 'z'])->all(),
]);
probe('replaceRecursive-nested-list-meets-map', "(new Collection([['c'], ['a' => 1]]))->replaceRecursive([['x' => 1], ['x']])", fn () => (new Collection([['c'], ['a' => 1]]))->replaceRecursive([['x' => 1], ['x']])->all());
probe('replaceRecursive-object-leaf', 'replaceRecursive with a DateTime or stdClass on either side: d and q are the replacer instances', function () {
    $date = new DateTime('@1');
    $object = (object) ['x' => 2];
    $result = (new Collection(['d' => new DateTime('@0'), 'p' => (object) ['x' => 1], 'q' => ['a' => 1]]))
        ->replaceRecursive(['d' => $date, 'p' => ['y' => 2], 'q' => $object])
        ->all();

    return ['d' => $result['d'] === $date, 'p' => $result['p'], 'q' => $result['q'] === $object];
});
probe('replace-list-replacer', "(new Collection(['a' => 1]))->replace(['x'])", fn () => (new Collection(['a' => 1]))->replace(['x'])->all());
probe('replaceRecursive-nested-toArray-entry', "a nested 'toArray' closure entry merges as data, with an array or a Collection operand", function () {
    $toArray = fn () => ['unwrapped'];
    $plain = (new Collection(['a' => ['x' => 1]]))->replaceRecursive(['a' => ['toArray' => $toArray]])->all();
    $wrapped = (new Collection(['a' => ['x' => 1]]))->replaceRecursive(new Collection(['a' => ['toArray' => $toArray]]))->all();

    return [
        'plain' => ['keys' => array_keys($plain['a']), 'kept' => $plain['a']['toArray'] === $toArray],
        'wrapped' => ['keys' => array_keys($wrapped['a']), 'kept' => $wrapped['a']['toArray'] === $toArray],
    ];
});

// ---- list-backed Collection with a Collection-like operand (arr sibling of the object-backed rows above)
probe('replace-list-collection-operand', "(new Collection([1, 2, 3]))->replace(new Collection([9]))", fn () => (new Collection([1, 2, 3]))->replace(new Collection([9]))->all());
probe('replaceRecursive-list-collection-operand', "(new Collection([['a' => 1]]))->replaceRecursive(new Collection([['b' => 2]]))", fn () => (new Collection([['a' => 1]]))->replaceRecursive(new Collection([['b' => 2]]))->all());
probe('diffAssoc-list-collection-operand', "(new Collection([1, 2, 3]))->diffAssoc(new Collection([1, 9, 9]))", fn () => (new Collection([1, 2, 3]))->diffAssoc(new Collection([1, 9, 9]))->values()->all());
probe('intersectAssoc-list-collection-operand', "(new Collection([1, 2, 3]))->intersectAssoc(new Collection([1, 2, 9]))", fn () => (new Collection([1, 2, 3]))->intersectAssoc(new Collection([1, 2, 9]))->values()->all());
probe('intersectAssocUsing-list-collection-operand', "(new Collection([1, 2, 3]))->intersectAssocUsing(new Collection([1, 2, 9]), fn (\$a, \$b) => \$a <=> \$b)", fn () => (new Collection([1, 2, 3]))->intersectAssocUsing(new Collection([1, 2, 9]), fn ($a, $b) => $a <=> $b)->values()->all());
probe('intersectByKeys-list-collection-operand', "(new Collection([1, 2, 3]))->intersectByKeys(new Collection([9, 9]))", fn () => (new Collection([1, 2, 3]))->intersectByKeys(new Collection([9, 9]))->values()->all());

// ---- diffAssoc's own Collection-like-operand row: C6's fixture shares no key+value pair with
// its operand either wrapped or raw, so it can't tell the fix apart from a still-broken diffAssoc.
probe('diffAssoc-collection-matching-key', "(new Collection(['id' => 1, 'name' => 'a']))->diffAssoc(new Collection(['id' => 1, 'name' => 'b']))", fn () => (new Collection(['id' => 1, 'name' => 'a']))->diffAssoc(new Collection(['id' => 1, 'name' => 'b']))->all());

// ---- Arr::collapse unwraps a Collection item; array_merge and array_unshift renumber negative integer keys too
probe('collapse-assoc-collection-item', "Arr::collapse(['a' => new Collection(['x' => 1]), 'b' => ['y' => 2]])", fn () => Arr::collapse(['a' => new Collection(['x' => 1]), 'b' => ['y' => 2]]));
probe('collapse-negative-int-keys', "Arr::collapse(['g1' => [-1 => 'a', 'k' => 'b'], 'g2' => [-1 => 'c']]) and the same groups as a list", fn () => [
    'assoc' => Arr::collapse(['g1' => [-1 => 'a', 'k' => 'b'], 'g2' => [-1 => 'c']]),
    'list' => Arr::collapse([[-1 => 'a', 'k' => 'b'], [-1 => 'c']]),
]);
probe('unshift-negative-int-key', "(new Collection([-1 => 'a', 'x' => 'b']))->unshift('z')", fn () => (new Collection([-1 => 'a', 'x' => 'b']))->unshift('z')->all());
probe('prepend-negative-int-key-no-key', "Arr::prepend([-1 => 'a', 'x' => 'b'], 'z')", fn () => Arr::prepend([-1 => 'a', 'x' => 'b'], 'z'));

emit();
