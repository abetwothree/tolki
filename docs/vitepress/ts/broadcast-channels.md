# Broadcast Channels

The [Laravel TypeScript Publisher](https://github.com/abetwothree/laravel-ts-publish) compiles every channel name registered in `routes/channels.php` into a single `broadcast-channels.ts` file — a `BroadcastChannel` template-literal type union plus a `BroadcastChannels` const with a nested accessor function for every dynamic segment, so you build channel names the same way you'd call a route helper instead of hand-typing `{placeholder}` strings.

As mentioned in [Installation & Usage](./index.md), broadcast channels don't need the `@tolki/ts` runtime package — the output is a plain TypeScript union type and a plain object of accessor functions/strings.

## How Broadcast Channel Types Are Generated

Broadcast channels are architecturally different from [enums](./enums.md), [models](./models.md), [resources](https://tolki.abe.dev/ts/), and [form requests](./form-requests.md): there's no per-class collection, filtering, or attributes involved. Instead:

- The collector reads `Illuminate\Broadcasting\BroadcastManager::getChannels()->keys()` directly — the exact set of channel name strings registered via `Broadcast::channel(...)` in `routes/channels.php`.
- **Both registration styles collect identically.** Whether a channel is registered with a closure or a channel class (`Broadcast::channel('orders.{orderId}', OrderChannel::class)`), only the channel *name string* drives the TypeScript output — the authorization callback/class is never inspected.
- Every registered channel is compiled into **one** combined output file (`broadcast_channels.filename`, default `broadcast-channels.ts`) — there's no barrel `index.ts`, no modular per-item files, and no `included` / `excluded` / `additional_directories` filtering, since there's no per-item PHP class to filter by.
- There's no `#[TsExclude]` or `#[TsCasts]` support for the same reason — see [No Per-Channel Attributes](#no-per-channel-attributes).

## Anatomy of the Generated File

Given these registrations:

```php
// routes/channels.php
use Illuminate\Support\Facades\Broadcast;
use Workbench\App\Broadcasting\PublicAnnouncementsChannel;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

Broadcast::channel('user.{userId}.notifications', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Both a terminal channel and a prefix of channels below — see "$channel" Accessor.
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    return true;
});

Broadcast::channel('chat.{roomId}.messages', function ($user, $roomId) {
    return true;
});

// Class-based registration — only the name string matters for the TS output.
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

- **`BroadcastChannel`** is a union of [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) — every `{param}` segment becomes `${string | number}`, regardless of whether the wildcard is bound to a model, an enum, or a plain scalar on the PHP side (the channel name string is the only thing that matters).
- **`BroadcastChannels`** mirrors the dot-notation structure: a channel with no dynamic segments is a plain string constant; a channel with a `{param}` at the end is a function returning the built string; a channel with a `{param}` *and* nested children (like `user.{userId}.notifications`) is a function returning an object of its children.
- Static segments that aren't valid JavaScript identifiers (like `public-announcements`, containing a hyphen) are automatically quoted — see [Quoted Keys](#quoted-keys).

## The Dot-Notation Tree Algorithm

Each channel name is processed independently and then merged into a shared tree, mirroring [Laravel Wayfinder's](https://github.com/laravel/wayfinder) approach:

1. **Split** the channel name on `.` — `user.{userId}.notifications` → `['user', '{userId}', 'notifications']`.
2. **Reverse-iterate** the segments to associate each *static* segment with the `{param}` names that immediately preceded it: `notifications` gets no params, `user` gets `['userId']`.
3. **Forward-iterate** to build a flat dot-notation map with parent keys always appearing before child keys (`user`, then `user.notifications`), so merging later doesn't overwrite a parent with a child.
4. **Merge** every channel's flat entries and un-flatten them into a single nested tree.
5. **Render** the tree recursively: a leaf segment becomes a template-literal string (wrapped in a function if it or an ancestor has params); a branch segment becomes a nested object (also wrapped in a function if it or an ancestor has params).

## Both Registration Styles

Laravel supports registering a channel with either a closure or a dedicated channel class with a `join()` method:

```php
// Closure-based
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return true;
});

// Class-based — the class only affects PHP-side authorization
Broadcast::channel('order.{orderId}', OrderChannel::class);
```

Both produce identical TypeScript output for the same channel name pattern, since the collector only ever reads the channel name string from `BroadcastManager` — it never inspects the closure or class.

## The `"$channel"` Accessor for Overlapping Prefixes

When a channel name is *both* a complete, subscribable channel **and** a dot-notation prefix of other channels (like `chat.{roomId}` alongside `chat.{roomId}.messages`), the generated accessor object needs a way to expose the parent channel string alongside its children. That's what `$channel` is for:

```typescript
BroadcastChannels.chat(42).$channel;  // 'chat.42'         — the chat room itself
BroadcastChannels.chat(42).messages;  // 'chat.42.messages' — the room's message stream
```

Without `$channel`, there would be no way to reach the plain `chat.{roomId}` channel string once `chat` becomes a function returning an object with `messages` as a key.

## Quoted Keys

Static segments containing characters that aren't valid in a bare JavaScript object key (like hyphens) are automatically wrapped in quotes:

```typescript
export const BroadcastChannels = {
    "public-announcements": `public-announcements` as const,
    "order-status": (statusId: string | number) => `order-status.${statusId}` as const,
};
```

```typescript
BroadcastChannels["public-announcements"];
BroadcastChannels["order-status"](3);
```

## The `BroadcastChannel` Type

Every registered channel name contributes one member to the `BroadcastChannel` union — useful for typing a helper that accepts any valid channel string without hard-coding a specific one:

```typescript
import type { BroadcastChannel } from '@js/types/data/broadcast-channels';

function subscribe(channel: BroadcastChannel) {
    return Echo.private(channel);
}

subscribe(BroadcastChannels.orders(42)); // ✓
subscribe('not-a-real-channel');         // ✗ type error
```

## No Per-Channel Attributes

Because channels are collected as plain name strings (not reflected PHP classes), the attribute-based customization available for [enums](./enums.md#enum-attributes), [models](./models.md#model-attributes), and [form requests](./form-requests.md#tscasts-overriding-field-types) doesn't apply here:

- **No `#[TsExclude]`** — to omit a channel from the output, remove or conditionally skip its `Broadcast::channel(...)` registration in `routes/channels.php` (e.g. behind an `if (! app()->isProduction())` check) instead.
- **No `#[TsCasts]`** — there's no per-channel type to override; every dynamic segment is always `string | number`, matching how a channel name is resolved at broadcast-auth time regardless of what PHP type it's bound to.
- **No `included` / `excluded` / `additional_directories` config** — every channel registered anywhere Laravel loads `routes/channels.php` is included; there's no directory to search since channels aren't backed by individual class files.

## Configuration Reference

The full list of `broadcast_channels.*` config keys — including pipeline class overrides for advanced customization — lives in the [Configuration Reference](./configuration-reference.md).
