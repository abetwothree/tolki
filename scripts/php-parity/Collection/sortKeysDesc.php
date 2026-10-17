<?php

/**
 * Ground truth for Collection::sortKeysDesc().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;

probe('sortKeysDesc-keeps-every-key', 'pairs(collect([2 => \'b\', 5 => \'a\'])->sortKeysDesc())', fn () => pairs(collect([2 => 'b', 5 => 'a'])->sortKeysDesc()));

emit();
