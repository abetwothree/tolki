<?php

/**
 * Ground truth for Str helpers on characters outside the Basic Multilingual Plane.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Str;

$rows = [
    ['after', ['😀a😀b', '😀']], ['afterLast', ['😀a😀b', '😀']], ['before', ['a😀b😀', '😀']], ['beforeLast', ['😀a😀b', 'b']],
    ['between', ['😀a😀b😀', '😀', '😀']], ['betweenFirst', ['😀a😀b😀', '😀', '😀']], ['camel', ['𐐨𐐨_𐐨']], ['charAt', ['😀a', 1]],
    ['chopStart', ['😀x', '😀']], ['chopEnd', ['x😀', '😀']], ['contains', ['a😀b', '😀']], ['containsAll', ['a😀b🎉', ['😀', '🎉']]],
    ['doesntContain', ['a😀b', '🎉']], ['deduplicate', ['😀😀😀x', '😀']], ['endsWith', ['a😀', '😀']], ['doesntEndWith', ['a😀', '🎉']],
    ['excerpt', ['😀😀😀 needle 😀😀😀', 'needle', ['radius' => 2]]], ['finish', ['x😀😀', '😀']], ['wrap', ['x', '😀']], ['unwrap', ['😀x😀', '😀']],
    ['is', ['😀*', '😀abc']], ['isAscii', ['😀']], ['kebab', ['𐐀𐐨𐐀𐐨']], ['length', ['😀😀😀']], ['limit', ['😀😀😀', 3]], ['lower', ['𐐀']],
    ['words', ['😀😀 😀 x', 1]], ['mask', ['😀😀😀😀', '*', 1, 2]], ['match', ['/^.{2}/u', '😀😀😀']], ['isMatch', ['/^.$/u', '😀']],
    ['matchAll', ['/./u', '😀a']], ['numbers', ['😀1😀2']], ['padBoth', ['😀', 3, '-']], ['padLeft', ['a', 4, '😀🎉']], ['padRight', ['😀', 3, '-']],
    ['position', ['😀😀a', 'a']], ['replaceArray', ['?', ['😀', '🎉'], '? and ?']], ['replace', ['😀', 'x', 'a😀b']], ['replaceFirst', ['😀', 'x', '😀a😀']],
    ['replaceStart', ['😀', 'x', '😀a😀']], ['replaceLast', ['😀', 'x', '😀a😀']], ['replaceEnd', ['😀', 'x', '😀a😀']], ['replaceMatches', ['/./u', 'x', '😀a']],
    ['remove', ['😀', 'a😀b']], ['reverse', ['😀ab']], ['start', ['😀😀x', '😀']], ['headline', ['𐐨𐐨_𐐨']], ['initials', ['😀a 𐐨b', true]],
    ['apa', ['𐐨𐐨 of 𐐨']], ['snake', ['𐐀𐐨𐐀𐐨']], ['squish', [' 😀  😀 ']], ['startsWith', ['😀a', '😀']], ['doesntStartWith', ['😀a', '🎉']],
    ['studly', ['𐐨𐐨_𐐨']], ['pascal', ['𐐨𐐨_𐐨']], ['swap', [['😀' => 'x'], 'a😀b']], ['take', ['😀😀😀', -2]], ['trim', ['😀a😀', '😀']],
    ['ltrim', ['😀a😀', '😀']], ['rtrim', ['😀a😀', '😀']], ['lcfirst', ['𐐀x']], ['ucfirst', ['𐐨x']], ['ucsplit', ['𐐨𐐀𐐨']], ['ucwords', ['𐐨𐐨 𐐨']],
    ['wordWrap', ['😀😀 😀😀😀', 3]], ['substr', ['😀a😀', 1, 1]], ['substrCount', ['😀a😀', '😀']], ['substrReplace', ['😀😀😀', 'x', 1, 1]],
    ['title', ['𐐨𐐨 𐐨']], ['upper', ['𐐨']], ['toBase64', ['😀']], ['fromBase64', ['8J+YgA==']], ['slug', ['😀 hello 😀']], ['ascii', ['😀é']],
];

probe('astral-characters', 'Each Str helper on emoji, math-letter or Deseret input, recorded as [method, arguments, result]', fn () => array_map(fn (array $row) => [...$row, Str::{$row[0]}(...$row[1])], $rows));

emit();
