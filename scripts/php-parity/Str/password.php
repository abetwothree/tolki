<?php

/**
 * Ground truth for Str::password().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Number;
use Illuminate\Support\Str;

// Str::password() keeps its length below the pool count and refuses no pools (laravel/framework#61521).
probe('password-length-below-pool-count', 'array_map(fn ($n) => strlen(Str::password($n)), [1, 2, 3])', fn () => array_map(fn ($n) => strlen(Str::password($n)), [1, 2, 3]));
probe('password-zero-length', 'Str::password(0)', fn () => Str::password(0));
probe('password-negative-length', 'Str::password(-2)', fn () => Str::password(-2));
probe('password-no-pools', 'Str::password(32, false, false, false, false)', fn () => Str::password(32, false, false, false, false));
probe('password-no-pools-zero-length', 'Str::password(0, false, false, false, false)', fn () => Str::password(0, false, false, false, false));
probe('password-numbers-only', 'Str::password(5, false, true, false, false)', function () {
    $password = Str::password(5, false, true, false, false);

    return ['length' => strlen($password), 'digits' => ctype_digit($password)];
});
probe('password-spaces-only', 'Str::password(3, false, false, false, true)', fn () => Str::password(3, false, false, false, true));

emit();
