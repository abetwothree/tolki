<?php

/**
 * Ground truth for Str::substrCount().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

// Str::substrCount() cuts by characters with Str::substr(), then counts (laravel/framework#62277).
probe('substrCount-laravel-multibyte', "StrTest::testSubstrCount's eight Persian and emoji cases, recorded as [haystack, needle, offset, length, result]", fn () => array_map(fn (array $c) => [...$c, Str::substrCount(...$c)], [
    ['سلام سلام سلام', 'سلام', 0, null], ['سلام سلام سلام', 'سلام', 5, null], ['سلام سلام سلام', 'سلام', 0, 14], ['سلام سلام سلام', 'سلام', 5, 4],
    ['سلام سلام سلام', 'سلام', -4, null], ['ab🙂cd🙂ef', '🙂', 0, 6], ['ab🙂cd🙂ef', '🙂', 3, null], ['ab🙂cd🙂ef', '🙂', 1, -1],
]));
probe('substrCount-offset-bounds', 'an offset past the end, one before the start, a length that ends before the offset, and an overlapping needle', fn () => array_map(fn (array $c) => [...$c, Str::substrCount(...$c)], [['abc', 'a', 10, null], ['abc', 'a', -10, null], ['abc', 'a', 1, -5], ['aaa', 'aa', 0, null]]));
probe('substrCount-empty-needle', "Str::substrCount('abc', '') and Str::substrCount('abc', '', 10)", fn () => array_map(function (array $c) { try { return Str::substrCount(...$c); } catch (Throwable $e) { return [get_class($e), $e->getMessage()]; } }, [['abc', ''], ['abc', '', 10]]));

emit();
