<?php

/**
 * Ground truth for the Laravel v13.35 (+ unreleased 13.x) stub sync.
 *
 * Number::pairs() adds a closing [$to, $to] pair when its last step lands exactly on $to (laravel/framework#61921).
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Number;

// The cases Laravel's own tests added.
probe('pairs-upper-bound-starts-a-pair', 'Number::pairs(20, 10)', fn () => Number::pairs(20, 10));
probe('pairs-past-the-upper-bound', 'Number::pairs(21, 10)', fn () => Number::pairs(21, 10));
probe('pairs-upper-bound-from-a-start', 'Number::pairs(10, 3, 1)', fn () => Number::pairs(10, 3, 1));
probe('pairs-upper-bound-already-closed', 'Number::pairs(20, 10, 0, 0)', fn () => Number::pairs(20, 10, 0, 0));
probe('pairs-empty-range', 'Number::pairs(0, 10)', fn () => Number::pairs(0, 10));
probe('pairs-start-past-to', 'Number::pairs(5, 10, 10)', fn () => Number::pairs(5, 10, 10));
probe('pairs-float-step-with-offset', 'Number::pairs(10, 2.5, 0, 0.5)', fn () => Number::pairs(10, 2.5, 0, 0.5));

// Inputs Laravel's tests leave out: a start equal to $to, negative values, odd offsets and float steps.
probe('pairs-start-equals-to', 'Number::pairs(10, 5, 10)', fn () => Number::pairs(10, 5, 10));
probe('pairs-single-step', 'Number::pairs(10, 10)', fn () => Number::pairs(10, 10));
probe('pairs-negative-by-upper-bound', 'Number::pairs(20, -10)', fn () => Number::pairs(20, -10));
probe('pairs-negative-start', 'Number::pairs(0, 10, -20)', fn () => Number::pairs(0, 10, -20));
probe('pairs-negative-range', 'Number::pairs(-10, 5, -20)', fn () => Number::pairs(-10, 5, -20));
probe('pairs-offset-past-by', 'Number::pairs(20, 10, 0, 15)', fn () => Number::pairs(20, 10, 0, 15));
probe('pairs-negative-offset', 'Number::pairs(20, 10, 0, -5)', fn () => Number::pairs(20, 10, 0, -5));
probe('pairs-steps-past-to', 'Number::pairs(9.5, 10)', fn () => Number::pairs(9.5, 10));
probe('pairs-float-step-lands-on-to', 'Number::pairs(1, 0.25)', fn () => Number::pairs(1, 0.25));
probe('pairs-float-step-drifts-past-to', 'Number::pairs(1, 0.1)', fn () => Number::pairs(1, 0.1));

// The zero-step guard predates this sync; its exception class and message differ in the port.
probe('pairs-by-zero', 'Number::pairs(100, 0)', fn () => Number::pairs(100, 0));

emit();
