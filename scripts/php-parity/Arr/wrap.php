<?php

/**
 * Ground truth for Arr::wrap().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- wrap
probe('wrap-empty-string', "Arr::wrap('')", fn () => Arr::wrap(''));
probe('wrap-false', "Arr::wrap(false)", fn () => Arr::wrap(false));
probe('wrap-zero', "Arr::wrap(0)", fn () => Arr::wrap(0));
probe('wrap-stdclass-is-wrapped', "Arr::wrap(new stdClass) is list", fn () => array_is_list(Arr::wrap(new stdClass)) && count(Arr::wrap(new stdClass)) === 1);
probe('wrap-datetime', "Arr::wrap(new DateTime) count", fn () => count(Arr::wrap(new DateTime('@0'))));

emit();
