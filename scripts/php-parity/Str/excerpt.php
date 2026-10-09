<?php

/**
 * Ground truth for Str::excerpt().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

probe('excerpt-two-spaces-before-phrase', "Str::excerpt('This is  my name', 'my'), then with ['radius' => 3]", fn () => [Str::excerpt('This is  my name', 'my'), Str::excerpt('This is  my name', 'my', ['radius' => 3])]);
probe('excerpt-space-then-tab-before-phrase', 'Str::excerpt("foo \tbar", "bar")', fn () => Str::excerpt("foo \tbar", 'bar'));

emit();
