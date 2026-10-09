<?php

/**
 * Ground truth for Arr::forget().
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

// ---- forget
$f = function ($array, $keys) { Arr::forget($array, $keys); return $array; };
probe('forget-null', "forget(products, null)", fn () => $f(['products' => ['desk' => ['price' => 100]]], null));
probe('forget-empty-array', "forget(products, [])", fn () => $f(['products' => ['desk' => ['price' => 100]]], []));
probe('forget-products.desk', "forget(products, 'products.desk')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.desk'));
probe('forget-products.desk.price', "forget(products, 'products.desk.price')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.desk.price'));
probe('forget-missing-intermediate', "forget(products, 'products.final.price')", fn () => $f(['products' => ['desk' => ['price' => 100]]], 'products.final.price'));
probe('forget-shop', "forget(['shop'=>['cart'=>[150=>0]]], 'shop.final.cart')", fn () => $f(['shop' => ['cart' => [150 => 0]]], 'shop.final.cart'));
probe('forget-taxes', "forget(..., 'products.desk.price.taxes')", fn () => $f(['products' => ['desk' => ['price' => ['original' => 50, 'taxes' => 60]]]], 'products.desk.price.taxes'));
probe('forget-final-taxes', "forget(..., 'products.desk.final.taxes')", fn () => $f(['products' => ['desk' => ['price' => ['original' => 50, 'taxes' => 60]]]], 'products.desk.final.taxes'));
probe('forget-empty-string-sibling', "forget(['products'=>['desk'=>['price'=>50],''=>'something']], ['products.amount.all','products.desk.price'])", fn () => $f(['products' => ['desk' => ['price' => 50], '' => 'something']], ['products.amount.all', 'products.desk.price']));
probe('forget-emails-nested', "forget(emails, ['emails.joe@example.com','emails.jane@localhost'])", fn () => $f(['emails' => ['joe@example.com' => ['name' => 'Joe'], 'jane@localhost' => ['name' => 'Jane']]], ['emails.joe@example.com', 'emails.jane@localhost']));
probe('forget-int-key', "forget(['name'=>'hAz','1'=>'test',2=>'bAz'], 1)", fn () => $f(['name' => 'hAz', '1' => 'test', 2 => 'bAz'], 1));
probe('forget-int-key-string', "forget(['name'=>'hAz','1'=>'test',2=>'bAz'], '1')", fn () => $f(['name' => 'hAz', '1' => 'test', 2 => 'bAz'], '1'));
probe('forget-float', "forget([2=>[1=>'products',3=>'users']], 2.3)", fn () => $f([2 => [1 => 'products', 3 => 'users']], 2.3));
probe('forget-float-string', "forget([2=>[1=>'products',3=>'users']], '2.3')", fn () => $f([2 => [1 => 'products', 3 => 'users']], '2.3'));
probe('forget-joe-top', "forget(['joe@example.com'=>'Joe','jane@example.com'=>'Jane'], 'joe@example.com')", fn () => $f(['joe@example.com' => 'Joe', 'jane@example.com' => 'Jane'], 'joe@example.com'));

// ==== D4 (F-12): Arr::set, push and forget pass each dot segment to the array subscript, so PHP's key cast applies:
// "01" and "" stay strings, "1" and "-1" become ints, "1.5" is two segments. Rows record the key types separately.

$d4Segments = ['01', '1', '-1', '1.5', ''];

/** Render a probe result as its JSON shape plus the PHP type of every top-level key. */
$d4Shape = fn (array $array): array => [
    'json' => json_decode(json_encode($array, JSON_UNESCAPED_SLASHES), true),
    'keys' => array_map(fn ($k) => gettype($k) . ':' . $k, array_keys($array)),
];

$d4Set = function (array $array, string $key) use ($d4Shape): array {
    Arr::set($array, $key, 'V');

    return $d4Shape($array);
};

probe('forget-record-key-cast', "Arr::forget(['a'=>['x','y','z']], 'a.'.\$seg) for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = ['a' => ['x', 'y', 'z']];
        Arr::forget($array, 'a.' . $s);

        return $d4Shape($array['a']);
    }, $d4Segments));
});
probe('forget-list-key-cast', "Arr::forget([['x','y','z']], '0.'.\$seg) for \$seg in '01','1','-1','1.5',''", function () use ($d4Segments, $d4Shape) {
    return array_combine($d4Segments, array_map(function ($s) use ($d4Shape) {
        $array = [['x', 'y', 'z']];
        Arr::forget($array, '0.' . $s);

        return $d4Shape($array[0]);
    }, $d4Segments));
});

probe('forget-top-level-key-cast', "Arr::forget(['products', ['desk', [100]]], \$seg) for \$seg in '01','1',''", function () use ($d4Shape) {
    return array_combine(['01', '1', ''], array_map(function ($s) use ($d4Shape) {
        $array = ['products', ['desk', [100]]];
        Arr::forget($array, $s);

        return $d4Shape($array);
    }, ['01', '1', '']));
});

probe('forget-list-noncanonical-among-several-keys', "Arr::forget([['x','y','z']], ['0.01', '0.2'])", function () use ($d4Shape) {
    $a = [['x', 'y', 'z']];
    Arr::forget($a, ['0.01', '0.2']);

    return $d4Shape($a[0]);
});

emit();
