<?php

/**
 * Ground truth for Arr::exceptValues().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// --- exceptValues
probe('exceptValues-empty', "Arr::exceptValues([], 'foo')", fn () => Arr::exceptValues([], 'foo'));

// ==== ArrTest parity: gettype wording and accessible analogues
probe('exceptValues-assoc-strict', "Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true)", fn () => Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3], true));
probe('exceptValues-assoc-loose', "Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3])", fn () => Arr::exceptValues(['a' => 1, 'b' => '1', 'c' => 2, 'd' => '2', 'e' => 3], [1, 2, 3]));

// ArrTest::testExceptValues — the list literal's key-preservation row; the assoc rows are
// already captured ("exceptValues-assoc-strict" / "-loose" / "-empty" earlier in this file).
probe('exceptValues-list-keeps-gap', "Arr::exceptValues(['foo','bar','baz','qux'], ['foo','baz'])", fn () => Arr::exceptValues(['foo', 'bar', 'baz', 'qux'], ['foo', 'baz']));

emit();
