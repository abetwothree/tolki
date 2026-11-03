<?php

/**
 * Ground truth for Str::remove().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

// Str::remove() reads a Traversable subject as an array (laravel/framework#62278).
probe('remove-laravel-iterable-subjects', "StrTest::testRemove's five array and collection subjects", fn () => [Str::remove('o', ['Foobar', 'Boar']), Str::remove('o', collect(['Foobar', 'Boar'])), Str::remove(collect(['o', 'a']), collect(['Foobar', 'Boar'])), Str::remove('b', collect(['Foobar', 'Boar']), false), Str::remove('ž', collect(['Žltý', 'žito']), false)]);
// str_replace() keeps an array subject's keys, so a keyed array or collection keeps them.
probe('remove-keyed-subjects', "shown() of remove('o', ['x' => 'Foo', 'y' => 'Boo']), ([2 => 'Foo', 0 => 'Boo']), (new Collection(['x' => 'Foo', 'y' => 'Boo'])) and remove('O', that collection, false)", fn () => [shown(Str::remove('o', ['x' => 'Foo', 'y' => 'Boo'])), shown(Str::remove('o', [2 => 'Foo', 0 => 'Boo'])), shown(Str::remove('o', new Collection(['x' => 'Foo', 'y' => 'Boo']))), shown(Str::remove('O', new Collection(['x' => 'Foo', 'y' => 'Boo']), false))]);
probe('remove-generator-keys', "shown(Str::remove('o', a generator yielding 'k1' => 'Foo', 'k2' => 'Boo'))", fn () => shown(Str::remove('o', (function () { yield 'k1' => 'Foo'; yield 'k2' => 'Boo'; })())));
probe('remove-empty-and-scalar-items', "Str::remove('o', []) and @Str::remove('o', ['Foo', null, 5])", fn () => [Str::remove('o', []), @Str::remove('o', ['Foo', null, 5])]);
probe('remove-scalar-subjects', "Str::remove('o', 5) and @Str::remove('o', null)", fn () => [Str::remove('o', 5), @Str::remove('o', null)]);
// str_replace() casts a Stringable subject to a string, and throws for one neither Traversable nor Stringable.
probe('remove-stringable-subjects', "Str::remove('o', Str::of('Foo')), ('o', new StringableProbe('Boo')) and what ('o', new D4Point(1)) throws", fn () => [Str::remove('o', Str::of('Foo')), Str::remove('o', new StringableProbe('Boo')), c32c_outcome(fn () => Str::remove('o', new D4Point(1)))]);

emit();
