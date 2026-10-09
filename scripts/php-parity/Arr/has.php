<?php

/**
 * Ground truth for Arr::has().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::has — literal dotted key', 'Arr::has(["products.desk"=>[...]], "products.desk")', function () {
    return Arr::has(['products.desk' => ['price' => 100]], 'products.desk');
});

probe('Arr::has — numeric key', 'Arr::has([123=>"x"], 123)', function () {
    return Arr::has([123 => 'x'], 123);
});

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
probe('has-empty-key-missing', "Arr::has([], '')", fn () => Arr::has([], ''));
probe('has-empty-key-list-missing', "Arr::has([], [''])", fn () => Arr::has([], ['']));
probe('has-null-key-nonempty-assoc', "Arr::has(['a' => 1], [null, 'a'])", fn () => Arr::has(['a' => 1], [null, 'a']));

// ---- a non-canonical index string is a string key, so a list never holds it (get-through-list-leading-zero)
$nonCanonicalIndices = ['01', ' 1', '1e0', '+1', '0x1', '-0', '1 '];
probe('has-list-non-canonical-index', "Arr::has(['x', 'y'], \$k) and Arr::has([['x', 'y']], \"0.\$k\")", function () use ($nonCanonicalIndices) {
    $result = [];

    foreach ($nonCanonicalIndices as $k) {
        $result[$k] = ['top' => Arr::has(['x', 'y'], $k), 'nested' => Arr::has([['x', 'y']], "0.{$k}")];
    }

    return $result;
});
probe('has-empty-string-key-null-key', "Arr::has(['' => 'some'], null)", fn () => Arr::has(['' => 'some'], null));
probe('has-out-of-order', "Arr::has([2 => 'c', 0 => 'a', 1 => 'b'], [0, 2])", fn () => Arr::has(OUT_OF_ORDER, [0, 2]));
probe('has-out-of-order-missing', "Arr::has([2 => 'c', 0 => 'a', 1 => 'b'], [0, 5])", fn () => Arr::has(OUT_OF_ORDER, [0, 5]));

emit();
