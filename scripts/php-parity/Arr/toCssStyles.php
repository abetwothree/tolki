<?php

/**
 * Ground truth for Arr::toCssStyles().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::toCssStyles mixed keys', 'Arr::toCssStyles([...])', function () {
    return Arr::toCssStyles([
        'font-weight: bold', 'margin-top: 4px;',
        'margin-left: 2px;' => true, 'margin-right: 2px' => false,
    ]);
});

probe('Arr::toCssStyles with is_numeric edge-case keys', "Arr::toCssStyles(['' => 'foo', ' ' => 'foo', '0x10' => 'foo', '1e3' => 'foo', 'Infinity' => 'foo'])", function () {
    return [
        'empty'    => Arr::toCssStyles(['' => 'foo']),
        'space'    => Arr::toCssStyles([' ' => 'foo']),
        'hex'      => Arr::toCssStyles(['0x10' => 'foo']),
        'sci'      => Arr::toCssStyles(['1e3' => 'foo']),
        'infinity' => Arr::toCssStyles(['Infinity' => 'foo']),
    ];
});

probe('Arr::toCssStyles non-string value at numeric key', "Arr::toCssStyles([0 => 123, 1 => null, 3 => true])", function () {
    // Str::finish deprecates a null subject without throwing; @ keeps the notice off stdout and leaves the value alone.
    return @Arr::toCssStyles([0 => 123, 1 => null, 3 => true]);
});

probe('Arr::toCssStyles false value at numeric key', "Arr::toCssStyles([0 => false, 1 => 'x'])", function () {
    return Arr::toCssStyles([0 => false, 1 => 'x']);
});
probe('toCssStyles-out-of-order', "Arr::toCssStyles([2 => 'c:2', 0 => 'a:0', 1 => 'b:1'])", fn () => Arr::toCssStyles([2 => 'c:2', 0 => 'a:0', 1 => 'b:1']));
probe('toCssStyles-mixed-booleans', "Arr::toCssStyles(['x:1' => true, 0 => 'z:0', 'off:1' => false, 'y:1' => true])", fn () => Arr::toCssStyles(['x:1' => true, 0 => 'z:0', 'off:1' => false, 'y:1' => true]));
probe('toCssStyles-collision', "Arr::toCssStyles([1 => 'a:1', 0 => 'z:0', '1' => 'b:1'])", fn () => Arr::toCssStyles([1 => 'a:1', 0 => 'z:0', '1' => 'b:1']));

emit();
