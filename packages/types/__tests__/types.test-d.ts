import type {
    AllTimestampsModel,
    AnonymousResourceCollection,
    AsAvg,
    AsCount,
    AsExists,
    AsMax,
    AsMin,
    AsSum,
    CursorPaginator,
    JsonApiCollection,
    JsonApiCursorPaginator,
    JsonApiDocument,
    JsonApiObject,
    JsonApiPaginator,
    JsonApiRelationship,
    JsonApiResourceIdentifier,
    JsonApiResourceObject,
    JsonApiSimplePaginator,
    JsonApiSparse,
    JsonApiToManyRelationship,
    JsonApiToOneRelationship,
    JsonResourceCursorMeta,
    JsonResourceCursorPaginator,
    JsonResourceLinks,
    JsonResourceMeta,
    JsonResourcePaginator,
    JsonResourceSimpleMeta,
    JsonResourceSimplePaginator,
    LengthAwarePaginator,
    Model,
    PaginatorLink,
    ResourceCursorPagination,
    ResourcePagination,
    ResourceSimplePagination,
    SimplePaginator,
    SoftDeleteModel,
    SoftDeletes,
    TimestampModel,
    Timestamps,
    WithAvg,
    WithCount,
    WithExists,
    WithMax,
    WithMin,
    WithSum,
} from "@tolki/types";
import { expectTypeOf, test } from "vitest";

declare type Data = Record<string, unknown>[];

type IsExact<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
type Assert<T extends true> = T;
type IsAssignable<A, B> = A extends B ? true : false;

interface FullModel
    extends
        AllTimestampsModel,
        WithCount<"posts">,
        WithMax<"rating">,
        WithMin<"rating">,
        WithSum<"rating">,
        WithAvg<"rating">,
        WithExists<"orders"> {}

test("SimplePaginator", () => {
    expectTypeOf<SimplePaginator<Data>>().toEqualTypeOf<
        SimplePaginator<Data>
    >();
});

test("LengthAwarePaginator", () => {
    expectTypeOf<LengthAwarePaginator<Data>>().toEqualTypeOf<
        LengthAwarePaginator<Data>
    >();
});

test("CursorPaginator", () => {
    expectTypeOf<CursorPaginator<Data>>().toEqualTypeOf<
        CursorPaginator<Data>
    >();
});

test("PaginatorLink", () => {
    expectTypeOf<PaginatorLink>().toEqualTypeOf<PaginatorLink>();
});

test("Model", () => {
    expectTypeOf<Model>().toEqualTypeOf<Model>();
});

test("Timestamps", () => {
    expectTypeOf<Timestamps>().toEqualTypeOf<Timestamps>();
});

test("SoftDeletes", () => {
    expectTypeOf<SoftDeletes>().toEqualTypeOf<{
        deleted_at?: string | null;
    }>();
});

test("TimestampModel", () => {
    expectTypeOf<TimestampModel>().toEqualTypeOf<TimestampModel>();
});

test("SoftDeleteModel", () => {
    expectTypeOf<SoftDeleteModel>().toEqualTypeOf<SoftDeleteModel>();
});

test("AllTimestampsModel", () => {
    expectTypeOf<AllTimestampsModel>().toEqualTypeOf<AllTimestampsModel>();
});

test("AsCount", () => {
    expectTypeOf<AsCount<string>>().toEqualTypeOf<AsCount<string>>();
});

test("AsMax", () => {
    expectTypeOf<AsMax<string>>().toEqualTypeOf<AsMax<string>>();
});

test("AsMin", () => {
    expectTypeOf<AsMin<string>>().toEqualTypeOf<AsMin<string>>();
});

test("AsSum", () => {
    expectTypeOf<AsSum<string>>().toEqualTypeOf<AsSum<string>>();
});

test("AsAvg", () => {
    expectTypeOf<AsAvg<string>>().toEqualTypeOf<AsAvg<string>>();
});

test("AsExists", () => {
    expectTypeOf<AsExists<string>>().toEqualTypeOf<AsExists<string>>();
});

test("WithCount", () => {
    expectTypeOf<WithCount<string>>().toEqualTypeOf<WithCount<string>>();
});

test("WithMax", () => {
    expectTypeOf<WithMax<string>>().toEqualTypeOf<WithMax<string>>();
});

test("WithMin", () => {
    expectTypeOf<WithMin<string>>().toEqualTypeOf<WithMin<string>>();
});

test("WithSum", () => {
    expectTypeOf<WithSum<string>>().toEqualTypeOf<WithSum<string>>();
});

test("WithAvg", () => {
    expectTypeOf<WithAvg<string>>().toEqualTypeOf<WithAvg<string>>();
});

test("WithExists", () => {
    expectTypeOf<WithExists<string>>().toEqualTypeOf<WithExists<string>>();
});

test("JsonResourcePaginator", () => {
    expectTypeOf<JsonResourcePaginator<Data>>().toEqualTypeOf<
        JsonResourcePaginator<Data>
    >();
});

test("AnonymousResourceCollection", () => {
    expectTypeOf<AnonymousResourceCollection<Data>>().toEqualTypeOf<
        AnonymousResourceCollection<Data>
    >();
});

test("JsonResourceLinks", () => {
    expectTypeOf<JsonResourceLinks>().toEqualTypeOf<JsonResourceLinks>();
});

test("JsonResourceMeta", () => {
    expectTypeOf<JsonResourceMeta>().toEqualTypeOf<JsonResourceMeta>();
});

test("ResourcePagination", () => {
    expectTypeOf<ResourcePagination>().toEqualTypeOf<ResourcePagination>();
    expectTypeOf<
        ResourcePagination["meta"]
    >().toEqualTypeOf<JsonResourceMeta>();
    expectTypeOf<
        ResourcePagination["links"]
    >().toEqualTypeOf<JsonResourceLinks>();
});

// ----------------------------------------------
// What Laravel 13 sends for `paginate(2)`, `simplePaginate(2)` and `cursorPaginate(2)` over three cards
// ----------------------------------------------

interface Card {
    id: number;
    title: string;
}

// A bare paginator sends each model's own `toArray()`, timestamps included.
interface CardRow extends Card {
    created_at: string | null;
    updated_at: string | null;
}

const cards = [
    { id: 1, title: "Alpha" },
    { id: 2, title: "Beta" },
] satisfies Card[];

const cardRows = [
    {
        id: 1,
        title: "Alpha",
        created_at: "2026-10-15T15:35:05.000000Z",
        updated_at: "2026-10-15T15:35:05.000000Z",
    },
    {
        id: 2,
        title: "Beta",
        created_at: "2026-10-15T15:35:05.000000Z",
        updated_at: "2026-10-15T15:35:05.000000Z",
    },
] satisfies CardRow[];

const lengthAwareLinks = [
    { url: null, label: "&laquo; Previous", page: null, active: false },
    { url: "http://localhost/cards?page=1", label: "1", page: 1, active: true },
    {
        url: "http://localhost/cards?page=2",
        label: "2",
        page: 2,
        active: false,
    },
    {
        url: "http://localhost/cards?page=2",
        label: "Next &raquo;",
        page: 2,
        active: false,
    },
] satisfies PaginatorLink[];

test("each paginated resource collection type accepts what Laravel sends", () => {
    expectTypeOf({
        data: cards,
        links: {
            first: "http://localhost/cards?page=1",
            last: "http://localhost/cards?page=2",
            prev: null,
            next: "http://localhost/cards?page=2",
        },
        meta: {
            current_page: 1,
            from: 1,
            last_page: 2,
            links: lengthAwareLinks,
            path: "http://localhost/cards",
            per_page: 2,
            to: 2,
            total: 3,
        },
    } satisfies JsonResourcePaginator<Card>).toExtend<
        JsonResourcePaginator<Card>
    >();

    expectTypeOf({
        data: cards,
        links: {
            first: "http://localhost/cards?page=1",
            last: null,
            prev: null,
            next: "http://localhost/cards?page=2",
        },
        meta: {
            current_page: 1,
            current_page_url: "http://localhost/cards?page=1",
            from: 1,
            path: "http://localhost/cards",
            per_page: 2,
            to: 2,
        },
    } satisfies JsonResourceSimplePaginator<Card>).toExtend<
        JsonResourceSimplePaginator<Card>
    >();

    expectTypeOf({
        data: cards,
        links: {
            first: null,
            last: null,
            prev: null,
            next: "http://localhost/cards?cursor=eyJjYXJkcy5pZCI6MiwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
        },
        meta: {
            path: "http://localhost/cards",
            per_page: 2,
            next_cursor:
                "eyJjYXJkcy5pZCI6MiwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
            prev_cursor: null,
        },
    } satisfies JsonResourceCursorPaginator<Card>).toExtend<
        JsonResourceCursorPaginator<Card>
    >();

    expectTypeOf({
        data: [],
        links: {
            first: "http://localhost/cards?page=1",
            last: null,
            prev: null,
            next: null,
        },
        meta: {
            current_page: 1,
            current_page_url: "http://localhost/cards?page=1",
            from: null,
            path: "http://localhost/cards",
            per_page: 2,
            to: null,
        },
    } satisfies JsonResourceSimplePaginator<Card>).toExtend<
        JsonResourceSimplePaginator<Card>
    >();
});

test("each paginator type accepts what Laravel sends", () => {
    expectTypeOf({
        current_page: 1,
        data: cardRows,
        first_page_url: "http://localhost/cards?page=1",
        from: 1,
        last_page: 2,
        last_page_url: "http://localhost/cards?page=2",
        links: lengthAwareLinks,
        next_page_url: "http://localhost/cards?page=2",
        path: "http://localhost/cards",
        per_page: 2,
        prev_page_url: null,
        to: 2,
        total: 3,
    } satisfies LengthAwarePaginator<CardRow>).toExtend<
        LengthAwarePaginator<CardRow>
    >();

    expectTypeOf({
        current_page: 1,
        current_page_url: "http://localhost/cards?page=1",
        data: cardRows,
        first_page_url: "http://localhost/cards?page=1",
        from: 1,
        next_page_url: "http://localhost/cards?page=2",
        path: "http://localhost/cards",
        per_page: 2,
        prev_page_url: null,
        to: 2,
    } satisfies SimplePaginator<CardRow>).toExtend<SimplePaginator<CardRow>>();

    expectTypeOf({
        data: cardRows,
        path: "http://localhost/cards",
        per_page: 2,
        next_cursor: "eyJjYXJkcy5pZCI6MiwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
        next_page_url:
            "http://localhost/cards?cursor=eyJjYXJkcy5pZCI6MiwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
        prev_cursor: null,
        prev_page_url: null,
    } satisfies CursorPaginator<CardRow>).toExtend<CursorPaginator<CardRow>>();

    // `firstItem()` and `lastItem()` are `null` on a page with no items.
    expectTypeOf({
        current_page: 1,
        current_page_url: "http://localhost/cards?page=1",
        data: [],
        first_page_url: "http://localhost/cards?page=1",
        from: null,
        next_page_url: null,
        path: "http://localhost/cards",
        per_page: 2,
        prev_page_url: null,
        to: null,
    } satisfies SimplePaginator<CardRow>).toExtend<SimplePaginator<CardRow>>();
});

test("a simple or cursor meta block claims no length-aware field", () => {
    expectTypeOf<JsonResourceSimpleMeta>().not.toHaveProperty("total");
    expectTypeOf<JsonResourceSimpleMeta>().not.toHaveProperty("last_page");
    expectTypeOf<JsonResourceSimpleMeta>().not.toHaveProperty("links");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("total");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("last_page");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("links");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("current_page");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("from");
    expectTypeOf<JsonResourceCursorMeta>().not.toHaveProperty("to");
    expectTypeOf<JsonResourceCursorMeta>()
        .toHaveProperty("next_cursor")
        .toEqualTypeOf<string | null>();
    expectTypeOf<JsonResourceCursorMeta>()
        .toHaveProperty("prev_cursor")
        .toEqualTypeOf<string | null>();
});

test("the simple and cursor pagination blocks compose like ResourcePagination", () => {
    expectTypeOf<
        ResourceSimplePagination["meta"]
    >().toEqualTypeOf<JsonResourceSimpleMeta>();
    expectTypeOf<
        ResourceSimplePagination["links"]
    >().toEqualTypeOf<JsonResourceLinks>();
    expectTypeOf<
        ResourceCursorPagination["meta"]
    >().toEqualTypeOf<JsonResourceCursorMeta>();
    expectTypeOf<
        ResourceCursorPagination["links"]
    >().toEqualTypeOf<JsonResourceLinks>();

    // `.branded` compares an interface with an intersection by structure.
    expectTypeOf<JsonResourcePaginator<Card>>().branded.toEqualTypeOf<
        { data: Card[] } & ResourcePagination
    >();
    expectTypeOf<JsonResourceSimplePaginator<Card>>().branded.toEqualTypeOf<
        { data: Card[] } & ResourceSimplePagination
    >();
    expectTypeOf<JsonResourceCursorPaginator<Card>>().branded.toEqualTypeOf<
        { data: Card[] } & ResourceCursorPagination
    >();

    // A collection that renames its wrap key keeps each kind's pagination block.
    expectTypeOf({
        items: cards,
        links: {
            first: null,
            last: null,
            prev: null,
            next: null,
        },
        meta: {
            path: "http://localhost/cards",
            per_page: 2,
            next_cursor: null,
            prev_cursor: null,
        },
    } satisfies {
        items: Card[];
    } & ResourceCursorPagination).toExtend<ResourceCursorPagination>();
});

test("PaginatorLink's page is optional, since the separator has none", () => {
    expectTypeOf<PaginatorLink["page"]>().toEqualTypeOf<
        number | null | undefined
    >();

    // `LengthAwarePaginator::linkCollection()` sends the `...` separator without a `page`.
    expectTypeOf([
        { url: null, label: "&laquo; Previous", page: null, active: false },
        {
            url: "http://localhost/cards?page=1",
            label: "1",
            page: 1,
            active: true,
        },
        { url: null, label: "...", active: false },
    ] satisfies PaginatorLink[]).toExtend<PaginatorLink[]>();
});

test("SimplePaginator's current_page_url is optional, since Laravel before 12.15 does not send it", () => {
    expectTypeOf<SimplePaginator<Card>["current_page_url"]>().toEqualTypeOf<
        string | undefined
    >();
    expectTypeOf<JsonResourceSimpleMeta["current_page_url"]>().toEqualTypeOf<
        string | undefined
    >();
    expectTypeOf<LengthAwarePaginator<Card>>().not.toHaveProperty(
        "current_page_url",
    );
});

// ----------------------------------------------
// What Laravel 13's `JsonApiResource` sends: the resource objects the documents below hold
// ----------------------------------------------

interface UserResource {
    id: string;
    type: "users";
    attributes: { name: string; email: string };
}

interface CommentResource {
    id: string;
    type: "comments";
    attributes: { content: string; is_flagged: boolean };
    relationships?: { user?: JsonApiToOneRelationship<"users"> };
}

interface CategoryResource {
    id: string;
    type: "categories";
    attributes: { name: string; slug: string };
}

interface PostResource {
    id: string;
    type: "posts";
    attributes: {
        title: string;
        content: string;
        word_count: number | null;
        published_at: string | null;
    };
    relationships?: {
        author?: JsonApiToOneRelationship<"users">;
        comments?: JsonApiToManyRelationship<"comments">;
        categoryRel?: JsonApiToOneRelationship<"categories">;
    };
}

interface LinkedPostResource {
    id: string;
    type: "linked_posts";
    attributes: { title: string };
    links?: { self: string };
    meta?: { readable: boolean; words: number | null };
}

type PostIncluded = UserResource | CommentResource | CategoryResource;

const firstPost = {
    id: "1",
    type: "posts",
    attributes: {
        title: "First",
        content: "Body one",
        word_count: 1200,
        published_at: null,
    },
} satisfies PostResource;

const secondPost = {
    id: "2",
    type: "posts",
    attributes: {
        title: "Second",
        content: "Body two",
        word_count: 10,
        published_at: null,
    },
} satisfies PostResource;

test("a JSON:API document accepts what Laravel sends", () => {
    // `?include=author,comments,categoryRel`
    expectTypeOf({
        data: {
            ...firstPost,
            relationships: {
                author: { data: { id: "1", type: "users" } },
                comments: {
                    data: [
                        { id: "1", type: "comments" },
                        { id: "2", type: "comments" },
                    ],
                },
                categoryRel: { data: null },
            },
        },
        included: [
            {
                id: "1",
                type: "users",
                attributes: { name: "Ann", email: "ann@example.test" },
            },
            {
                id: "1",
                type: "comments",
                attributes: { content: "c1", is_flagged: false },
            },
            {
                id: "2",
                type: "comments",
                attributes: { content: "c2", is_flagged: false },
            },
        ],
    } satisfies JsonApiDocument<PostResource, PostIncluded>).toExtend<
        JsonApiDocument<PostResource, PostIncluded>
    >();

    // `?include=comments.user`: an included resource object carries its own relationships.
    expectTypeOf({
        data: {
            ...firstPost,
            relationships: {
                comments: {
                    data: [
                        { id: "1", type: "comments" },
                        { id: "2", type: "comments" },
                    ],
                },
            },
        },
        included: [
            {
                id: "1",
                type: "comments",
                attributes: { content: "c1", is_flagged: false },
                relationships: { user: { data: { id: "2", type: "users" } } },
            },
            {
                id: "2",
                type: "comments",
                attributes: { content: "c2", is_flagged: false },
                relationships: { user: { data: { id: "1", type: "users" } } },
            },
            {
                id: "2",
                type: "users",
                attributes: { name: "Bob", email: "bob@example.test" },
            },
            {
                id: "1",
                type: "users",
                attributes: { name: "Ann", email: "ann@example.test" },
            },
        ],
    } satisfies JsonApiDocument<PostResource, PostIncluded>).toExtend<
        JsonApiDocument<PostResource, PostIncluded>
    >();

    // A missing to-one and an empty to-many, with nothing to include.
    expectTypeOf({
        data: {
            ...secondPost,
            relationships: {
                comments: { data: [] },
                categoryRel: { data: null },
            },
        },
    } satisfies JsonApiDocument<PostResource, PostIncluded>).toExtend<
        JsonApiDocument<PostResource, PostIncluded>
    >();

    // `toLinks()` and `toMeta()` overrides.
    expectTypeOf({
        data: {
            id: "1",
            type: "linked_posts",
            attributes: { title: "First" },
            links: { self: "https://example.test/posts/1" },
            meta: { readable: true, words: 1200 },
        },
    } satisfies JsonApiDocument<LinkedPostResource>).toExtend<
        JsonApiDocument<LinkedPostResource>
    >();

    // After `JsonApiResource::configure('1.1', meta: [...])`.
    expectTypeOf({
        data: firstPost,
        jsonapi: { version: "1.1", meta: { copyright: "Probe" } },
    } satisfies JsonApiDocument<PostResource>).toExtend<
        JsonApiDocument<PostResource>
    >();
    expectTypeOf({
        data: [firstPost, secondPost],
        jsonapi: { version: "1.1", meta: { copyright: "Probe" } },
    } satisfies JsonApiCollection<PostResource>).toExtend<
        JsonApiCollection<PostResource>
    >();
    expectTypeOf<JsonApiDocument<PostResource>["jsonapi"]>().toEqualTypeOf<
        JsonApiObject | undefined
    >();

    // `PostResource::collection()` with `?include=author`, and over no models.
    expectTypeOf({
        data: [
            {
                ...firstPost,
                relationships: {
                    author: { data: { id: "1", type: "users" } },
                },
            },
            {
                ...secondPost,
                relationships: {
                    author: { data: { id: "2", type: "users" } },
                },
            },
        ],
        included: [
            {
                id: "1",
                type: "users",
                attributes: { name: "Ann", email: "ann@example.test" },
            },
            {
                id: "2",
                type: "users",
                attributes: { name: "Bob", email: "bob@example.test" },
            },
        ],
    } satisfies JsonApiCollection<PostResource, PostIncluded>).toExtend<
        JsonApiCollection<PostResource, PostIncluded>
    >();
    expectTypeOf({
        data: [],
    } satisfies JsonApiCollection<PostResource>).toExtend<
        JsonApiCollection<PostResource>
    >();

    // `PostResource::collection(Post::paginate(1))` with `?include=author`, as an Inertia prop.
    expectTypeOf({
        data: [
            {
                ...firstPost,
                attributes: {
                    ...firstPost.attributes,
                    published_at: "2026-01-02T03:04:05.000000Z",
                },
                relationships: {
                    author: { data: { id: "1", type: "users" } },
                },
            },
        ],
        links: {
            first: "http://localhost/probe/inertia?page=1",
            last: "http://localhost/probe/inertia?page=2",
            prev: null,
            next: "http://localhost/probe/inertia?page=2",
        },
        meta: {
            current_page: 1,
            from: 1,
            last_page: 2,
            links: [
                {
                    url: null,
                    label: "&laquo; Previous",
                    page: null,
                    active: false,
                },
                {
                    url: "http://localhost/probe/inertia?page=1",
                    label: "1",
                    page: 1,
                    active: true,
                },
                {
                    url: "http://localhost/probe/inertia?page=2",
                    label: "2",
                    page: 2,
                    active: false,
                },
                {
                    url: "http://localhost/probe/inertia?page=2",
                    label: "Next &raquo;",
                    page: 2,
                    active: false,
                },
            ],
            path: "http://localhost/probe/inertia",
            per_page: 1,
            to: 1,
            total: 2,
        },
        included: [
            {
                id: "1",
                type: "users",
                attributes: { name: "Ann", email: "ann@example.test" },
            },
        ],
    } satisfies JsonApiPaginator<PostResource, PostIncluded>).toExtend<
        JsonApiPaginator<PostResource, PostIncluded>
    >();
});

test("a to-one relationship's data may be null", () => {
    expectTypeOf<
        JsonApiToOneRelationship<"users">["data"]
    >().toEqualTypeOf<JsonApiResourceIdentifier<"users"> | null>();
    expectTypeOf<JsonApiToManyRelationship<"comments">["data"]>().toEqualTypeOf<
        JsonApiResourceIdentifier<"comments">[]
    >();
    expectTypeOf<JsonApiResourceIdentifier>().toEqualTypeOf<{
        id: string;
        type: string;
    }>();
    expectTypeOf<JsonApiRelationship<"users">>().toEqualTypeOf<
        JsonApiToOneRelationship<"users"> | JsonApiToManyRelationship<"users">
    >();
    expectTypeOf({
        data: null,
    } satisfies JsonApiToOneRelationship<"categories">).toExtend<
        JsonApiRelationship<"categories">
    >();
    expectTypeOf<{ data: null }>().not.toExtend<
        JsonApiToManyRelationship<"comments">
    >();
});

test("JsonApiSparse makes every attribute optional", () => {
    expectTypeOf<JsonApiSparse<PostResource>["attributes"]>().toEqualTypeOf<
        | {
              title?: string;
              content?: string;
              word_count?: number | null;
              published_at?: string | null;
          }
        | undefined
    >();
    expectTypeOf<
        JsonApiSparse<PostResource>["type"]
    >().toEqualTypeOf<"posts">();
    expectTypeOf<JsonApiSparse<PostResource>["relationships"]>().toEqualTypeOf<
        PostResource["relationships"]
    >();

    expectTypeOf<{
        id: string;
        type: "posts";
        attributes: { title: string };
    }>().not.toExtend<PostResource>();

    // `?fields[posts]=title`, then `?fields[posts]=`, which sends no `attributes` at all.
    expectTypeOf({
        data: { id: "1", type: "posts", attributes: { title: "First" } },
    } satisfies JsonApiDocument<JsonApiSparse<PostResource>>).toExtend<
        JsonApiDocument<JsonApiSparse<PostResource>>
    >();
    expectTypeOf({
        data: { id: "1", type: "posts" },
    } satisfies JsonApiDocument<JsonApiSparse<PostResource>>).toExtend<
        JsonApiDocument<JsonApiSparse<PostResource>>
    >();

    // `?fields[users]=name&include=author` narrows only the included users.
    expectTypeOf({
        data: {
            ...firstPost,
            relationships: {
                author: { data: { id: "1", type: "users" } },
            },
        },
        included: [{ id: "1", type: "users", attributes: { name: "Ann" } }],
    } satisfies JsonApiDocument<
        PostResource,
        JsonApiSparse<UserResource> | CommentResource | CategoryResource
    >).toExtend<
        JsonApiDocument<
            PostResource,
            JsonApiSparse<UserResource> | CommentResource | CategoryResource
        >
    >();

    // A sparse union stays a union of resource objects, so `type` still narrows each one.
    const sparseUnion: JsonApiDocument<
        PostResource,
        JsonApiSparse<UserResource | CommentResource>
    > = {
        data: {
            ...firstPost,
            relationships: {
                comments: { data: [{ id: "1", type: "comments" }] },
            },
        },
        included: [
            {
                id: "1",
                type: "comments",
                attributes: { content: "c1" },
                relationships: { user: { data: { id: "2", type: "users" } } },
            },
            { id: "2", type: "users", attributes: { name: "Bob" } },
        ],
    };

    for (const included of sparseUnion.included ?? []) {
        if (included.type === "comments") {
            expectTypeOf(included.attributes).toEqualTypeOf<
                Partial<CommentResource["attributes"]> | undefined
            >();
            expectTypeOf(included.relationships).toEqualTypeOf<
                CommentResource["relationships"]
            >();
        } else {
            expectTypeOf(included.attributes).toEqualTypeOf<
                Partial<UserResource["attributes"]> | undefined
            >();
        }
    }
});

test("a JSON:API collection over a simple or cursor paginator carries that kind's meta", () => {
    expectTypeOf<
        JsonApiPaginator<PostResource>["meta"]
    >().toEqualTypeOf<JsonResourceMeta>();
    expectTypeOf<
        JsonApiSimplePaginator<PostResource>["meta"]
    >().toEqualTypeOf<JsonResourceSimpleMeta>();
    expectTypeOf<
        JsonApiCursorPaginator<PostResource>["meta"]
    >().toEqualTypeOf<JsonResourceCursorMeta>();
    expectTypeOf<
        JsonApiSimplePaginator<PostResource>["links"]
    >().toEqualTypeOf<JsonResourceLinks>();
    expectTypeOf<
        JsonApiCursorPaginator<PostResource>["links"]
    >().toEqualTypeOf<JsonResourceLinks>();

    // `.branded` compares an interface with an intersection by structure.
    expectTypeOf<
        JsonApiPaginator<PostResource, PostIncluded>
    >().branded.toEqualTypeOf<
        JsonApiCollection<PostResource, PostIncluded> & ResourcePagination
    >();
    expectTypeOf<
        JsonApiSimplePaginator<PostResource, PostIncluded>
    >().branded.toEqualTypeOf<
        JsonApiCollection<PostResource, PostIncluded> & ResourceSimplePagination
    >();
    expectTypeOf<
        JsonApiCursorPaginator<PostResource, PostIncluded>
    >().branded.toEqualTypeOf<
        JsonApiCollection<PostResource, PostIncluded> & ResourceCursorPagination
    >();

    // `PostResource::collection(Post::simplePaginate(1))`
    expectTypeOf({
        data: [firstPost],
        links: {
            first: "http://localhost/x?page=1",
            last: null,
            prev: null,
            next: "http://localhost/x?page=2",
        },
        meta: {
            current_page: 1,
            current_page_url: "http://localhost/x?page=1",
            from: 1,
            path: "http://localhost/x",
            per_page: 1,
            to: 1,
        },
    } satisfies JsonApiSimplePaginator<PostResource>).toExtend<
        JsonApiSimplePaginator<PostResource>
    >();

    // `PostResource::collection(Post::cursorPaginate(1))`
    expectTypeOf({
        data: [firstPost],
        links: {
            first: null,
            last: null,
            prev: null,
            next: "http://localhost/x?cursor=eyJpZCI6MSwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
        },
        meta: {
            path: "http://localhost/x",
            per_page: 1,
            next_cursor: "eyJpZCI6MSwiX3BvaW50c1RvTmV4dEl0ZW1zIjp0cnVlfQ",
            prev_cursor: null,
        },
    } satisfies JsonApiCursorPaginator<PostResource>).toExtend<
        JsonApiCursorPaginator<PostResource>
    >();
});

test("JsonApiResourceObject's type parameters default to today's shape", () => {
    expectTypeOf<JsonApiResourceObject>().toEqualTypeOf<{
        id: string;
        type: string;
        attributes?: Record<string, unknown>;
        relationships?: Record<
            string,
            JsonApiToOneRelationship | JsonApiToManyRelationship
        >;
        links?: Record<string, unknown>;
        meta?: Record<string, unknown>;
    }>();
    expectTypeOf<JsonApiDocument<PostResource>["included"]>().toEqualTypeOf<
        JsonApiResourceObject[] | undefined
    >();

    expectTypeOf<
        JsonApiResourceObject<"users", UserResource["attributes"]>["attributes"]
    >().toEqualTypeOf<UserResource["attributes"] | undefined>();
    expectTypeOf<
        JsonApiResourceObject<
            "comments",
            CommentResource["attributes"],
            NonNullable<CommentResource["relationships"]>
        >["relationships"]
    >().toEqualTypeOf<CommentResource["relationships"]>();

    // Each resource object a document names fits the default `included` member.
    expectTypeOf<PostResource>().toExtend<JsonApiResourceObject<"posts">>();
    expectTypeOf<CommentResource>().toExtend<JsonApiResourceObject>();
    expectTypeOf<LinkedPostResource>().toExtend<JsonApiResourceObject>();

    // A `toId()` returning an int is still sent as a string.
    expectTypeOf({
        id: "1000",
        type: "articles",
        attributes: { title: "First" },
    } satisfies JsonApiResourceObject<"articles">).toExtend<
        JsonApiResourceObject<"articles">
    >();
});

// ----------------------------------------------
// Enhanced positive literal + mapped type tests
// ----------------------------------------------

test("As* template literal expansion", () => {
    expectTypeOf<AsCount<"posts">>().toEqualTypeOf<"posts_count">();
    expectTypeOf<AsMax<"score">>().toEqualTypeOf<"score_max">();
    expectTypeOf<AsMin<"score">>().toEqualTypeOf<"score_min">();
    expectTypeOf<AsSum<"price">>().toEqualTypeOf<"price_sum">();
    expectTypeOf<AsAvg<"rating">>().toEqualTypeOf<"rating_avg">();
    expectTypeOf<AsExists<"orders">>().toEqualTypeOf<"orders_exists">();
});

test("With* mapped key unions", () => {
    type C = WithCount<"posts" | "comments">;
    expectTypeOf<keyof C>().toEqualTypeOf<"posts_count" | "comments_count">();

    type Mx = WithMax<"score" | "rank">;
    expectTypeOf<keyof Mx>().toEqualTypeOf<"score_max" | "rank_max">();

    // Value shapes
    expectTypeOf<WithMax<"score">["score_max"]>().toEqualTypeOf<
        number | null
    >();
    expectTypeOf<WithCount<"posts">["posts_count"]>().toBeNumber();
    expectTypeOf<WithExists<"orders">["orders_exists"]>().toBeBoolean();
});

// ----------------------------------------------
// Negative tests (@ts-expect-error) to ensure incorrect shapes fail
// ----------------------------------------------

// Positive structure examples
test("SimplePaginator structure + value shapes", () => {
    const sp: SimplePaginator<Data> = {
        current_page: 1,
        data: [],
        first_page_url: "/items?page=1",
        from: 1,
        next_page_url: null,
        path: "/items",
        per_page: 15,
        prev_page_url: null,
        to: 2,
    };

    expectTypeOf(sp.current_page).toEqualTypeOf<number>();
    expectTypeOf(sp.data).toEqualTypeOf<Data[]>();
    expectTypeOf(sp.first_page_url).toEqualTypeOf<string>();
    expectTypeOf(sp.from).toEqualTypeOf<number | null>();
    expectTypeOf(sp.next_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.path).toEqualTypeOf<string>();
    expectTypeOf(sp.per_page).toEqualTypeOf<number>();
    expectTypeOf(sp.prev_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.to).toEqualTypeOf<number | null>();
});

test("LengthAwarePaginator structure + value shapes", () => {
    const sp: LengthAwarePaginator<Data> = {
        current_page: 1,
        data: [],
        first_page_url: "/items?page=1",
        from: 1,
        last_page: 1,
        last_page_url: "/items?page=1",
        links: [],
        next_page_url: null,
        path: "/items",
        per_page: 15,
        prev_page_url: null,
        to: 1,
        total: 1,
    };

    expectTypeOf(sp.current_page).toEqualTypeOf<number>();
    expectTypeOf(sp.data).toEqualTypeOf<Data[]>();
    expectTypeOf(sp.first_page_url).toEqualTypeOf<string>();
    expectTypeOf(sp.from).toEqualTypeOf<number | null>();
    expectTypeOf(sp.last_page).toEqualTypeOf<number>();
    expectTypeOf(sp.last_page_url).toEqualTypeOf<string>();
    expectTypeOf(sp.links).toEqualTypeOf<PaginatorLink[]>();
    expectTypeOf(sp.next_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.path).toEqualTypeOf<string>();
    expectTypeOf(sp.per_page).toEqualTypeOf<number>();
    expectTypeOf(sp.prev_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.to).toEqualTypeOf<number | null>();
    expectTypeOf(sp.total).toEqualTypeOf<number>();
});

test("CursorPaginator structure + value shapes", () => {
    const sp: CursorPaginator<Data> = {
        data: [],
        path: "",
        per_page: 0,
        next_cursor: null,
        next_page_url: null,
        prev_cursor: null,
        prev_page_url: null,
    };

    expectTypeOf(sp.data).toEqualTypeOf<Data[]>();
    expectTypeOf(sp.path).toEqualTypeOf<string>();
    expectTypeOf(sp.per_page).toEqualTypeOf<number>();
    expectTypeOf(sp.next_cursor).toEqualTypeOf<string | null>();
    expectTypeOf(sp.next_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.prev_cursor).toEqualTypeOf<string | null>();
    expectTypeOf(sp.prev_page_url).toEqualTypeOf<string | null>();
});

test("JsonResourcePaginator structure + value shapes", () => {
    const jrOk: JsonResourcePaginator<{ id: number; name?: string }> = {
        data: [{ id: 1 }, { id: 2, name: "X" }],
        meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            links: [],
            path: "/items",
            per_page: 15,
            to: 2,
            total: 2,
        },
        links: { first: null, last: null, prev: null, next: null },
    };
    expectTypeOf(jrOk.data[0]!.id).toBeNumber();
    expectTypeOf(jrOk.meta.total).toBeNumber();
    expectTypeOf(jrOk.meta.from).toEqualTypeOf<number | null>();
    expectTypeOf(jrOk.meta.to).toEqualTypeOf<number | null>();
});

test("PaginatorLink shape", () => {
    const pl: PaginatorLink = { url: null, label: "1", active: false };
    expectTypeOf(pl.label).toBeString();
});

test("Timestamps + SoftDeletes shapes", () => {
    const ts: Timestamps = {
        created_at: null,
        updated_at: "2024-01-01T00:00:00Z",
    };
    const sd: SoftDeletes = { deleted_at: null };
    expectTypeOf(ts.created_at).toEqualTypeOf<string | null | undefined>();
    expectTypeOf(sd.deleted_at).toEqualTypeOf<string | null | undefined>();
});

test("AllTimestampsModel index signature", () => {
    // Index signature should yield unknown for arbitrary keys
    expectTypeOf<
        AllTimestampsModel["some_random_key"]
    >().toEqualTypeOf<unknown>();
});

test("Literal alias guarding", () => {
    const literalAlias: AsSum<"price"> = "price_sum";
    expectTypeOf(literalAlias).toEqualTypeOf<"price_sum">();
});

// -------------------------------------------------
// Pure type-level (compile-time only) assertions
// (exported to avoid unused warnings)
// -------------------------------------------------

export type _TypeAssertions = [
    // Template literal correctness
    Assert<IsExact<AsSum<"price">, "price_sum">>,
    Assert<IsExact<AsAvg<"rating">, "rating_avg">>,
    // Key unions for WithCount
    Assert<
        IsExact<keyof WithCount<"posts" | "tags">, "posts_count" | "tags_count">
    >,
    // Non-assignability checks between paginator variants
    Assert<
        IsExact<
            IsAssignable<
                CursorPaginator<unknown>,
                LengthAwarePaginator<unknown>
            >,
            false
        >
    >,
    Assert<
        IsExact<
            IsAssignable<
                LengthAwarePaginator<unknown>,
                CursorPaginator<unknown>
            >,
            false
        >
    >,
    // WithAvg value type check
    Assert<IsExact<WithAvg<"rating">["rating_avg"], number | null>>,
    // Ensure WithExists maps to boolean
    Assert<IsExact<WithExists<"orders">["orders_exists"], boolean>>,
];

// -------------------------------------------------
// Implement a model with all helpers
// -------------------------------------------------

test("Full Model", () => {
    const model: FullModel = {
        id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        posts_count: 5,
        rating_max: 10,
        rating_min: 1,
        rating_sum: 30,
        rating_avg: 6,
        orders_exists: true,
    };

    expectTypeOf(model.id).toEqualTypeOf<number | string | undefined>();
    expectTypeOf(model.created_at).toEqualTypeOf<string | null | undefined>();
    expectTypeOf(model.updated_at).toEqualTypeOf<string | null | undefined>();
    expectTypeOf(model.deleted_at).toEqualTypeOf<string | null | undefined>();
    expectTypeOf(model.posts_count).toBeNumber();
    expectTypeOf(model.rating_max).toEqualTypeOf<number | null>();
    expectTypeOf(model.rating_min).toEqualTypeOf<number | null>();
    expectTypeOf(model.rating_sum).toEqualTypeOf<number | null>();
    expectTypeOf(model.rating_avg).toEqualTypeOf<number | null>();
    expectTypeOf(model.orders_exists).toBeBoolean();
});

// (Documentation only) Invalid examples that SHOULD fail if uncommented:
// const badCount: WithCount<'posts'> = { post_count: 1 }; // wrong key
// const badTs: Timestamps = { created_at: 123, updated_at: null }; // wrong type
// const badLink: PaginatorLink = { url: null, label: 1, active: false }; // label not string
// const badAlias: AsSum<'price'> = 'price_total'; // wrong literal

// -------------------------------------------------
// ProxyTarget: a top-level `this` alias never type-checked
// -------------------------------------------------

import type { ProxyTarget } from "../src/collections";

// A Proxy target must be an object; a top-level `this` alias never type-checked and skipLibCheck hid it.
test("ProxyTarget", () => {
    expectTypeOf<ProxyTarget>().toEqualTypeOf<object>();
});

// -------------------------------------------------
// An optional intermediate segment resolves to the default, not `undefined`
// -------------------------------------------------

import type {
    ArrayResolvePathOrDefault,
    ArrayResolvePathOrNull,
} from "../src/path-resolve";

type OptionalIntermediate = { a?: { b: string } }[];
type RequiredIntermediate = { a: { b: string } }[];

// `Arr.get([{}], "0.a.b")` returns its default at runtime, never `undefined`, so the
// optional `a` must contribute the default to the resolved type rather than `undefined`.
test("ArrayResolvePathOrDefault answers the default through an optional segment", () => {
    expectTypeOf<
        ArrayResolvePathOrDefault<OptionalIntermediate, "0.a.b", 42>
    >().toEqualTypeOf<string | 42>();

    // A required chain resolves outright, so the default stays out of the union.
    expectTypeOf<
        ArrayResolvePathOrDefault<RequiredIntermediate, "0.a.b", 42>
    >().toEqualTypeOf<string>();

    // A widened path cannot be checked, so it falls back to the element type plus the default.
    expectTypeOf<
        ArrayResolvePathOrDefault<OptionalIntermediate, string, 42>
    >().toEqualTypeOf<{ a?: { b: string } } | 42>();
});

test("ArrayResolvePathOrNull answers null through an optional segment", () => {
    expectTypeOf<
        ArrayResolvePathOrNull<OptionalIntermediate, "0.a.b">
    >().toEqualTypeOf<string | null>();

    expectTypeOf<
        ArrayResolvePathOrNull<RequiredIntermediate, "0.a.b">
    >().toEqualTypeOf<string>();

    expectTypeOf<ArrayResolvePathOrNull<string[], 0>>().toEqualTypeOf<string>();
});

// -------------------------------------------------
// A key set may be read-only
// -------------------------------------------------

import type { PathKeys } from "../src/path-resolve";

// `dataExcept(x, ["a", "b"] as const)` has to compile, so the array half of PathKeys is
// read-only. A mutable array still fits, because every array extends its read-only twin.
test("PathKeys takes a read-only key tuple as well as a mutable one", () => {
    expectTypeOf<readonly ["a", "b"]>().toExtend<PathKeys>();
    expectTypeOf<["a", "b"]>().toExtend<PathKeys>();
    expectTypeOf<readonly (string | number)[]>().toExtend<PathKeys>();
});
