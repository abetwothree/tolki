---
"@tolki/types": minor
---

Adds types for resource collections paginated with `simplePaginate()` or `cursorPaginate()`, and for the JSON:API documents a Laravel `JsonApiResource` sends (Laravel 12.45 and later).

- Type correction: `from` and `to` are `null` on an empty page, so `SimplePaginator`, `LengthAwarePaginator` and `JsonResourceMeta` now type them `number | null`. Code that uses them as a `number` needs a `null` check.
- `JsonResourceSimplePaginator<T>`, `ResourceSimplePagination` and `JsonResourceSimpleMeta` type a `simplePaginate()` resource collection.
- `JsonResourceCursorPaginator<T>`, `ResourceCursorPagination` and `JsonResourceCursorMeta` type a `cursorPaginate()` resource collection.
- `SimplePaginator` and `JsonResourceSimpleMeta` gain an optional `current_page_url`, which Laravel sends from 12.15.
- `PaginatorLink` gains an optional `page`, which Laravel sends from 12.23 on every link but the `...` separator.
- `JsonApiDocument`, `JsonApiCollection`, `JsonApiPaginator`, `JsonApiSimplePaginator` and `JsonApiCursorPaginator` type a JSON:API response, given its resource object and what `included` may hold.
- `JsonApiResourceObject`, `JsonApiResourceIdentifier`, `JsonApiToOneRelationship`, `JsonApiToManyRelationship`, `JsonApiRelationship` and `JsonApiObject` type a document's parts.
- `JsonApiSparse` types a resource object read with a sparse fieldset, such as `?fields[posts]=title`.
