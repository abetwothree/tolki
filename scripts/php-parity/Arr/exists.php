<?php

/**
 * Ground truth for Arr::exists().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

probe('Arr::exists — literal dotted key', 'Arr::exists([...], "products.desk")', function () {
    return Arr::exists(['products.desk' => []], 'products.desk');
});

// --- exists
probe('exists-null-value', "Arr::exists(['a' => null], 'a')", fn () => Arr::exists(['a' => null], 'a'));
probe('exists-int-miss', "Arr::exists(['a' => 1], 0)", fn () => Arr::exists(['a' => 1], 0));
probe('exists-no-dot-traversal', "Arr::exists(['user' => ['name' => 'John']], 'user.name')", fn () => Arr::exists(['user' => ['name' => 'John']], 'user.name'));
probe('exists-no-dot-traversal-miss', "Arr::exists(['user' => ['name' => 'John']], 'user.age')", fn () => Arr::exists(['user' => ['name' => 'John']], 'user.age'));
probe('exists-null-key-empty-string', "Arr::exists(['' => 1], null)", fn () => Arr::exists(['' => 1], null));
probe('exists-float-key', "Arr::exists(['1.5' => 1], 1.5)", fn () => Arr::exists(['1.5' => 1], 1.5));
probe('exists-literal-dotted', "Arr::exists(['user.name' => 'John'], 'user.name')", fn () => Arr::exists(['user.name' => 'John'], 'user.name'));

// ---- Arr::exists on a list is array_key_exists: only a canonical integer key (or a float that casts to one) exists
probe('exists-list-non-canonical-keys', "Arr::exists([1, 2, 3], \$k) for '', ' ', '01', ' 1', '1e0', '0x1', '-0', '1.0'", function () {
    $result = [];

    foreach (['', ' ', '01', ' 1', '1e0', '0x1', '-0', '1.0'] as $k) {
        $result[$k] = Arr::exists([1, 2, 3], $k);
    }

    return $result;
});
probe('exists-list-null-and-float-keys', "Arr::exists([1, 2, 3], null), (…, 1.5), (…, 1.0), (…, '1')", fn () => [
    'null' => Arr::exists([1, 2, 3], null),
    'float 1.5' => Arr::exists([1, 2, 3], 1.5),
    'float 1.0' => Arr::exists([1, 2, 3], 1.0),
    'string 1' => Arr::exists([1, 2, 3], '1'),
]);

// ---- Arr::exists looks a float key up by its (string) cast, so -0.0 is the key '-0', not 0
probe('exists-float-key-cast', "Arr::exists([1], -0.0), (['-0' => 1], -0.0), (['INF' => 1], INF), (['1.0E+21' => 1], 1e21), (['0.3' => 1], 0.1 + 0.2)", fn () => [
    'list -0' => Arr::exists([1], -0.0),
    'map -0' => Arr::exists(['-0' => 1], -0.0),
    'INF' => Arr::exists(['INF' => 1], INF),
    '1e21' => Arr::exists(['1.0E+21' => 1], 1e21),
    '0.1 + 0.2' => Arr::exists(['0.3' => 1], 0.1 + 0.2),
]);

emit();
