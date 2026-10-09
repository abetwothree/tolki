<?php

/**
 * Ground truth for Arr::string().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('string-int-value', "Arr::string(['string' => 'foo bar', 'integer' => 1234], 'integer')", fn () => Arr::string(['string' => 'foo bar', 'integer' => 1234], 'integer'));
probe('string-list-int-key', "Arr::string([1234], 0)", fn () => Arr::string([1234], 0));
probe('string-missing-key-no-default', "Arr::string([], 'missing')", fn () => Arr::string([], 'missing'));
probe('string-list-missing-index-no-default', "Arr::string([], 0)", fn () => Arr::string([], 0));

emit();
