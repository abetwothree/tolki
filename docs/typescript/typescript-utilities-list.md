# Tolki TypeScript Utilities List

## Model Utilities Types

Unless you're using a package like [Model Typer](https://github.com/fumeapp/modeltyper) or [Laravel Wayfinder](https://github.com/laravel/wayfinder), you probably find yourself defining models manually on a TypeScript based Laravel project.

The purpose of the following model utility types is to simplify and standardize the way you define these models.

### Model Types

You can use the simplest `Model` type which only defines a possibly undefined id key and any number of string keyed unknown values.

The `Model` type receives a generic parameter to define the type of ID it should be. With that defined, you can now use any number of columns on a `User` type, however, they'll simply register as `unknown`.

```typescript
import type { Model } from "@tolki/types";

interface User extends Model<number> {
    title: string;
}

const user: User = getUser();

user.id // inferred as number
user.title // inferred as string
user.created_at // inferred as unknown
```

If you'd like to auto define time stamp columns, you can use the `TimestampModel` type, the `SoftDeleteModel`, or the `AllTimestampsModel` type to define `created_at`, `updated_at`, and `deleted_at` in one go.

```typescript
import type { TimestampModel, SoftDeleteModel, AllTimestampsModel } from "@tolki/types";

interface User extends TimestampModel<number> {
    title: string;
}

const user: User = getUser();

user.id // inferred as number
user.title // inferred as string
user.created_at // inferred as string
user.updated_at // inferred as string

interface Post extends SoftDeleteModel<string> {}

const post: Post = getPost();

post.id // inferred as string
post.deleted_at // inferred as string

interface Notification extends AllTimestampsModel<number> {
    message: string;
}

const notification: Notification = getNotification();

notification.id // inferred as number
notification.message // inferred as string
notification.created_at // inferred as string
notification.updated_at // inferred as string
notification.deleted_at // inferred as string
```

## Paginator Utilities Types

Laravel provides 3 built in [pagination modes](https://laravel.com/docs/pagination). Each returns a similar but slightly different structured response. When you're working on the front end and using TypeScript, you'd have to write out what each response structure looks like for each pagination mode. These utility types provide you the type-safe representations of these responses, making it easier to define pagination data structures in a type safe manner.

### LengthAwarePaginator

Imagine you have a Laravel controller with an Inertia response of your users table paginated.

```PHP
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users', [
            'users' => User::query()->paginate(15),
        ]);
    }
}
```

On your TypeScript based front end, you can quickly define what the pagination response structure looks like by importing the `LengthAwarePaginator` type.

The `LengthAwarePaginator` type receives a single generic type parameter which represents the type of the individual items in the paginated data.

```vue
<script setup lang="ts">
import type { LengthAwarePaginator } from "@tolki/types";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

defineProps<{
  users: LengthAwarePaginator<User>;
}>();
</script>
```

The example above is a script section of a Vue single file component, but it can be applied to React or Svelte just as easily.

With that definition above, you can now use the structure with type safety of the pagination result in your front-end.

Example in Vue template:

```vue
<template>
  <div>
    <table v-if="users.data.length > 0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users.data" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.created_at }}</td>
          <td>{{ user.updated_at }}</td>
        </tr>
      </tbody>
    </table>

    <div v-else>No users found.</div>

    <div>
      Showing results from {{ users.from }} to {{ users.to }} of
      {{ users.total }}
    </div>
  </div>
</template>
```

### SimplePaginator

If you use the `simplePaginate` response function as show below, you can use the `SimplePaginator` type to define the response structure.

Example Laravel controller:

```PHP
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users', [
            'users' => User::query()->simplePaginate(15),
        ]);
    }
}
```

In your TypeScript based front end, you can use the `SimplePaginator` type, which also accepts a single generic parameter to define the data structure.

```vue
<script setup lang="ts">
import type { SimplePaginator } from "@tolki/types";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

defineProps<{
  users: SimplePaginator<User>;
}>();
</script>
```

### CursorPaginator

The last pagination result that Laravel provides is the `cursor` pagination. For that response structure you can use the `CursorPaginator` type.

Example Laravel controller:

```PHP
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Users', [
            'users' => User::query()->cursorPaginate(15),
        ]);
    }
}
```

In your TypeScript based front end, you can now use the `CursorPaginator` type to define the response structure, which also accepts a single generic parameter to define the data structure.

```vue
<script setup lang="ts">
import type { CursorPaginator } from "@tolki/types";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

defineProps<{
  users: CursorPaginator<User>;
}>();
</script>
```

### Pagination components

You can also use the pagination types to write type safe pagination components for your front end UI. A rough incomplete pagination example that supports all three pagination response types would look something like this.

```vue
<script setup lang="ts" generic="T">
import type {
  CursorPaginator,
  LengthAwarePaginator,
  SimplePaginator,
} from "@tolki/types";

defineProps<{
  data: LengthAwarePaginator<T> | SimplePaginator<T> | CursorPaginator<T>;
}>;
</script>

<template>
  <div>
    <!-- pagination UI implementation -->
  </div>
</template>
```

Then you'd use your pagination component like this:

```vue
<script setup lang="ts">
import type { LengthAwarePaginator } from "@tolki/types";

interface User {
  /* .. */
}

defineProps<{
  users: LengthAwarePaginator<User>;
}>();
</script>

<template>
  <div>
    <!-- T is inferred as User -->
    <Pagination :data="users" />
  </div>
</template>
```

## JsonResource Utilities Types
