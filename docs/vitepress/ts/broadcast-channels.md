# Broadcast Channels

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) compiles every channel you register in `routes/channels.php` into one `broadcast-channels.ts` file. The file holds a `BroadcastChannel` union of template literal types, and a `BroadcastChannels` const with an accessor for every dynamic segment. You build a channel name the way you call a route helper, instead of typing `{placeholder}` strings by hand.

As [Installation & Usage](./index.md) notes, broadcast channels don't need the `@tolki/ts` runtime. The output is a plain union type and a plain object of strings and accessor functions.

## How Broadcast Channel Types Are Generated

Broadcast channels work differently from [enums](./enums.md), [models](./models.md), [resources](./api-resources.md) and [form requests](./form-requests.md). There's no class to collect or filter, and no attributes:

- **Every registered channel**: the package reads every channel name you register with `Broadcast::channel(...)`.
- **Only the name matters**: a closure and a channel class publish the same way, as [Both Registration Styles](#both-registration-styles) shows.
- **One combined file**: every channel goes into one file, named by `broadcast_channels.filename` (`broadcast-channels.ts` by default). There's no `index.ts` barrel, no per-channel files, and no `included`, `excluded` or `additional_directories` filtering, since no PHP class backs a channel. With no channels registered, the file is `export {};`.
- **No attributes**: `#[TsExclude]` and `#[TsCasts]` don't apply, for the same reason. See [No Per-Channel Attributes](#no-per-channel-attributes).

## Anatomy of the Generated File

Given these registrations:

```php
// routes/channels.php
use App\Broadcasting\PublicAnnouncementsChannel;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Both a channel of its own and the start of the channel below.
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    return true;
});

Broadcast::channel('chat.{roomId}.messages', function ($user, $roomId) {
    return true;
});

// A channel class. Only the name string affects the TypeScript output.
Broadcast::channel('public-announcements', PublicAnnouncementsChannel::class);
```

The package generates:

```typescript
export type BroadcastChannel =
  | `orders.${string | number}`
  | `user.${string | number}.notifications`
  | `chat.${string | number}`
  | `chat.${string | number}.messages`
  | `public-announcements`;

export const BroadcastChannels = {
  orders: (orderId: string | number) => `orders.${orderId}` as const,
  user: (userId: string | number) => ({
    notifications: `user.${userId}.notifications` as const,
  }),
  chat: (roomId: string | number) => ({
    $channel: `chat.${roomId}` as const,
    messages: `chat.${roomId}.messages` as const,
  }),
  "public-announcements": `public-announcements` as const,
};
```

The file has two exports:

- **`BroadcastChannel`**: a union of [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html). Each `{param}` segment becomes `${string | number}`, whether PHP binds it to a model, an enum or a scalar, since only the channel name matters.
- **`BroadcastChannels`**: an object that mirrors the dot-notation names. A channel with no dynamic segments is a string constant. A channel that ends in a `{param}` is a function that returns the channel name. A channel with a `{param}` and more segments after it, like `user.{userId}.notifications`, is a function that returns an object of the segments that follow.

A static segment that isn't a valid JavaScript identifier, such as `public-announcements` with its hyphen, becomes a quoted key. See [Quoted Keys](#quoted-keys).

## How Channel Names Become Accessors

The accessor shape follows [Laravel Wayfinder](https://github.com/laravel/wayfinder)'s. The package splits each channel name on `.` and builds `BroadcastChannels` from the pieces:

- **Static segments** become keys, nested in the order they appear.
- **`{param}` segments** become the parameters of the function for the static segment before them, so `orders.{orderId}` gives `orders(orderId)`.
- **Shared leading segments** share one key. `chat.{roomId}` and `chat.{roomId}.messages` both live under `BroadcastChannels.chat(roomId)`.

::: warning Shared Segments Need the Same Parameter Names
Channels that share a segment have to give its parameters the same names. `orders.{orderId}` beside `orders.{slug}.timeline` gives the `orders` key two different parameters, and `ts:publish` fails with a "conflicting parameter names" error. Rename one wildcard so the two match.
:::

## Both Registration Styles

Laravel lets you register a channel with a closure or with a channel class that has a `join()` method:

```php
// A closure
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

// A channel class, which only affects authorization in PHP
Broadcast::channel('order.{orderId}', OrderChannel::class);
```

Both produce the same TypeScript for the same channel name, because the package reads only the name. It never reads the closure or the class.

## The `$channel` Accessor for Overlapping Prefixes

When a channel name is a channel of its own and also the start of other channels, like `chat.{roomId}` beside `chat.{roomId}.messages`, its accessor returns an object. `$channel` on that object is the shorter channel's own name:

```typescript
BroadcastChannels.chat(42).$channel; // 'chat.42', the chat room itself
BroadcastChannels.chat(42).messages; // 'chat.42.messages', the room's message stream
```

Without `$channel`, you couldn't reach the plain `chat.{roomId}` channel once `chat` returns an object with a `messages` key.

## Quoted Keys

A static segment with characters a bare JavaScript key can't hold, such as a hyphen, is quoted:

```typescript
export const BroadcastChannels = {
  "public-announcements": `public-announcements` as const,
  "order-status": (statusId: string | number) =>
    `order-status.${statusId}` as const,
};
```

Reach a quoted key with bracket notation:

```typescript
BroadcastChannels["public-announcements"];
BroadcastChannels["order-status"](3);
```

## The `BroadcastChannel` Type

Each registered channel adds one member to the `BroadcastChannel` union. Use it to type a helper that accepts any valid channel name without naming a specific one:

```typescript
import type { BroadcastChannel } from "@js/types/data/broadcast-channels";

function subscribe(channel: BroadcastChannel) {
  return Echo.private(channel);
}

subscribe(BroadcastChannels.orders(42)); // ✓
subscribe("not-a-real-channel"); // ✗ type error
```

## No Per-Channel Attributes

Channels are collected as plain name strings, not as PHP classes, so the attributes available for [enums](./enums.md#enum-attributes), [models](./models.md#model-attributes) and [form requests](./form-requests.md#overriding-field-types-with-tscasts) don't apply:

- **No `#[TsExclude]`**: to leave a channel out, remove its `Broadcast::channel(...)` registration, or skip it with a condition in `routes/channels.php`, such as `if (! app()->isProduction())`.
- **No `#[TsCasts]`**: there's no per-channel type to override. Every dynamic segment is `string | number`, matching how Laravel resolves a channel name when it authorizes a subscription, whatever PHP type the segment binds to.
- **No `included`, `excluded` or `additional_directories` config**: every channel your app registers is included. There's no directory to search, since channels don't live in class files.

## Configuration Reference

The [Configuration Reference](./configuration-reference.md) lists every `broadcast_channels.*` key, including the class overrides for customizing the pipeline.
