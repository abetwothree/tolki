# Broadcast Events

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates a TypeScript interface for each event that implements `ShouldBroadcast` or `ShouldBroadcastNow`, so the payloads your frontend receives through Laravel Echo are typed. It also writes a combined `broadcast-events.ts` index, with a `BroadcastEvent` union and a flat `BroadcastEvents` const of every Echo event name. An optional module augmentation types Laravel Echo's `Events` interface.

As [Installation & Usage](./index.md) notes, broadcast events don't need the `@tolki/ts` runtime. The output is plain TypeScript interfaces and a plain `const` object.

## How Broadcast Event Types Are Generated

Unlike [broadcast channels](./broadcast-channels.md), events are published one class at a time, like [enums](./enums.md), [models](./models.md) and [form requests](./form-requests.md). The output follows these rules:

- **Discovery**: the package finds every class in `app/Events` that implements `ShouldBroadcast` or `ShouldBroadcastNow`. You can add directories and filter classes, as [Filtering & Excluding](#filtering-excluding) shows.
- **Payload**: each event's interface comes from its `broadcastWith()` method or its public properties. See [Broadcast Data](#broadcast-data).
- **One file per event**: the directory mirrors the event's namespace, as for models and enums, and the file keeps the class name, so `App\Events\OrderShipped` becomes `app/events/OrderShipped.ts`.
- **Index file**: every event also lands in one `broadcast-events.ts` index. See [The Combined Index File](#the-combined-index-file-broadcast-events-ts).
- **Echo augmentation**: optionally, an `echo-broadcast-events.d.ts` file types Laravel Echo. See [Echo Module Augmentation](#echo-module-augmentation).

## Anatomy of a Generated Event File

Given this event:

```php
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("orders.{$this->orderId}");
    }
}
```

The package generates `app/events/OrderShipped.ts`:

```typescript
/** @see App\Events\OrderShipped */
export interface OrderShipped {
  orderId: number;
  trackingNumber: `${string}-${string}-${string}`;
  carrier: string;
  metadata?: Record<string, unknown>;
}
```

The interface follows these rules:

- **Name**: the interface is always named after the event's short class name.
- **`@see` comment**: points back to the fully qualified PHP class.
- **Required properties**: a public property is required when it's promoted in the constructor or has a default. Every property on `OrderShipped` is promoted, so all four are required before `#[TsCasts]` applies.
- **Optional properties**: a property declared in the class body with a type and no default, such as `public string $label;` set in the constructor, is optional (`label?: string`). `json_encode()` leaves out a typed property that was never assigned, and the package can't see an assignment in the constructor. So a property your constructor always sets still gets the `?`. Give it a default, or promote it, to make it required.
- **Nullable properties**: a nullable property is typed `| null`. Nullability alone never makes a key optional.

In this example, three things come from a `#[TsCasts]` override on the class: `trackingNumber`'s template-literal type, `metadata`'s `Record<string, unknown>` type and the `?` on `metadata`. [Overriding Property Types With `#[TsCasts]`](#overriding-property-types-with-tscasts) shows the override. Without it, the two properties would have their inferred types (`string` and `unknown[] | null`), and `metadata` would be required.

## Broadcast Data

By default, every public property becomes an interface field, in declaration order, whether it's promoted in the constructor or declared in the class body. A `@var` docblock wins over the native type, so `/** @var list<string> */ public array $tags` is typed `string[]` rather than `unknown[]`. Properties that come from a trait are skipped, whatever the trait. A [`#[TsExtends]`](./extending-interfaces.md) trait's fields already arrive through the `extends` clause.

Define `broadcastWith()` to send, and type, a different shape, for example to leave out private fields:

```php
class TeamMessageSent implements ShouldBroadcast
{
    public function __construct(
        public int $teamId,
        public string $content,
        private string $senderToken,
    ) {}

    /**
     * @return array{teamId: int, content: string}
     */
    public function broadcastWith(): array
    {
        return [
            'teamId' => $this->teamId,
            'content' => $this->content,
        ];
    }

    public function broadcastOn(): Channel
    {
        return new Channel("teams.{$this->teamId}");
    }
}
```

The interface has only the keys `broadcastWith()` returns:

```typescript
/** @see App\Events\TeamMessageSent */
export interface TeamMessageSent {
  teamId: number;
  content: string;
}
```

`senderToken` never appears in the interface. The package reads the body of `broadcastWith()` and types each `$this->…` value from the event's own properties. The `@return array{teamId: int, content: string}` docblock above is documentation, not a requirement, and the same interface comes out without it.

When the body can't type a value, the `@return array{…}` shape types it:

```php
final class PostScheduled implements ShouldBroadcast
{
    public function __construct(public Post $post) {}

    public function broadcastOn(): Channel
    {
        return new Channel('posts');
    }

    /** @return array{published_at: string|null} */
    public function broadcastWith(): array
    {
        return ['published_at' => $this->publishedAt()];
    }

    private function publishedAt() // no return type
    {
        return $this->post->getAttribute('published_at');
    }
}
```

The docblock fills the key the body couldn't type:

```typescript
/** @see App\Events\PostScheduled */
export interface PostScheduled {
  published_at: string | null;
}
```

The body still wins wherever it types a value. The docblock only fills a key the body left `unknown`, so a stale `@return` can't overwrite a type the body already found. A `key?:` entry in the docblock makes that key optional.

A spread helper that builds its keys by interpolation, such as `"{$name}_tag"`, gives the payload an index signature. When the helper's body can't type the values, its `@return array<string, V>` docblock types them. [API Resources § Interpolated Keys](./api-resources.md#interpolated-keys) describes how the event's `#[TsCasts]` and `extends` clause then apply.

When an event has `broadcastWith()`, including one inherited from a parent class or a trait, only that method shapes the payload. The public properties aren't read. A key it renames, computes or drops shows up exactly that way. `['team' => $this->teamId, 'kind' => 'message', 'count' => count($this->items)]` becomes `{ team: number; kind: string; count: number }`, with no `teamId`.

## Model & Enum-Aware Properties

A property typed as an Eloquent model or a PHP enum resolves to the type the rest of the package uses for it. The file imports that type for you:

```php
class MultiModelEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Post $post,
        public readonly User $user,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel("multi.{$this->post->id}");
    }
}
```

The model properties become `Partial` model types:

```typescript
import type { Post, User } from "../models";

/** @see App\Events\MultiModelEvent */
export interface MultiModelEvent {
  post: Partial<Post>;
  user: Partial<User>;
}
```

The two kinds resolve this way:

- **Eloquent models** resolve to `Partial<Model>`, since a broadcast payload may not include every column. The type is imported from the generated [models](./models.md).
- **PHP enums** resolve to the enum's `{Name}Type` alias, the union of its backing values, or of its case names for a pure enum. The alias is imported from the generated [enums](./enums.md). A rename with [`#[TsEnum]`](./enums.md#tsenum) carries over, so the alias always names a type the enum output declares.

This event has two enum properties:

```php
class EnumBroadcastEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly Status $status,
        public readonly Color $color,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('enum-events');
    }
}
```

Each enum property becomes its type alias:

```typescript
import type { ColorType, StatusType } from "../enums";

/** @see App\Events\EnumBroadcastEvent */
export interface EnumBroadcastEvent {
  status: StatusType;
  color: ColorType;
}
```

::: tip Same-Named Classes
Two properties can need models or enums that share a class name but live in different namespaces. Each import then gets a prefix from its namespace, such as `AppUser` and `CrmUser`, so both work in one file. Events that share a class name get the same treatment in the [combined index](#the-combined-index-file-broadcast-events-ts).
:::

## Custom Echo Event Names With `broadcastAs()`

By default, an event's Echo name follows Laravel's convention: a leading dot, then the fully qualified class name with dots in place of backslashes. Override it with `broadcastAs()`:

```php
class ServerCreated implements ShouldBroadcast
{
    public function __construct(
        public int $serverId,
        public string $serverName,
    ) {}

    public function broadcastAs(): string
    {
        return 'server.created';
    }

    public function broadcastOn(): Channel
    {
        return new Channel('servers');
    }
}
```

`broadcastAs()` doesn't change the interface:

```typescript
/** @see App\Events\ServerCreated */
export interface ServerCreated extends BroadcastableEvent {
  serverId: number;
  serverName: string;
}
```

The string `broadcastAs()` returns, `'server.created'` here, becomes the event's key everywhere: the `BroadcastEvent` union member, the `BroadcastEvents` value and the Echo augmentation key. Without `broadcastAs()`, the key would be `'.App.Events.ServerCreated'`.

`broadcastAs()` has to return one whole string literal. A name built at runtime, such as `return 'order.'.$this->kind;`, has no single value to publish, so the event keeps Laravel's class-name convention. You get a key you can predict, instead of the literal prefix `'order.'`, which Echo would never receive.

The `extends BroadcastableEvent` in this example comes from a `#[TsExtends]` attribute on the class. See [Extending Interfaces](#extending-interfaces-global-config-vs-tsextends) below.

## Overriding Property Types With `#[TsCasts]`

Override an inferred type with `#[TsCasts]` on the event class, the same way as for [models](./models.md#tscasts) and [form requests](./form-requests.md#overriding-field-types-with-tscasts):

```php
#[TsCasts([
    'trackingNumber' => '`${string}-${string}-${string}`',
    'metadata' => ['type' => 'Record<string, unknown>', 'optional' => true],
])]
class OrderShipped implements ShouldBroadcast
{
    public function __construct(
        public int $orderId,
        public string $trackingNumber,
        public string $carrier,
        public ?array $metadata = null,
    ) {}

    // ...
}
```

This override gives `trackingNumber` its template-literal type, and gives `metadata` its `Record<string, unknown>` type and its `?`, in the [Anatomy](#anatomy-of-a-generated-event-file) example. Each entry is a type string, or an array with `type`, `optional` and `import` keys for a custom type that needs an import. A key that names no payload property doesn't add one.

## Extending Interfaces: Global Config vs. `#[TsExtends]`

An event interface can extend shared interfaces through config, through an attribute, or through both at once.

The `ts_extends.broadcast_events` config applies to every event:

```php
// config/ts-publish.php
'ts_extends' => [
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

Every event interface then extends `HasTimestamps`:

```typescript
import type { HasTimestamps } from "@/types/common";

/** @see App\Events\UserNotification */
export interface UserNotification extends HasTimestamps {
  userId: number;
  title: string;
  message: string;
}
```

The `#[TsExtends]` attribute applies to one event class. It also works on a trait the event uses:

```php
#[TsExtends('BroadcastableEvent', '@/types/broadcast')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

See [Extending Interfaces](./extending-interfaces.md) for the attribute and config syntax.

## The Combined Index File (`broadcast-events.ts`)

After it writes the event files, the package combines them into one index:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { MultiModelEvent } from "./app/events/MultiModelEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";
import type { TeamMessageSent } from "./app/events/TeamMessageSent";
import type { UserSynced as AppUserSynced } from "./app/events/UserSynced";
import type { UserSynced as CrmUserSynced } from "./crm/events/UserSynced";

export type BroadcastEvent =
  | ".App.Events.EnumBroadcastEvent"
  | ".App.Events.MultiModelEvent"
  | ".App.Events.OrderShipped"
  | "server.created"
  | ".App.Events.TeamMessageSent"
  | ".App.Events.UserSynced"
  | ".Crm.Events.UserSynced";

export const BroadcastEvents = Object.freeze({
  EnumBroadcastEvent: ".App.Events.EnumBroadcastEvent",
  MultiModelEvent: ".App.Events.MultiModelEvent",
  OrderShipped: ".App.Events.OrderShipped",
  ServerCreated: "server.created",
  TeamMessageSent: ".App.Events.TeamMessageSent",
  AppUserSynced: ".App.Events.UserSynced",
  CrmUserSynced: ".Crm.Events.UserSynced",
} as const);

export type {
  EnumBroadcastEvent,
  MultiModelEvent,
  OrderShipped,
  ServerCreated,
  TeamMessageSent,
  AppUserSynced,
  CrmUserSynced,
};
```

The index has these parts:

- **`BroadcastEvent`**: a union of every event's Echo name, from `broadcastAs()` or the default dotted class name.
- **`BroadcastEvents`**: a flat, frozen const that maps each event's short class name to its Echo name. It's flat, unlike [Wayfinder](https://github.com/laravel/wayfinder)'s nested namespace tree, because you look an event up by what it is, not by where its class lives.
- **Re-exports**: the index re-exports every event interface, so you can import from the index or from the event's own file.
- **Import-conflict aliasing**: two event classes can share a short name, such as `App\Events\UserSynced` and `Crm\Events\UserSynced`. Their imports and const keys then get a prefix from the namespace (`AppUserSynced` and `CrmUserSynced`). It's the same aliasing that [model and enum properties](#model-enum-aware-properties) get inside one event file.

If your app has no broadcast events, the index is `export {};`.

## Echo Module Augmentation

When `broadcast_events.echo_augmentation.enabled` is `true` (the default), the package also writes `echo-broadcast-events.d.ts`:

```typescript
import type { EnumBroadcastEvent } from "./app/events/EnumBroadcastEvent";
import type { OrderShipped } from "./app/events/OrderShipped";
import type { ServerCreated } from "./app/events/ServerCreated";

declare module "@laravel/echo" {
  interface Events {
    ".App.Events.EnumBroadcastEvent": EnumBroadcastEvent;
    ".App.Events.OrderShipped": OrderShipped;
    "server.created": ServerCreated;
  }
}
```

The file augments Laravel Echo's own `Events` interface. `Echo.private(channel).listen(eventName, ...)` and `useEcho()` from `@laravel/echo-vue` or `@laravel/echo-react` then infer the payload type from the event name, with no annotation.

The package picks the `declare module` target in this order:

1. The `broadcast_events.echo_augmentation.echo_package` config value, if set.
2. The first of `@laravel/echo-vue`, `@laravel/echo-react` and `@laravel/echo-svelte` in your `package.json` dependencies or dev dependencies.
3. `@laravel/echo`, the base package every Echo setup depends on.

The file uses the same import-conflict aliasing as the index, so same-named events from different namespaces resolve correctly. If your app has no broadcast events, the package writes no augmentation file.

## Filtering & Excluding

Broadcast events use the same discovery settings as enums, models and form requests. Each list takes class names or directory paths:

```php
// config/ts-publish.php
'broadcast_events' => [
    'included' => [],               // only these event classes (empty = all)
    'excluded' => [],               // leave these event classes out
    'additional_directories' => [], // directories to search besides app/Events
],
```

`#[TsExclude]` on an event class leaves it out of collection and publishing:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Not published to TypeScript
}
```

See [Excluding Content](./excluding-content.md) for the full attribute reference.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `broadcast_events.*` key, including the Echo augmentation options and the class overrides for customizing the pipeline.
