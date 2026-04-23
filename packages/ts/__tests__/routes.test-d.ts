import * as Ts from "@tolki/ts";
import type {
    ArgsObject,
    DefineRouteResultNoArgs,
    DefineRouteResultWithArgs,
    PositionalTuple,
    ResolveArgInputType,
    RouteCallResult,
    RouteCallResultWithComponent,
    RouteFormResult,
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

describe("form type inference", () => {
    it(".form() on GET route returns RouteFormResult with method: 'get'", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route.form();
        expectTypeOf(result).toExtend<RouteFormResult<"get">>();
        expectTypeOf(result.method).toEqualTypeOf<"get">();
        expectTypeOf(result.action).toBeString();
    });

    it(".form() on POST route returns RouteFormResult with method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.form();
        expectTypeOf(result).toExtend<RouteFormResult<"post">>();
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".form() on DELETE route returns method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.form({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".form.patch() returns RouteFormResult with method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.form.patch({ post: 42 });
        expectTypeOf(result).toExtend<RouteFormResult<"patch">>();
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".form.put() returns RouteFormResult with method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.form.put({ post: 42 });
        expectTypeOf(result).toExtend<RouteFormResult<"put">>();
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".form.get() returns RouteFormResult with method: 'get'", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form.get({ post: 42 });
        expectTypeOf(result).toExtend<RouteFormResult<"get">>();
        expectTypeOf(result.method).toEqualTypeOf<"get">();
    });

    it(".form.delete() returns RouteFormResult with method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.form.delete({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"post">();
    });

    it(".form.head() returns RouteFormResult with method: 'get'", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form.head({ post: 42 });
        expectTypeOf(result.method).toEqualTypeOf<"get">();
    });

    it(".form() accepts zero args on no-arg route", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route.form();
        expectTypeOf(result.action).toBeString();
    });

    it(".form() accepts named args on with-arg route", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form({ post: 42 });
        expectTypeOf(result.action).toBeString();
    });
});

describe("single component type inference (no args)", () => {
    it(".component is typed as the literal string", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        expectTypeOf(route.component).toEqualTypeOf<"Dashboard">();
    });

    it(".definition.component is typed as the literal string", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        expectTypeOf(route.definition.component).toEqualTypeOf<
            "Dashboard" | undefined
        >();
    });

    it(".withComponent() returns RouteCallResultWithComponent", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        const result = route.withComponent();
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<"Dashboard", "get">
        >();
        expectTypeOf(result.component).toEqualTypeOf<"Dashboard">();
        expectTypeOf(result.url).toBeString();
        expectTypeOf(result.method).toEqualTypeOf<"get">();
    });

    it(".withComponent() accepts query options", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        const result = route.withComponent({ page: 1 });
        expectTypeOf(result.component).toEqualTypeOf<"Dashboard">();
    });
});

describe("single component type inference (with args)", () => {
    it(".component is typed as the literal string", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        expectTypeOf(route.component).toEqualTypeOf<"Users/Profile">();
    });

    it(".withComponent() accepts named args", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        const result = route.withComponent({ user: 42 });
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<"Users/Profile", "get">
        >();
        expectTypeOf(result.component).toEqualTypeOf<"Users/Profile">();
    });

    it(".withComponent() accepts positional args", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        const result = route.withComponent(42);
        expectTypeOf(result.component).toEqualTypeOf<"Users/Profile">();
    });
});

describe("multi component type inference (no args)", () => {
    it(".component is typed as the component map", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);
        expectTypeOf(route.component).toEqualTypeOf<{
            readonly authenticated: "Conditional/Authenticated";
            readonly guest: "Conditional/Guest";
        }>();
    });

    it(".withComponent() accepts a component value from the map", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);
        const result = route.withComponent("Conditional/Guest");
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<
                "Conditional/Authenticated" | "Conditional/Guest",
                "get"
            >
        >();
        expectTypeOf(result.component).toEqualTypeOf<
            "Conditional/Authenticated" | "Conditional/Guest"
        >();
    });

    it(".withComponent() accepts query options after component", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);
        const result = route.withComponent("Conditional/Authenticated", {
            ref: "home",
        });
        expectTypeOf(result.component).toEqualTypeOf<
            "Conditional/Authenticated" | "Conditional/Guest"
        >();
    });
});

describe("multi component type inference (with args)", () => {
    it(".component is typed as the component map", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        expectTypeOf(route.component).toEqualTypeOf<{
            readonly detail: "Items/Detail";
            readonly preview: "Items/Preview";
        }>();
    });

    it(".withComponent() accepts component value and named args", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        const result = route.withComponent("Items/Detail", { item: 7 });
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<
                "Items/Detail" | "Items/Preview",
                "get"
            >
        >();
    });

    it(".withComponent() accepts component value and positional scalar", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        const result = route.withComponent("Items/Detail", 7);
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<
                "Items/Detail" | "Items/Preview",
                "get"
            >
        >();
    });

    it(".withComponent() accepts component value and array args", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        const result = route.withComponent("Items/Detail", [7]);
        expectTypeOf(result).toExtend<
            RouteCallResultWithComponent<
                "Items/Detail" | "Items/Preview",
                "get"
            >
        >();
    });
});

describe("no component type inference", () => {
    it("does not have .component property on routes without component", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        expectTypeOf(route).not.toHaveProperty("component");
    });

    it("does not have .withComponent property on routes without component", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        expectTypeOf(route).not.toHaveProperty("withComponent");
    });
});
