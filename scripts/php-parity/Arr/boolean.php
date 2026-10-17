<?php

/**
 * Ground truth for Arr::boolean().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ==== typed accessors: the InvalidArgumentException wording (Arr::string / Arr::array are
// ==== already captured as "string-int-value" / "array-int-value" in Arr/string.json and Arr/array.json).
probe('boolean-string-value', "Arr::boolean(['string' => 'foo bar'], 'string')", fn () => Arr::boolean(['string' => 'foo bar'], 'string'));
probe('boolean-list-int-key', "Arr::boolean(['foo bar'], 0)", fn () => Arr::boolean(['foo bar'], 0));
probe('boolean-missing-key-default', "Arr::boolean([], 'missing', true) and Arr::boolean([], 'missing', false)", fn () => [
    'true' => Arr::boolean([], 'missing', true),
    'false' => Arr::boolean([], 'missing', false),
]);

// ==== P-31: a missing key with NO default. Laravel defaults the third argument to null,
// ==== Arr::get hands the null straight back, and the is_* check then rejects it.
probe('boolean-missing-key-no-default', "Arr::boolean([], 'missing')", fn () => Arr::boolean([], 'missing'));
probe('boolean-list-missing-index-no-default', "Arr::boolean([true, false], 5)", fn () => Arr::boolean([true, false], 5));

emit();
