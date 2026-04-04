/**
 * Test fixture data for route tests.
 * Mirrors the generated output shapes from laravel-ts-publisher.
 */

/** Route with no args (zero-arg route). */
export const postsIndex = {
    name: "posts.index",
    url: "/posts",
    domain: null,
    methods: ["get", "head"] as const,
};

/** Route with a single model-bound arg (_routeKey: 'id'). */
export const postsShow = {
    name: "posts.show",
    url: "/posts/{post}",
    domain: null,
    methods: ["get", "head"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with POST method only. */
export const postsStore = {
    name: "posts.store",
    url: "/posts",
    domain: null,
    methods: ["post"] as const,
};

/** Route with PUT + PATCH methods and model binding. */
export const postsUpdate = {
    name: "posts.update",
    url: "/posts/{post}",
    domain: null,
    methods: ["put", "patch"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with DELETE method and model binding. */
export const postsDestroy = {
    name: "posts.destroy",
    url: "/posts/{post}",
    domain: null,
    methods: ["delete"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with enum-bound parameter. */
export const postsByStatus = {
    name: "posts.byStatus",
    url: "/posts/status/{status}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "status", required: true, _enumValues: [0, 1] }] as const,
};

/** Route with string enum values. */
export const postsByCategory = {
    name: "posts.byCategory",
    url: "/posts/category/{category}",
    domain: null,
    methods: ["get"] as const,
    args: [
        {
            name: "category",
            required: true,
            _enumValues: ["fruits", "people"],
        },
    ] as const,
};

/** Route with custom route key (slug binding). */
export const articlesShow = {
    name: "articles.show",
    url: "/articles/{article}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "article", required: true, _routeKey: "slug" }] as const,
};

/** Route with a single optional parameter. */
export const optionalShow = {
    name: "optional.show",
    url: "/optional/{param?}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "param", required: false }] as const,
};

/** Route with multiple optional parameters. */
export const optionalMulti = {
    name: "optional.multi",
    url: "/optional/{one?}/{two?}",
    domain: null,
    methods: ["get"] as const,
    args: [
        { name: "one", required: false },
        { name: "two", required: false },
    ] as const,
};

/** Multi-param route: /users/{user}/posts/{post}. */
export const userPostsShow = {
    name: "user-posts.show",
    url: "/users/{user}/posts/{post}",
    domain: null,
    methods: ["get", "head"] as const,
    args: [
        { name: "user", required: true, _routeKey: "id" },
        { name: "post", required: true, _routeKey: "id" },
    ] as const,
};

/** Route with a `where` constraint on the parameter. */
export const constrainedShow = {
    name: "constrained.show",
    url: "/constrained/{page}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "page", required: true, where: "[0-9]+" }] as const,
};

/** Plain scalar parameter (no binding, no enum). */
export const paramsCamel = {
    name: "params.camel",
    url: "/params/{camelCase}/camel",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "camelCase", required: true }] as const,
};

/** Route with only an optional param at the root for empty-URL edge case. */
export const rootOptional = {
    name: "root.optional",
    url: "/{slug?}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "slug", required: false }] as const,
};

/** Route with an enum arg that has no _routeKey (enum-only). */
export const enumOnly = {
    name: "enum.only",
    url: "/enum/{val}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "val", required: true, _enumValues: ["a", "b"] }] as const,
};

/** Route with a plain required param (no binding, no enum, no where). */
export const plainRequired = {
    name: "plain.required",
    url: "/plain/{thing}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "thing", required: true }] as const,
};

/** Route with a domain non-relative URL. */
export const invoke = {
    name: "invokable.model.bound.plus",
    url: "http://example.com/invokable-model-plus/{post}",
    domain: "http://example.com",
    methods: ["get"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with an HTTPS domain non-relative URL. */
export const extra = {
    name: "invokable.model.bound.extra",
    url: "https://example.com/invokable-model-extra/{post}",
    domain: "https://example.com",
    methods: ["post"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with a protocol-relative domain non-relative URL. */
export const surprise = {
    name: "invokable.model.bound.surprise",
    url: "//example.com/invokable-model-surprise/{post}",
    domain: "//example.com",
    methods: ["delete"] as const,
    args: [{ name: "post", required: true, _routeKey: "id" }] as const,
};

/** Route with multiple optional params where non-trailing ones can be omitted. */
export const optionalMidPath = {
    name: "optional.midpath",
    url: "/team/{team?}/members/{member?}/profile",
    domain: null,
    methods: ["get"] as const,
    args: [
        { name: "team", required: false },
        { name: "member", required: false },
    ] as const,
};

/** Route with a domain and an optional param (mid-path double-slash edge case). */
export const domainOptional = {
    name: "domain.optional",
    url: "https://example.com/org/{org?}/dashboard",
    domain: "https://example.com",
    methods: ["get"] as const,
    args: [{ name: "org", required: false }] as const,
};

/** Route with an invalid regex `where` constraint (malformed pattern). */
export const invalidWhere = {
    name: "invalid.where",
    url: "/invalid/{page}",
    domain: null,
    methods: ["get"] as const,
    args: [{ name: "page", required: true, where: "[abc)" }] as const,
};
