<?php

/**
 * Ground truth for Collection::firstOrFail().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== Group 0 (carried in from the D1-D3 review): two Collection rows the port gets wrong.

// Collection.php:1515 seeds firstOrFail with a fresh stdClass precisely so that a STORED
// null is a found item. Only an absent item can equal that placeholder.
probe('firstOrFail-stored-null-list', "(new Collection([null]))->firstOrFail()", fn () => (new Collection([null]))->firstOrFail());
probe('firstOrFail-stored-null-assoc', "(new Collection(['a' => null]))->firstOrFail()", fn () => (new Collection(['a' => null]))->firstOrFail());
probe('firstOrFail-stored-null-with-callback', "(new Collection([1, null]))->firstOrFail(fn (\$v) => is_null(\$v))", fn () => (new Collection([1, null]))->firstOrFail(fn ($v) => is_null($v)));

// ==== Citation-integrity sweep over the D4-D5 batch: five assertions named a real label
// whose recorded call used a different fixture. These are the calls they actually make.

probe('firstOrFail-stored-null-assoc-with-callback', "(new Collection(['a' => 1, 'b' => null]))->firstOrFail(fn (\$v) => is_null(\$v))", fn () => (new Collection(['a' => 1, 'b' => null]))->firstOrFail(fn ($v) => is_null($v)));

emit();
