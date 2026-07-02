---
"@tolki/ts": patch
---

Fix `defineRoute()`'s bare `.form(...)` call so it spoofs the route's primary method (adding `_method=PUT`/`PATCH`/`DELETE` etc.) exactly like Laravel Wayfinder's `.form()` does, and like the existing per-verb `.form.<verb>(...)` variants already did.

Previously, calling `.form(...)` with no verb on a route whose primary method wasn't `GET` or `POST` (e.g. an `update` or `destroy` action) built an `action` URL with no `_method` field, so the form would silently submit as the wrong HTTP verb unless the caller explicitly used `.form.put(...)`, `.form.patch(...)`, or `.form.delete(...)`.
