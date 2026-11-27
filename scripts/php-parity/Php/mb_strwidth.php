<?php

/**
 * Ground truth for PHP's mb_strwidth().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

probe('mb_strwidth-samples', "mb_strwidth() of '😀', '日', 'é', '𝒳', \"e\u{0301}\" and \"\u{200B}\"", fn () => array_map(fn (string $s) => mb_strwidth($s, 'UTF-8'), ['😀', '日', 'é', '𝒳', "e\u{0301}", "\u{200B}"]));
probe('mb_strwidth-wide-ranges', 'every [first, last] run of code points mb_strwidth() counts as 2; every other one counts as 1', function () {
    $ranges = [];
    $start = null;
    for ($cp = 0; $cp <= 0x110000; $cp++) {
        $wide = $cp <= 0x10FFFF && ($cp < 0xD800 || $cp > 0xDFFF) && mb_strwidth(mb_chr($cp, 'UTF-8'), 'UTF-8') === 2;
        if ($wide && $start === null) {
            $start = $cp;
        } elseif (! $wide && $start !== null) {
            $ranges[] = [$start, $cp - 1];
            $start = null;
        }
    }

    return $ranges;
});

emit();
