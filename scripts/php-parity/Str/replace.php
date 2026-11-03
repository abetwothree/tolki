<?php

/**
 * Ground truth for Str::replace().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

// str_replace() and the case-insensitive path keep an array or collection subject's keys.
probe('replace-keyed-subjects', "shown() of replace('o', '0', [2 => 'Foo', 0 => 'Boo']), replace('O', '0', new Collection(['x' => 'Foo']), false) and replace(['o', 'a'], ['0', '4'], new Collection(['x' => 'Foobar']))", fn () => [shown(Str::replace('o', '0', [2 => 'Foo', 0 => 'Boo'])), shown(Str::replace('O', '0', new Collection(['x' => 'Foo']), false)), shown(Str::replace(['o', 'a'], ['0', '4'], new Collection(['x' => 'Foobar'])))]);

emit();
