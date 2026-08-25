<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Illuminate\Support\Arr;

probe('Arr::get — literal dotted key wins', 'Arr::get(["products.desk"=>[...]], "products.desk")', function () {
    return Arr::get(['products.desk' => ['price' => 100]], 'products.desk');
});

probe('Arr::has — literal dotted key', 'Arr::has(["products.desk"=>[...]], "products.desk")', function () {
    return Arr::has(['products.desk' => ['price' => 100]], 'products.desk');
});

probe('Arr::exists — literal dotted key', 'Arr::exists([...], "products.desk")', function () {
    return Arr::exists(['products.desk' => []], 'products.desk');
});

probe('Arr::pull — first-level key containing dots', 'Arr::pull($a, "joe@example.com")', function () {
    $a = ['joe@example.com' => 'Joe', 'jane@localhost' => 'Jane'];
    $v = Arr::pull($a, 'joe@example.com');

    return ['pulled' => $v, 'remaining' => $a];
});

probe('Arr::has — numeric key', 'Arr::has([123=>"x"], 123)', function () {
    return Arr::has([123 => 'x'], 123);
});

probe('Arr::undot — integer segments rebuild a list', 'Arr::undot([...])', function () {
    return Arr::undot([
        'user.languages.0' => 'PHP',
        'user.languages.1' => 'C#',
        'user.name' => 'Taylor',
    ]);
});

emit();
