import * as Ts from "@tolki/ts";
import type {
    ArgsObject,
    DefineRouteResultNoArgs,
    DefineRouteResultWithArgs,
    PositionalTuple,
    ResolveArgInputType,
    RouteCallResult,
} from "@tolki/types";
import { describe, expectTypeOf, it } from "vitest";

import * as Stubs from "./stubs";

type PostsShowArgs = typeof Stubs.postsShow.args;
type ArticlesShowArgs = typeof Stubs.articlesShow.args;
type EnumBoundArgs = typeof Stubs.postsByStatus.args;
type StringEnumArgs = typeof Stubs.postsByCategory.args;
type OptionalShowArgs = typeof Stubs.optionalShow.args;
type MultiParamArgs = typeof Stubs.userPostsShow.args;

describe("ResolveArgInputType", () => {
    it("resolves model-bound arg to scalar or object with route key", () => {
        type Result = ResolveArgInputType<PostsShowArgs[0]>;
        expectTypeOf<Result>().toExtend<
            string | number | { readonly id: string | number }
        >();
    });

    it("resolves custom route key (slug)", () => {
        type Result = ResolveArgInputType<ArticlesShowArgs[0]>;
        expectTypeOf<Result>().toExtend<
            | string
            | number
            | { readonly slug: string | number }
            | { readonly id: string | number }
        >();
    });

    it("resolves enum-bound arg to backing values or value object", () => {
        type Result = ResolveArgInputType<EnumBoundArgs[0]>;
        expectTypeOf<Result>().toEqualTypeOf<
            0 | 1 | { readonly value: 0 | 1 }
        >();
    });

    it("resolves string enum-bound arg", () => {
        type Result = ResolveArgInputType<StringEnumArgs[0]>;
        expectTypeOf<Result>().toEqualTypeOf<
            "fruits" | "people" | { readonly value: "fruits" | "people" }
        >();
    });

    it("resolves plain scalar arg to string | number", () => {
        type Result = ResolveArgInputType<(typeof Stubs.paramsCamel.args)[0]>;
        expectTypeOf<Result>().toEqualTypeOf<string | number>();
    });
});

describe("ArgsObject", () => {
    it("builds named object for single required model-bound arg", () => {
        type Result = ArgsObject<PostsShowArgs>;
        expectTypeOf<Result>().toExtend<{
            post: string | number | { readonly id: string | number };
        }>();
    });

    it("builds named object for optional arg allowing undefined or null", () => {
        type Result = ArgsObject<OptionalShowArgs>;
        expectTypeOf<Result>().toExtend<{
            param?: string | number | null;
        }>();
    });

    it("builds named object for multi-param route", () => {
        type Result = ArgsObject<MultiParamArgs>;
        expectTypeOf<Result>().toExtend<{
            user: string | number | { readonly id: string | number };
            post: string | number | { readonly id: string | number };
        }>();
    });
});

describe("PositionalTuple", () => {
    it("resolves element types for single arg", () => {
        type Result = PositionalTuple<PostsShowArgs>;
        type First = Result[0];
        expectTypeOf<First>().toExtend<
            string | number | { readonly id: string | number }
        >();
    });

    it("resolves element types for multi-param", () => {
        type Result = PositionalTuple<MultiParamArgs>;
        type First = Result[0];
        type Second = Result[1];
        expectTypeOf<First>().toExtend<
            string | number | { readonly id: string | number }
        >();
        expectTypeOf<Second>().toExtend<
            string | number | { readonly id: string | number }
        >();
    });
});

describe("DefineRouteResult", () => {
    it("returns DefineRouteResultNoArgs for zero-arg routes", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        expectTypeOf(route).toExtend<
            DefineRouteResultNoArgs<readonly ["get", "head"]>
        >();
    });

    it("returns DefineRouteResultWithArgs for routes with args", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        expectTypeOf(route).toExtend<
            DefineRouteResultWithArgs<readonly ["get", "head"], PostsShowArgs>
        >();
    });
});

describe("defineRoute callable type inference", () => {
    it("infers RouteCallResult with correct method type", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: 42 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
        expectTypeOf(result.url).toBeString();
        expectTypeOf(result.method).toEqualTypeOf<"get">();
    });

    it("infers correct method for POST-only route", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route();
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".url() returns string", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const url = route.url({ post: 42 });
        expectTypeOf(url).toBeString();
    });

    it("definition preserves the metadata structure", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        expectTypeOf(route.definition.url).toBeString();
        expectTypeOf(route.definition.methods).toExtend<readonly string[]>();
        expectTypeOf(route.definition).toHaveProperty("args");
    });
});

describe("array calling convention types", () => {
    it("accepts array of scalars", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([42]);
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts single-element array with model object", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([{ id: 42 }]);
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts array of scalars for multi-param", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route([2, 42]);
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts array of model objects", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route([{ id: 2 }, { id: 42 }]);
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts array form with trailing query options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([42], { page: 2 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it(".url() accepts array form", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const url = route.url([42]);
        expectTypeOf(url).toBeString();
    });

    it(".url() accepts array form with trailing query options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const url = route.url([42], { page: 2 });
        expectTypeOf(url).toBeString();
    });
});

describe("trailing query options types", () => {
    it("accepts spread scalar + trailing options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(42, { page: 2 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts spread scalar + trailing _query options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(42, { _query: { post: "override" } });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts naked model + trailing options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ id: 42 }, { page: 2 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts multi-param spread + trailing options", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route(2, 42, { page: 1 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });
});

describe("model id fallback types", () => {
    it("accepts object with id for model-bound arg with different route key", () => {
        const route = Ts.defineRoute(Stubs.articlesShow);
        const result = route({ article: { id: 99, title: "test" } });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });

    it("accepts naked model object with _routeKey via positional spread", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ _routeKey: "id", id: 77 });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });
});

describe("null on optional params", () => {
    it("accepts null for optional parameter value", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);
        const result = route({ param: null });
        expectTypeOf(result).toExtend<RouteCallResult<"get">>();
    });
});

describe("per-verb method type inference", () => {
    it(".get() returns RouteCallResult<'get'>", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.get({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"get">();
    });

    it(".head() returns RouteCallResult<'head'>", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.head({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"head">();
    });

    it(".put() returns RouteCallResult<'put'>", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.put({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"put">();
    });

    it(".patch() returns RouteCallResult<'patch'>", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.patch({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"patch">();
    });

    it(".delete() returns RouteCallResult<'delete'>", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.delete({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"delete">();
    });

    it(".post() returns RouteCallResult<'post'>", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.post();
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });
});
