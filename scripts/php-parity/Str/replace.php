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

// Str::replace() reads a Traversable search as an array on both the case-sensitive and case-insensitive paths.
probe('replace-generator-search', "Str::replace((function () { yield 'o'; })(), '0', ['Foo', 'Boo']) and the same with ['FOO', 'BOO'] and caseSensitive false", fn () => [Str::replace((function () { yield 'o'; })(), '0', ['Foo', 'Boo']), Str::replace((function () { yield 'o'; })(), '0', ['FOO', 'BOO'], false)]);

emit();
