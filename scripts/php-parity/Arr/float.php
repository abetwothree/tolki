<?php

/**
 * Ground truth for Arr::float().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// Task 20 Problem B — is_float() rejects a whole-number int; JS has one number type
probe('Arr::float rejects a whole-number int', 'Arr::float(["k"=>1], "k")', fn () => Arr::float(['k' => 1], 'k'));
probe('float-string-value', "Arr::float(['string' => 'foo bar'], 'string')", fn () => Arr::float(['string' => 'foo bar'], 'string'));
probe('float-list-int-key', "Arr::float(['foo bar'], 0)", fn () => Arr::float(['foo bar'], 0));
// fix-round-1: dataFloat's "falls back to the default for a missing key" cited the
// boolean probe above by mistake. Arr::float has its own explicit-default form.
probe('float-missing-key-default', "Arr::float([], 'missing', 1.5)", fn () => Arr::float([], 'missing', 1.5));
probe('float-missing-key-no-default', "Arr::float([], 'missing')", fn () => Arr::float([], 'missing'));
probe('float-list-missing-index-no-default', "Arr::float([], 0)", fn () => Arr::float([], 0));

emit();
