# Custom Types

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) types each value from your PHP code. When a class should publish as a type your frontend already defines, such as a node from a UI package or a money value, put `#[TsType]` on the class. Every value of that class and of its subclasses then publishes your type, with its import, wherever the package finds the value:

- [Inertia](./inertia.md) page props and shared data
- [API resources](./api-resources.md)
- [Model](./models.md) attributes and casts
- [Broadcast events](./broadcast-events.md)
- [`AstEngine::analyze()`](./analyzer-api.md)

## Setting a Class's Type

`#[TsType]` lives in the `AbeTwoThree\LaravelTsPublish\Attributes` namespace and takes the type in one of two forms:

| Form                   | Example                                                       | Effect                                           |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| A string               | `#[TsType('string')]`                                         | Publishes the type as written                    |
| An array with `import` | `#[TsType(['type' => 'UiNode', 'import' => '@js/types/ui'])]` | Publishes the type and imports it from that path |

In this example, a UI package's base class sets its type, and `Panel` inherits it:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsType;
use Illuminate\Contracts\Support\Arrayable;

#[TsType(['type' => 'UiNode', 'import' => '@js/types/ui'])]
abstract class Node implements Arrayable
{
    public function toArray(): array
    {
        return ['kind' => 'node'];
    }
}

final class Panel extends Node {}
```

A page renders panels three ways:

```php
return Inertia::render('Ui/Dashboard', [
    'widgets' => [new Panel, new Panel],
    'maybe' => $request->boolean('maybe') ? new Panel : null,
    'coll' => collect([new Panel, new Panel]),
]);
```

Each one publishes `UiNode`, and the file imports it:

```typescript
import type { UiNode } from "@js/types/ui";

export type IndexPageProps = Inertia.SharedData & {
  widgets: UiNode[];
  maybe: UiNode | null;
  coll: UiNode[];
};
```

The type replaces whatever the package would infer for the class, from `toArray()`, `jsonSerialize()`, `__toString()` or its public properties. A [`#[TsCasts]`](./models.md#tscasts) entry for one key still wins over it. The type is also a promise about what Laravel sends for the class, and the package can't check that promise. See [Keeping the Type True](#keeping-the-type-true).

## Where a Type Is Inherited From

A class takes the `#[TsType]` of each trait it uses, each interface it implements and each parent class, at any depth. When a class takes exactly one type, its values publish it as written:

| Class                      | Its own `#[TsType]` | Publishes                 |
| -------------------------- | ------------------- | ------------------------- |
| `Panel extends Node`       | None                | `UiNode`, from `Node`     |
| `Badge implements HasIcon` | None                | `UiIcon`, from `HasIcon`  |
| `Pennies extends Amount`   | None                | `UiAmount`, from `Amount` |
| `Gauge extends Node`       | `UiGauge`, alone    | `UiGauge`                 |

`Gauge` stands alone with [`inherit: false`](#standing-alone-with-inherit-false).

## Composed Types

When a class takes two or more types, the package writes one interface that extends them all. Here `Chart` takes a type from its trait, its interface and its parent class:

```php
#[TsType(['type' => 'UiHello', 'import' => '@js/types/ui'])]
trait AnnouncesHello
{
    // ...
}

#[TsType(['type' => 'UiIcon', 'import' => '@js/types/ui'])]
interface HasIcon {}

final class Chart extends Node implements HasIcon
{
    use AnnouncesHello;
}
```

The package names the interface after the class, with a `Type` suffix. The interface gets a file of its own, which follows the class's namespace as a model's file does, so `App\Packages\Ui\Chart` writes `app/packages/ui/chart.ts`:

```typescript
import type { UiHello, UiIcon, UiNode } from "@js/types/ui";

export interface ChartType extends UiHello, UiIcon, UiNode {}
```

The directory's `index.ts` barrel exports it, and every file with a `Chart` value imports `ChartType` from that barrel. The [global declaration file](./publishing.md#global-declaration-file) declares it too.

A class's own `#[TsType]` joins the ones it inherits:

```php
#[TsType(['type' => 'UiDial', 'import' => '@js/types/ui'])]
final class Dial extends Node {}
```

`Dial` publishes `DialType`:

```typescript
import type { UiDial, UiNode } from "@js/types/ui";

export interface DialType extends UiDial, UiNode {}
```

The `extends` list starts with the nearest type: the class's own, then its traits', then its interfaces', and then its parent class's, which follows the same order.

### Standing Alone With `inherit: false`

Pass `inherit: false` to publish a class's own type without the ones it would inherit:

```php
#[TsType(
    ['type' => 'UiGauge', 'import' => '@js/types/ui'],
    inherit: false,
)]
final class Gauge extends Node {}
```

A `Gauge` value publishes `UiGauge`, and the package writes no `GaugeType`. On a parent class, a trait or an interface, `inherit: false` passes on only that one's own type, without the ones it inherits.

### Types That Can't Be Extended

An interface can extend only a named type, such as `UiNode`, `Acme.Ui.Node` or `Paginated<Chart>`. A keyword type such as `string`, a union, an array, a literal and a `Record<…>` can't join a composed type. When one of a class's types can't, the nearest type wins, and `ts:publish` warns which ones it left out:

```php
#[TsType('string')]
final class Spark extends Node {}
```

A `Spark` value publishes `string`, and the run prints:

```text
App\Packages\Ui\Spark: Publishes the #[TsType] [string] alone and leaves out [UiNode] from [App\Packages\Ui\Node]: a composed type cannot extend [string].
```

Add `inherit: false` to the class's own `#[TsType]` to keep its type and drop the warning.

::: warning A Composed Type Can Fail `tsc`
The package reads only the name of each type, not what it holds. The composed interface fails `tsc` when a name aliases a type that an interface can't extend, such as `Money` in `type Money = number`. It also fails when two types declare one member with different types. Give that class its own `#[TsType]` with `inherit: false`.
:::

## Lists and Nullable Values

A value keeps its shape around the type:

- A list of the class publishes a list of the type. That covers an array literal, `collect([...])`, a `list<Chart>` docblock and an `AsCollection::of(Chart::class)` cast, so `[new Panel, new Panel]` publishes `UiNode[]`.
- A value that can be `null` keeps its `| null`, as in `?Dial`, a nullable column, or a ternary with a `null` arm. A type that already includes `null`, such as `'UiNode | null'`, doesn't get a second one.
- A value that is sometimes left out keeps its `?`, as with `$this->when()` in a resource or `Inertia::defer()` in a page.

## Where the Type Applies

The examples below are from one app. Each output shows the keys that its PHP shows.

### Inertia Page Props and Shared Data

A page prop publishes the type of each class value, including the value a deferred or optional prop's closure declares:

```php
return Inertia::render('Ui/Dashboard', [
    'composed' => new Chart,
    'gauge' => new Gauge,
    'pennies' => new Pennies(5),
    'deferred' => Inertia::defer(fn (): Gauge => new Gauge),
    'optional' => Inertia::optional(fn (): Chart => new Chart),
]);
```

The page-props type imports `ChartType` from its module:

```typescript
import type { UiAmount, UiGauge } from "@js/types/ui";
import type { ChartType } from "../../packages/ui";

export type IndexPageProps = Inertia.SharedData & {
  composed: ChartType;
  gauge: UiGauge;
  pennies: UiAmount;
  deferred?: UiGauge;
  optional?: ChartType;
};
```

The `share()` method of your `HandleInertiaRequests` middleware publishes these types the same way.

### API Resources

A resource publishes the type for a value it builds with `new`, and for a helper method's declared return type:

```php
class UiPanelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'chart' => $this->chart(),
            'dial' => $this->dial($request->boolean('dial')),
            'panel' => new Panel,
            'panels' => [new Panel, new Panel],
            'when_panel' => $this->when($request->boolean('panel'), new Panel),
            'maybe_chart' => $request->boolean('chart') ? new Chart : null,
        ];
    }

    protected function chart(): Chart
    {
        return new Chart;
    }

    protected function dial(bool $flag): ?Dial
    {
        return $flag ? new Dial : null;
    }
}
```

The interface imports each type it names:

```typescript
import type { UiNode } from "@js/types/ui";
import type { ChartType, DialType } from "../../packages/ui";

export interface UiPanelResource {
  chart: ChartType;
  dial: DialType | null;
  panel: UiNode;
  panels: UiNode[];
  when_panel?: UiNode;
  maybe_chart: ChartType | null;
}
```

Laravel writes these values with `json_encode()`, not `toArray()`, so `Node` needs a `jsonSerialize()` to send its `toArray()` shape here. See [Keeping the Type True](#keeping-the-type-true).

### Model Attributes and Casts

A model publishes the type for a cast that maps to the class, such as `AsCollection::of()`, and for an accessor that returns it:

```php
class UiBoard extends Model
{
    protected $appends = ['chart'];

    protected function casts(): array
    {
        return [
            'panels' => AsCollection::of(Panel::class),
            'charts' => AsCollection::of(Chart::class),
        ];
    }

    protected function chart(): Attribute
    {
        return Attribute::make(get: fn (): Chart => new Chart);
    }
}
```

The two nullable JSON columns keep their `| null`:

```typescript
import type { UiNode } from "@js/types/ui";
import type { ChartType } from "../packages/ui";

export interface UiBoard {
  panels: UiNode[] | null;
  charts: ChartType[] | null;
  chart: ChartType;
}
```

A custom cast class takes `#[TsType]` the same way, so every column that uses the cast publishes its type:

```php
#[TsType(['type' => 'MenuSettingsType', 'import' => '@js/types/settings'])]
class MenuSettings implements CastsAttributes
{
    public function get(
        Model $model,
        string $key,
        mixed $value,
        array $attributes,
    ): ?array {
        // ...
    }

    // ...
}

class Profile extends Model
{
    protected $casts = [
        'menu_settings' => MenuSettings::class,
    ];
}
```

The `Profile` interface imports the cast's type:

```typescript
import type { MenuSettingsType } from "@js/types/settings";

export interface Profile {
  menu_settings: MenuSettingsType | null;
}
```

### Broadcast Events

An event publishes the type for each public property, and for each property of a value object it holds:

```php
final class Board
{
    public function __construct(
        public Panel $panel = new Panel,
        public Chart $chart = new Chart,
        public ?Gauge $gauge = null,
        public Pennies $total = new Pennies,
        /** @var list<Chart> */
        public array $charts = [],
    ) {}
}

final class UiBoardUpdated implements ShouldBroadcast
{
    public function __construct(
        public Panel $panel,
        public Pennies $pennies,
        public Badge $badge,
        public ?Panel $maybe = null,
        public Chart $chart = new Chart,
        /** @var list<Chart> */
        public array $charts = [],
        public Board $board = new Board,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('ui-board');
    }
}
```

`board` keeps each member's type:

```typescript
import type { UiAmount, UiGauge, UiIcon, UiNode } from "@js/types/ui";
import type { ChartType } from "../packages/ui";

export interface UiBoardUpdated {
  panel: UiNode;
  pennies: UiAmount;
  badge: UiIcon;
  maybe: UiNode | null;
  chart: ChartType;
  charts: ChartType[];
  board: {
    panel: UiNode;
    chart: ChartType;
    gauge: UiGauge | null;
    total: UiAmount;
    charts: ChartType[];
  };
}
```

## Enums

An enum takes `#[TsType]` too:

```php
#[TsType(['type' => 'UiToneDto', 'import' => '@js/types/ui'])]
enum UiTone: string
{
    case Bright = 'bright';
    case Dim = 'dim';
}
```

A value that is the enum itself publishes your type: a case, a property or return type declared as the enum, and an attribute cast to it. The enum's own file, `->value`, `->name` and `EnumResource` keep the enum's names:

```php
return [
    'tone' => UiTone::Bright,
    'tone_resource' => EnumResource::make(UiTone::Bright),
];
```

In `UiPanelResource`, these two keys publish:

```typescript
import { type AsEnum } from "@tolki/ts";

import { UiTone } from "../../enums";
import type { UiToneDto } from "@js/types/ui";

export interface UiPanelResource {
  tone: UiToneDto;
  tone_resource: AsEnum<typeof UiTone>;
}
```

Don't name the type after the enum's own alias, such as `UiToneType` for `UiTone`. A case can then publish the enum's alias instead of yours.

## Models, Resources, and Other Published Classes

A model, an API resource, a broadcast event, a form request, an enum and a controller with routes each publish their own file, so they never compose. Such a class takes its own `#[TsType]`, or else its nearest parent class's. The package leaves out the `#[TsType]` of its traits and interfaces, and `ts:publish` warns. A `#[TsType]` on a model or an API resource doesn't apply to a `new` of that class.

## Keeping the Type True

The package publishes your type as written, so make sure the class sends that shape. Laravel sends an `Arrayable` class in one of two ways:

- Inertia calls `toArray()` on each prop, and on each value inside an array prop. A broadcast event calls it on each public property.
- Laravel writes every other value with `json_encode()`. That covers a value in an API resource's `toArray()` array, in an event's `broadcastWith()` array, and in an array or a value object that an event property holds. `json_encode()` ignores `toArray()` and sends the class's public properties.

So an `Arrayable` class that isn't `JsonSerializable` can send two different shapes. Implement `JsonSerializable` and return `$this->toArray()` from `jsonSerialize()` to send one shape everywhere, or return an API resource for the value instead.

## Configuration

The package writes a composed type's module whenever a published value reaches the class, so most apps need no config. The `class_types` section controls which classes compose:

```php
// config/ts-publish.php
'class_types' => [
    'enabled' => true,
    // Write a module for each composed class in these directories
    'additional_directories' => ['app/Packages/Ui'],
    // Only these classes compose (empty = all)
    'included' => [],
    // These classes never compose
    'excluded' => [],
],
```

Each setting works this way:

- **`enabled`**: set it to `false` to stop composing. Each value then publishes its class's nearest type.
- **`additional_directories`**: the package writes a module for each composed class in these directories, even when no value uses it yet. It scans no directory by default. The [Vite plugin](./vite-plugin.md) watches these classes and the classes, traits and interfaces they take types from. It doesn't watch a composed class that only a published value reaches.
- **`included` and `excluded`**: each list takes class names or directory paths. A class they leave out, or one with [`#[TsExclude]`](./excluding-content.md), doesn't compose, and its values publish its nearest type with no warning.

`php artisan ts:publish --only-class-types` writes only the modules. `--source` with a composed class republishes its module. After you add a composed class, run a full `ts:publish`, because a run that skips class types can write a file that imports a module no run has written yet.

The [Configuration Reference](./configuration-reference.md#class-types-class-types) lists every `class_types.*` key.
