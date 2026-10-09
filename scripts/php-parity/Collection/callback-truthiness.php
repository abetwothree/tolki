<?php

/**
 * Ground truth for how Collection's callback methods read a callback's answer.
 */

declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Contracts\Support\Jsonable;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Stringable;
use Illuminate\Tests\Support\TestArrayableObject;
use Illuminate\Tests\Support\TestJsonSerializeObject;
use Illuminate\Tests\Support\TestJsonSerializeWithScalarValueObject;
use Illuminate\Tests\Support\TestJsonableObject;
use Illuminate\Tests\Support\TestTraversableAndJsonSerializableObject;
use Symfony\Component\VarDumper\VarDumper;
probe('C32-C-collection-callback-php-truthiness', "each callback method over new Collection(c32c_items(list | keyed)), sole / hasSole / containsOneItem over its first item alone, with a callback answering '0', [] and new DateTime('@0'); before's callback answers it for 'b' only, chunkWhile records each chunk's values, when / unless take it as the condition and record whether fn () => 'called' ran", fn () => array_map(fn (bool $keyed) => [
    'filter' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->filter($cb)),
    'where' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->where($cb)),
    'reject' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->reject($cb)),
    'first' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->first($cb)),
    'last' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->last($cb)),
    'firstWhere' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstWhere($cb)),
    'firstOrFail' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->firstOrFail($cb)),
    'sole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->sole($cb)),
    'every' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->every($cb)),
    'some' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->some($cb)),
    'contains' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->contains($cb)),
    'doesntContain' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContain($cb)),
    'containsStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsStrict($cb)),
    'doesntContainStrict' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->doesntContainStrict($cb)),
    'search' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->search($cb)),
    'before' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->before(fn ($v) => $v === 'b' ? $cb() : false)),
    'after' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->after($cb)),
    'hasSole' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->hasSole($cb)),
    'containsOneItem' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed, true)))->containsOneItem($cb)),
    'hasMany' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->hasMany($cb)),
    'containsManyItems' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->containsManyItems($cb)),
    'partition' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->partition($cb)),
    'chunkWhile' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->chunkWhile($cb)->map(fn (Collection $chunk) => $chunk->values()->all())),
    'percentage' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->percentage($cb)),
    'when' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->when($cb(), fn () => 'called') === 'called'),
    'unless' => c32c_truthiness(fn ($cb) => (new Collection(c32c_items($keyed)))->unless($cb(), fn () => 'called') === 'called'),
], ['list' => false, 'keyed' => true]));

emit();
