<?php

/**
 * Ground truth for Arr::onlyValues().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- onlyValues
probe('onlyValues-empty-data', "Arr::onlyValues([], 'foo')", fn () => Arr::onlyValues([], 'foo'));
probe('onlyValues-empty-values-assoc', "Arr::onlyValues(['a'=>'foo','b'=>'bar'], [])", fn () => Arr::onlyValues(['a' => 'foo', 'b' => 'bar'], []));
probe('onlyValues-strict-numstr-assoc', "Arr::onlyValues(['a'=>1,'b'=>'1','c'=>2,'d'=>'2','e'=>3], [1,2,3], true)", fn () => Arr::onlyValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true));
probe('onlyValues-loose-numstr-assoc', "Arr::onlyValues(['a'=>1,'b'=>'1','c'=>2,'d'=>'2','e'=>3], [1,2,3])", fn () => Arr::onlyValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3]));

// ArrTest::testOnlyValues — the list literal's key-preservation row; this file already has the
// assoc ones ("onlyValues-empty-data", "-empty-values-assoc", "-strict-numstr-assoc", "-loose-numstr-assoc").
probe('onlyValues-list-keeps-gap', "Arr::onlyValues(['foo','bar','baz','qux'], ['foo','baz'])", fn () => Arr::onlyValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']));

emit();
