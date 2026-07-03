# Broadcast Events

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) generates one TypeScript interface per `ShouldBroadcast` / `ShouldBroadcastNow` event class, plus a combined `broadcast-events.ts` index file with a `BroadcastEvent` union type and a flat `BroadcastEvents` const of every Echo event name — and, optionally, a module-augmentation file that makes Laravel Echo's `Events` interface fully typed.

As mentioned in [Installation & Usage](./index.md), broadcast events don't need the `@tolki/ts` runtime package — the output is plain TypeScript interfaces and a plain `const` object.

## How Broadcast Event Types Are Generated

Unlike [broadcast channels](./broadcast-channels.md), broadcast events use the same modular, per-class pipeline as [enums](./enums.md), [models](./models.md), and [form requests](./form-requests.md):

- `BroadcastEventsCollector` discovers every class implementing `ShouldBroadcast` or `ShouldBroadcastNow`, by default in `app/Events` (configurable, and it extends the shared `CoreCollector`, so it supports `included` / `excluded` / `additional_directories` and `#[TsExclude]` — see [Filtering & Excluding](#filtering--excluding)).
- Each event class is statically analyzed (via [Surveyor](https://github.com/laravel/surveyor)) to resolve its payload shape — see [Property Resolution](#property-resolution-broadcastwith-vs-public-properties).
- One `.ts` file is written per event, at a namespace-derived path mirroring the event's FQCN (just like models and enums).
- After every event file is generated, `BroadcastEventsIndexWriter` combines them into a single `broadcast-events.ts` index — see [The Combined Index File](#the-combined-index-file-broadcast-eventsts).
- Optionally, `BroadcastEventsEchoWriter` generates `echo-broadcast-events.d.ts`, a module augmentation for Laravel Echo — see [Echo Module Augmentation](#echo-module-augmentation).

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

- The **interface name** is always the event's short PHP class name.
- A `@see` JSDoc comment links back to the fully-qualified PHP class.
- Public constructor properties become required fields by default; a nullable property (`?array $metadata`) becomes optional.
- Here, `trackingNumber`'s template-literal type and `metadata`'s `Record<string, unknown>` type come from a `#[TsCasts]` override on the class — see [`#[TsCasts]`](#tscasts-overriding-property-types) below; without it, both would simply be their raw inferred types (`string` and `unknown[] | null`).

## Property Resolution: `broadcastWith()` vs. Public Properties

By default, every public constructor-promoted property becomes an interface field. Define `broadcastWith()` to send (and type) a different shape — commonly to exclude private/internal fields:

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

```typescript
/** @see Workbench\App\Events\TeamMessageSent */
export interface TeamMessageSent {
    teamId: number;
    content: string;
}
```

`senderToken` never appears in the generated interface. The `@return array{teamId: int, content: string}` PHPDoc shape is what drives the precise property types — without it, Surveyor can't statically infer types from an arbitrary array literal, so add a `@return array{...}` annotation whenever `broadcastWith()`'s shape isn't trivially inferable.

## Model & Enum-Aware Properties

Properties typed as an Eloquent model or a PHP enum resolve to the same types used elsewhere in the package, with imports added automatically:

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

```typescript
import type { Post, User } from '../models';

/** @see Workbench\App\Events\MultiModelEvent */
export interface MultiModelEvent {
    post: Partial<Post>;
    user: Partial<User>;
}
```

- An **Eloquent model** property resolves to `Partial<Model>` (partial, since a broadcast payload may not include every column) with an automatic import from the generated [models](./models.md) output.
- A **PHP enum** property resolves to the enum's `{Name}Type` alias (its raw backing-value type) with an automatic import from the generated [enums](./enums.md) output:

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

```typescript
import type { ColorType, StatusType } from '../enums';

/** @see Workbench\App\Events\EnumBroadcastEvent */
export interface EnumBroadcastEvent {
    status: StatusType;
    color: ColorType;
}
```

> [!TIP]
> When two properties (or two events combined into the index — see [import-conflict aliasing](#the-combined-index-file-broadcast-eventsts)) would import a same-named model or enum from different namespaces, each is automatically aliased with a namespace-derived prefix (e.g. `AppUser` / `CrmUser`) so both imports coexist without a collision.

## Custom Echo Event Names with `broadcastAs()`

By default, the Echo event name is Laravel's own `.Fully.Qualified.ClassName` convention (leading dot, backslashes replaced with dots). Override it with `broadcastAs()`:

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

```typescript
/** @see Workbench\App\Events\ServerCreated */
export interface ServerCreated extends BroadcastableEvent {
    serverId: number;
    serverName: string;
}
```

The literal string returned by `broadcastAs()` (`'server.created'`) becomes this event's key everywhere it's referenced — the `BroadcastEvent` union member, the `BroadcastEvents` const value, and the Echo augmentation key. Without `broadcastAs()`, it would instead be `'.Workbench.App.Events.ServerCreated'`.

(The `extends BroadcastableEvent` here comes from a per-class `#[TsExtends]` attribute — see [Extending Interfaces](#extending-interfaces-global-config-vs-tsextends) below.)

## `#[TsCasts]` — Overriding Property Types

Override an inferred type, or add a virtual property, the same way as [models](./models.md#tscasts) and [form requests](./form-requests.md):

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

This is what produces `trackingNumber`'s template-literal type and `metadata`'s `Record<string, unknown>` type in the [Anatomy](#anatomy-of-a-generated-event-file) example above. As with models and resources, each entry can be a plain type string, or an array with `type`, `optional`, and/or `import` keys for a custom type that needs its own import statement.

## Extending Interfaces: Global Config vs. `#[TsExtends]`

Every generated event interface can `extends` one or more shared interfaces, using either mechanism (both apply together when present):

**Global config** — applies to *every* generated event, via `ts_extends.broadcast_events` in `config/ts-publish.php`:

```php
// config/ts-publish.php
'ts_extends' => [
    'broadcast_events' => [
        ['extends' => 'HasTimestamps', 'import' => '@/types/common'],
    ],
],
```

```typescript
import type { HasTimestamps } from '@/types/common';

/** @see Workbench\App\Events\UserNotification */
export interface UserNotification extends HasTimestamps {
    userId: number;
    title: string;
    message: string;
}
```

**`#[TsExtends]` attribute** — applies to one specific event class:

```php
#[TsExtends('BroadcastableEvent', '@/types/broadcast')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

See [Extending Interfaces](./extending-interfaces.md) for the full attribute and config syntax.

## The Combined Index File (`broadcast-events.ts`)

After every event file is generated, they're combined into a single index:

```typescript
import type { EnumBroadcastEvent } from './app/events/EnumBroadcastEvent';
import type { MultiModelEvent } from './app/events/MultiModelEvent';
import type { OrderShipped } from './app/events/OrderShipped';
import type { ServerCreated } from './app/events/ServerCreated';
import type { TeamMessageSent } from './app/events/TeamMessageSent';
import type { UserSynced as CrmUserSynced } from './crm/events/UserSynced';
import type { UserSynced as AppUserSynced } from './app/events/UserSynced';

export type BroadcastEvent =
    | '.Workbench.App.Events.EnumBroadcastEvent'
    | '.Workbench.App.Events.MultiModelEvent'
    | '.Workbench.App.Events.OrderShipped'
    | 'server.created'
    | '.Workbench.App.Events.TeamMessageSent'
    | '.Workbench.Crm.Events.UserSynced'
    | '.Workbench.App.Events.UserSynced';

export const BroadcastEvents = Object.freeze({
    EnumBroadcastEvent: '.Workbench.App.Events.EnumBroadcastEvent',
    MultiModelEvent: '.Workbench.App.Events.MultiModelEvent',
    OrderShipped: '.Workbench.App.Events.OrderShipped',
    ServerCreated: 'server.created',
    TeamMessageSent: '.Workbench.App.Events.TeamMessageSent',
    CrmUserSynced: '.Workbench.Crm.Events.UserSynced',
    AppUserSynced: '.Workbench.App.Events.UserSynced',
} as const);

export type {
    EnumBroadcastEvent,
    MultiModelEvent,
    OrderShipped,
    ServerCreated,
    TeamMessageSent,
    CrmUserSynced,
    AppUserSynced
};
```

- **`BroadcastEvent`** is a union of every event's Echo name (its `broadcastAs()` string, or the default dot-FQCN).
- **`BroadcastEvents`** is a flat, frozen const mapping each event's short class name to its Echo name — flat, unlike [Wayfinder](https://github.com/laravel/wayfinder)'s deeply-nested namespace tree, since events are addressed by "what event is this?" rather than by where they live in the codebase.
- Every event's interface is also re-exported from the index, so you can import either from the index or directly from the per-event file.
- **Import-conflict aliasing**: when two different event classes share the same short name (like `App\Events\UserSynced` and `Crm\Events\UserSynced` above), both the import and the const key are aliased with a namespace-derived prefix (`AppUserSynced` / `CrmUserSynced`) so both coexist without a collision — the same conflict-resolution strategy used for [model/enum property imports](#model--enum-aware-properties) within a single event file.

An empty event set (no `ShouldBroadcast` classes found) produces `export {};` instead.

## Echo Module Augmentation

When `broadcast_events.echo_augmentation.enabled` is `true` (the default), the package also writes `echo-broadcast-events.d.ts`:

```typescript
import type { EnumBroadcastEvent } from './app/events/EnumBroadcastEvent';
import type { OrderShipped } from './app/events/OrderShipped';
import type { ServerCreated } from './app/events/ServerCreated';

declare module "@laravel/echo" {
    interface Events {
        ".Workbench.App.Events.EnumBroadcastEvent": EnumBroadcastEvent;
        ".Workbench.App.Events.OrderShipped": OrderShipped;
        "server.created": ServerCreated;
    }
}
```

This augments Laravel Echo's own `Events` interface, so `Echo.private(channel).listen(eventName, ...)` and `useEcho()` (from `@laravel/echo-vue` / `@laravel/echo-react`) infer the correct payload type from the event name string, with no manual type annotation needed.

The `declare module` target is resolved with this priority:

1. `broadcast_events.echo_augmentation.echo_package` config value, if set.
2. Auto-detected from your `package.json` dependencies — `@laravel/echo-vue`, then `@laravel/echo-react`, then `@laravel/echo-svelte`.
3. Falls back to `@laravel/echo` (the base package every Echo setup depends on).

The same import-conflict aliasing described above applies here too, so identically-named events from different namespaces resolve correctly.

## Filtering & Excluding

Broadcast events support the same discovery controls as enums, models, and form requests:

```php
// config/ts-publish.php
'broadcast_events' => [
    'included' => [],               // only these event classes (empty = all)
    'excluded' => [],                // exclude these event classes
    'additional_directories' => [],  // extra directories beyond app/Events
],
```

`#[TsExclude]` also works at the class level, since `BroadcastEventsCollector` extends the shared `CoreCollector`:

```php
use AbeTwoThree\LaravelTsPublish\Attributes\TsExclude;

#[TsExclude]
class InternalDebugEvent implements ShouldBroadcast
{
    // Entirely excluded from collection and publishing.
}
```

See [Excluding Content](./excluding-content.md) for the full attribute reference.

## Configuration Reference

The full list of `broadcast_events.*` config keys — including the Echo augmentation sub-options and pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).
