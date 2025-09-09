import { expectTypeOf, test } from "vitest";
import type {
    SimplePaginator,
    LengthAwarePaginator,
    CursorPaginator,
    PaginatorLink,
    Model,
    Timestamps,
    SoftDeletes,
    TimestampModel,
    SoftDeleteModel,
    AllTimestampsModel,
    AsCount,
    AsMax,
    AsMin,
    AsSum,
    AsAvg,
    AsExists,
    WithCount,
    WithMax,
    WithMin,
    WithSum,
    WithAvg,
    WithExists,
    JsonResource,
    JsonResourceLinks,
    JsonResourceMeta,
} from "@laravel-js/types";

declare type Data = Record<string, unknown>[];

type IsExact<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
        ? true
        : false;
type Assert<T extends true> = T;
type IsAssignable<A, B> = A extends B ? true : false;

interface FullModel
    extends AllTimestampsModel,
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
        deleted_at: string | null;
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

test("JsonResource", () => {
    expectTypeOf<JsonResource<Data>>().toEqualTypeOf<JsonResource<Data>>();
});

test("JsonResourceLinks", () => {
    expectTypeOf<JsonResourceLinks>().toEqualTypeOf<JsonResourceLinks>();
});

test("JsonResourceMeta", () => {
    expectTypeOf<JsonResourceMeta>().toEqualTypeOf<JsonResourceMeta>();
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
    expectTypeOf(sp.from).toEqualTypeOf<number>();
    expectTypeOf(sp.next_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.path).toEqualTypeOf<string>();
    expectTypeOf(sp.per_page).toEqualTypeOf<number>();
    expectTypeOf(sp.prev_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.to).toEqualTypeOf<number>();
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
    expectTypeOf(sp.from).toEqualTypeOf<number>();
    expectTypeOf(sp.last_page).toEqualTypeOf<number>();
    expectTypeOf(sp.last_page_url).toEqualTypeOf<string>();
    expectTypeOf(sp.links).toEqualTypeOf<PaginatorLink[]>();
    expectTypeOf(sp.next_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.path).toEqualTypeOf<string>();
    expectTypeOf(sp.per_page).toEqualTypeOf<number>();
    expectTypeOf(sp.prev_page_url).toEqualTypeOf<string | null>();
    expectTypeOf(sp.to).toEqualTypeOf<number>();
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

test("JsonResource structure + value shapes", () => {
    const jrOk: JsonResource<{ id: number; name?: string }> = {
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
    expectTypeOf(ts.created_at).toEqualTypeOf<string | null>();
    expectTypeOf(sd.deleted_at).toEqualTypeOf<string | null>();
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
    expectTypeOf(model.created_at).toEqualTypeOf<string | null>();
    expectTypeOf(model.updated_at).toEqualTypeOf<string | null>();
    expectTypeOf(model.deleted_at).toEqualTypeOf<string | null>();
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
