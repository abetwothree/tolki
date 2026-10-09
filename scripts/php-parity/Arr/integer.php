<?php

/**
 * Ground truth for Arr::integer().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('integer-string-value', "Arr::integer(['string' => 'foo bar'], 'string')", fn () => Arr::integer(['string' => 'foo bar'], 'string'));
probe('integer-float-value', "Arr::integer(['a' => 1.5], 'a')", fn () => Arr::integer(['a' => 1.5], 'a'));
probe('integer-list-int-key', "Arr::integer(['foo bar'], 0)", fn () => Arr::integer(['foo bar'], 0));
// fix-round-1: dataInteger's "rejects a non-whole number" needed an array-backing pin,
// not just the assoc-key row above.
probe('integer-float-value-list', "Arr::integer([1.5], 0)", fn () => Arr::integer([1.5], 0));
probe('integer-missing-key-no-default', "Arr::integer([], 'missing')", fn () => Arr::integer([], 'missing'));
probe('integer-list-missing-index-no-default', "Arr::integer([], 0)", fn () => Arr::integer([], 0));

// ==== Carried in: data.spec.ts asserted dataInteger([], 0, 5) === 5 with no citation.
// Arr::integer defaults to null and throws on a missing key, but an explicit default is returned.
probe('integer-list-missing-index-with-default', "Arr::integer([], 0, 5)", fn () => Arr::integer([], 0, 5));

emit();
