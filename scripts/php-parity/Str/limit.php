<?php

/**
 * Ground truth for Str::limit().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;

$spaces = str_repeat(' ', 100000);
probe('limit-long-interior-run', "Str::limit() past a run of 100000 spaces: plain === \$s.'x...', and with preserveWords === 'x'.\$s.'x...'", fn () => [
    'plain' => Str::limit("{$spaces}x{$spaces}x", 200001) === "{$spaces}x...",
    'preserve-words' => Str::limit("{$spaces}x{$spaces}x y", 200001, '...', true) === "x{$spaces}x...",
]);
probe('limit-preserve-words-no-whitespace', "Str::limit(str_repeat('x', 200000), 100000, '...', true) === str_repeat('x', 100000).'...'", fn () => Str::limit(str_repeat('x', 200000), 100000, '...', true) === str_repeat('x', 100000) . '...');
probe('limit-astral', "Str::limit('😀😀😀', 1, 2, 3, 4 and 6), Str::limit('a😀', 2), Str::limit('𝒳𝒳𝒳', 2) and Str::limit('héllo wörld', 7)", fn () => [Str::limit('😀😀😀', 1), Str::limit('😀😀😀', 2), Str::limit('😀😀😀', 3), Str::limit('😀😀😀', 4), Str::limit('😀😀😀', 6), Str::limit('a😀', 2), Str::limit('𝒳𝒳𝒳', 2), Str::limit('héllo wörld', 7)]);
probe('limit-laravel-cjk', "StrTest::testLimit's Str::limit('这是一段中文', 6) with and without an end and preserveWords, and Str::limit('日本語テキスト', 4)", fn () => [Str::limit('这是一段中文', 6), Str::limit('这是一段中文', 6, '...', true), Str::limit('这是一段中文', 6, ''), Str::limit('这是一段中文', 6, '', true), Str::limit('日本語テキスト', 4)]);
probe('limit-preserve-words-astral', "Str::limit(…, preserveWords: true) of ('😀 😀 😀', 5), ('😀😀 x', 2), ('日本 語', 4), ('日本語 x', 2) and ('😀😀😀', 4, '')", fn () => [Str::limit('😀 😀 😀', 5, '...', true), Str::limit('😀😀 x', 2, '...', true), Str::limit('日本 語', 4, '...', true), Str::limit('日本語 x', 2, '...', true), Str::limit('😀😀😀', 4, '', true)]);
// PHP 8.5 deprecates a negative mb_strimwidth() width; Laravel still passes one through, so record both.
probe('limit-zero-and-negative', "Str::limit('abc', 0), ('abc', -1), ('😀😀😀', -1) and ('abc d', -1, '...', true), with PHP's deprecations", fn () => withDeprecations(fn () => [Str::limit('abc', 0), Str::limit('abc', -1), Str::limit('😀😀😀', -1), Str::limit('abc d', -1, '...', true)]));

emit();
