import * as Ts from "@tolki/ts";
import { afterEach, describe, expect, it } from "vitest";

import * as Stubs from "./stubs";

afterEach(() => {
    Ts.resetRouteDefaults();
});

describe("defineRoute", () => {
    it("returns a callable with .url, .definition, and toString", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect(typeof route).toBe("function");
        expect(typeof route.url).toBe("function");
        expect(route.definition).toBe(Stubs.postsIndex);
        expect(typeof route.toString).toBe("function");
    });

    it("has per-verb methods matching the methods array", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);

        expect(typeof route.put).toBe("function");
        expect(typeof route.patch).toBe("function");
    });

    it("definition is the raw metadata passthrough", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        expect(route.definition).toStrictEqual(Stubs.postsShow);
    });

    it("defaults to 'get' method when methods array is empty", () => {
        const route = Ts.defineRoute({
            name: "empty.methods",
            url: "/empty",
            domain: null,
            methods: [] as const,
        });
        const result = route();

        expect(result.method).toBe("get");
    });
});

describe("zero-arg routes", () => {
    it("calling with no args returns url and method", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route();

        expect(result.url).toBe("/posts");
        expect(result.method).toBe("get");
    });

    it(".url() returns the URL string", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect(route.url()).toBe("/posts");
    });

    it("toString() returns the URL", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect(route.toString()).toBe("/posts");
    });

    it("result toString() returns the URL for template literals", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route();

        expect(result.toString()).toBe("/posts");
        expect(`${result}`).toBe("/posts");
    });

    it("per-verb method returns correct method", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.post();

        expect(result.url).toBe("/posts");
        expect(result.method).toBe("post");
    });

    it("accepts query options on zero-arg routes", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ page: 2, q: "search" });

        expect(result.url).toBe("/posts?page=2&q=search");
    });

    it("ignores non-object args on zero-arg routes", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        // @ts-expect-error testing non-object arg (number) on zero-arg route
        const result = route(42);

        expect(result.url).toBe("/posts");
    });
});

describe("named object calling convention", () => {
    it("resolves a single model-bound parameter", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: 42 });

        expect(result.url).toBe("/posts/42");
        expect(result.method).toBe("get");
    });

    it("resolves an object with _routeKey field", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: { id: 42 } });

        expect(result.url).toBe("/posts/42");
    });

    it("resolves a custom route key (slug)", () => {
        const route = Ts.defineRoute(Stubs.articlesShow);
        const result = route({ article: { slug: "hello-world" } });

        expect(result.url).toBe("/articles/hello-world");
    });

    it("falls back to id when _routeKey is missing on the object", () => {
        const route = Ts.defineRoute(Stubs.articlesShow);
        const result = route({ article: { id: 99, title: "test" } });

        expect(result.url).toBe("/articles/99");
    });

    it("throws when required route key is missing from object", () => {
        const route = Ts.defineRoute(Stubs.articlesShow);

        // @ts-expect-error testing object without matching route key or id
        expect(() => route({ article: { title: "no slug or id" } })).toThrow(
            "missing route model binding key 'slug'",
        );
    });

    it("resolves multi-param routes", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route({ user: 2, post: 42 });

        expect(result.url).toBe("/users/2/posts/42");
    });

    it("resolves multi-param with model objects, arrays, and scalars", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);

        expect(route({ user: { id: 2 }, post: { id: 42 } }).url).toBe(
            "/users/2/posts/42",
        );
        expect(route({ id: 2 }, { id: 42 }).url).toBe("/users/2/posts/42");
        expect(route([{ id: 2 }, { id: 42 }]).url).toBe("/users/2/posts/42");
        expect(route([2, 42]).url).toBe("/users/2/posts/42");
        expect(route(2, 42).url).toBe("/users/2/posts/42");
    });

    it("extra keys become query parameters", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: 42, page: 2, sort: "latest" });

        expect(result.url).toBe("/posts/42?page=2&sort=latest");
    });

    it("handles _query escape hatch", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({
            post: 42,
            _query: { post: "override" },
        });

        expect(result.url).toBe("/posts/42?post=override");
    });
});

describe("spread scalar calling convention", () => {
    it("resolves single scalar spread", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(42);

        expect(result.url).toBe("/posts/42");
    });

    it("resolves multi-scalar spread", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route(2, 42);

        expect(result.url).toBe("/users/2/posts/42");
    });

    it("resolves model objects in spread form", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route({ id: 2 }, { id: 42 });

        expect(result.url).toBe("/users/2/posts/42");
    });
});

describe("array calling convention", () => {
    it("resolves a single-element array", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([42]);

        expect(result.url).toBe("/posts/42");
    });

    it("resolves single-element array with model object", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([{ id: 42 }]);

        expect(result.url).toBe("/posts/42");
    });

    it("resolves multi-element array", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route([2, 42]);

        expect(result.url).toBe("/users/2/posts/42");
    });

    it("resolves array of model objects", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);
        const result = route([{ id: 2 }, { id: 42 }]);

        expect(result.url).toBe("/users/2/posts/42");
    });

    it("resolves array form with trailing query options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route([42], { page: 2 });

        expect(result.url).toBe("/posts/42?page=2");
    });
});

describe("naked model shortcut", () => {
    it("wraps a single-param route with object having route key", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ id: 42 });

        expect(result.url).toBe("/posts/42");
    });

    it("wraps a single-param route with custom route key object", () => {
        const route = Ts.defineRoute(Stubs.articlesShow);
        const result = route({ slug: "hello-world" });

        expect(result.url).toBe("/articles/hello-world");
    });
});

describe("trailing query options", () => {
    it("appends query from trailing options on spread form", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(42, { page: 2 });

        expect(result.url).toBe("/posts/42?page=2");
    });

    it("appends query from trailing options on named form", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: 42 }, { page: 2 });

        expect(result.url).toBe("/posts/42?page=2");
    });

    it("appends query from _query escape hatch in trailing options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(42, { _query: { post: "override" } });

        expect(result.url).toBe("/posts/42?post=override");
    });

    it("named object after trailing options extraction handles _query and extra keys", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(
            { post: 42, _query: { custom: "val" }, extra: "param" },
            { page: 2 },
        );

        expect(result.url).toBe("/posts/42?page=2&custom=val&extra=param");
    });

    it("naked model after trailing options extraction", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ id: 42 }, { page: 2 });

        expect(result.url).toBe("/posts/42?page=2");
    });

    it("unrecognized object after trailing options extraction becomes query", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);
        const result = route({ foo: "bar" }, { page: 2 });

        expect(result.url).toBe("/optional?page=2&foo=bar");
    });

    it("multi-param route with unrecognized object falls through to query options", () => {
        const route = Ts.defineRoute(Stubs.userPostsShow);

        // @ts-expect-error testing object without required parameter keys
        expect(() => route({ foo: "bar" })).toThrow(
            "'user' parameter is required",
        );
    });
});

describe("enum-bound parameters", () => {
    it("resolves a raw scalar enum value", () => {
        const route = Ts.defineRoute(Stubs.postsByStatus);
        const result = route({ status: 1 });

        expect(result.url).toBe("/posts/status/1");
    });

    it("resolves an enum object with .value", () => {
        const route = Ts.defineRoute(Stubs.postsByStatus);
        const result = route({ status: { value: 0 } });

        expect(result.url).toBe("/posts/status/0");
    });

    it("resolves string enum values", () => {
        const route = Ts.defineRoute(Stubs.postsByCategory);
        const result = route({ category: "fruits" });

        expect(result.url).toBe("/posts/category/fruits");
    });

    it("resolves string enum object with .value", () => {
        const route = Ts.defineRoute(Stubs.postsByCategory);
        const result = route({ category: { value: "people" } });

        expect(result.url).toBe("/posts/category/people");
    });
});

describe("optional parameters", () => {
    it("resolves with the optional param provided", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);
        const result = route({ param: "hello" });

        expect(result.url).toBe("/optional/hello");
    });

    it("resolves with the optional param omitted", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);
        const result = route();

        expect(result.url).toBe("/optional");
    });

    it("resolves multi-optional with all params", () => {
        const route = Ts.defineRoute(Stubs.optionalMulti);
        const result = route({ one: "a", two: "b" });

        expect(result.url).toBe("/optional/a/b");
    });

    it("resolves multi-optional with partial params", () => {
        const route = Ts.defineRoute(Stubs.optionalMulti);
        const result = route({ one: "a" });

        expect(result.url).toBe("/optional/a");
    });

    it("resolves multi-optional with no params", () => {
        const route = Ts.defineRoute(Stubs.optionalMulti);
        const result = route();

        expect(result.url).toBe("/optional");
    });
});

describe("required parameters", () => {
    it("throws when a required parameter is missing", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        // @ts-expect-error testing empty object missing required parameter
        expect(() => route({})).toThrow("'post' parameter is required");
    });
});

describe("where constraints", () => {
    it("passes when value matches the constraint", () => {
        const route = Ts.defineRoute(Stubs.constrainedShow);
        const result = route({ page: 42 });

        expect(result.url).toBe("/constrained/42");
    });

    it("throws when value violates the constraint", () => {
        const route = Ts.defineRoute(Stubs.constrainedShow);

        expect(() => route({ page: "abc" })).toThrow(
            "does not match required format",
        );
    });

    it("throws a clean error when where pattern is invalid regex", () => {
        const route = Ts.defineRoute(Stubs.invalidWhere);

        expect(() => route({ page: "anything" })).toThrow(
            "invalid 'where' constraint pattern",
        );
    });

    it("skips validation when optional where-constrained param is omitted", () => {
        const route = Ts.defineRoute(Stubs.optionalWhere);
        const result = route();

        expect(result.url).toBe("/filtered");
    });

    it("skips where validation when param resolves to empty string", () => {
        const route = Ts.defineRoute(Stubs.optionalWhere);
        const result = route({ page: null });

        expect(result.url).toBe("/filtered");
    });
});

describe("query string encoding", () => {
    it("encodes booleans as 0/1", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ active: true, draft: false });

        expect(result.url).toBe("/posts?active=1&draft=0");
    });

    it("encodes arrays with indices format", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ tags: ["a", "b", "c"] });

        expect(result.url).toBe(
            "/posts?tags%5B0%5D=a&tags%5B1%5D=b&tags%5B2%5D=c",
        );
    });

    it("skips null and undefined values", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ page: 1, skip: null, also: undefined });

        expect(result.url).toBe("/posts?page=1");
    });

    it("ignores non-object _query in trailing options", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        // @ts-expect-error testing non-object _query value in trailing options
        const result = route(42, { _query: "not-an-object", page: 3 });

        expect(result.url).toBe("/posts/42?page=3");
    });
});

describe("per-verb methods", () => {
    it(".get() returns correct method", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.get({ post: 42 });

        expect(result.url).toBe("/posts/42");
        expect(result.method).toBe("get");
    });

    it(".head() returns correct method", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.head({ post: 42 });

        expect(result.url).toBe("/posts/42");
        expect(result.method).toBe("head");
    });

    it(".put() and .patch() on update route", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const putResult = route.put({ post: 42 });
        const patchResult = route.patch({ post: 42 });

        expect(putResult.method).toBe("put");
        expect(patchResult.method).toBe("patch");
        expect(putResult.url).toBe("/posts/42");
        expect(patchResult.url).toBe("/posts/42");
    });

    it(".delete() on destroy route", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.delete({ post: 42 });

        expect(result.url).toBe("/posts/42");
        expect(result.method).toBe("delete");
    });

    it(".post() on store route", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.post();

        expect(result.url).toBe("/posts");
        expect(result.method).toBe("post");
    });
});

describe("setRouteDefaults", () => {
    it("substitutes defaults for missing parameters", () => {
        Ts.setRouteDefaults({ post: "99" });
        const route = Ts.defineRoute(Stubs.postsShow);

        // @ts-expect-error calling without args relies on runtime defaults for required params
        const result = route();

        expect(result.url).toBe("/posts/99");
    });

    it("caller-provided values override defaults", () => {
        Ts.setRouteDefaults({ post: "99" });
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ post: 42 });

        expect(result.url).toBe("/posts/42");
    });

    it("getRouteDefaults returns the current defaults", () => {
        Ts.setRouteDefaults({ locale: "en" });

        expect(Ts.getRouteDefaults()).toEqual({ locale: "en" });
    });

    it("resetRouteDefaults clears defaults", () => {
        Ts.setRouteDefaults({ locale: "en" });
        Ts.resetRouteDefaults();

        expect(Ts.getRouteDefaults()).toEqual({});
    });
});

describe("url method", () => {
    it(".url() returns URL string for named params", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        expect(route.url({ post: 42 })).toBe("/posts/42");
    });

    it(".url() returns URL string for spread params", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        expect(route.url(42)).toBe("/posts/42");
    });

    it(".url() returns URL string for array params", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        expect(route.url([42])).toBe("/posts/42");
    });
});

describe("plain scalar parameters", () => {
    it("resolves a plain string scalar", () => {
        const route = Ts.defineRoute(Stubs.paramsCamel);
        const result = route({ camelCase: "myValue" });

        expect(result.url).toBe("/params/myValue/camel");
    });

    it("resolves via spread", () => {
        const route = Ts.defineRoute(Stubs.paramsCamel);
        const result = route("myValue");

        expect(result.url).toBe("/params/myValue/camel");
    });
});

describe("toString on route itself", () => {
    it("returns URL with no args for zero-arg route", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect(`${route}`).toBe("/posts");
    });
});

describe("resolveParamValue edge cases", () => {
    it("resolves enum object with .value property via _enumValues binding", () => {
        const route = Ts.defineRoute(Stubs.enumOnly);
        const result = route({ val: { value: "a" } });

        expect(result.url).toBe("/enum/a");
    });

    it("enum object without .value throws instead of silent [object Object]", () => {
        const route = Ts.defineRoute(Stubs.enumOnly);

        // @ts-expect-error testing object without .value on enum-bound param
        expect(() => route({ val: { id: "b" } })).toThrow(
            "missing enum '.value' property",
        );
    });

    it("enum object without .value or .id also throws", () => {
        const route = Ts.defineRoute(Stubs.enumOnly);

        // @ts-expect-error testing object with neither .value nor .id on enum-bound param
        expect(() => route({ val: { foo: "bar" } })).toThrow(
            "missing enum '.value' property",
        );
    });

    it("plain object without routeKey or enumValues or id is stringified", () => {
        const route = Ts.defineRoute(Stubs.plainRequired);

        // @ts-expect-error testing object with custom toString on plain scalar param
        const result = route({ thing: { toString: () => "custom" } });

        expect(result.url).toBe("/plain/custom");
    });

    it("plain object with id but no binding extracts id", () => {
        const route = Ts.defineRoute(Stubs.plainRequired);

        // @ts-expect-error testing object with id on plain scalar param
        const result = route({ thing: { id: 55 } });

        expect(result.url).toBe("/plain/55");
    });

    it("handles null parameter as empty string", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);
        const result = route({ param: null });

        expect(result.url).toBe("/optional");
    });
});

describe("query string nested objects", () => {
    it("encodes nested objects with bracket notation", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ filter: { status: "active", type: "post" } });

        expect(result.url).toBe(
            "/posts?filter%5Bstatus%5D=active&filter%5Btype%5D=post",
        );
    });
});

describe("naked model with _routeKey field on the object", () => {
    it("resolves when object has _routeKey field", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route({ _routeKey: "id", id: 77 });

        expect(result.url).toBe("/posts/77");
    });
});

describe("normalizeArgs edge cases", () => {
    it("single object without segment keys or model id becomes query options", () => {
        const route = Ts.defineRoute(Stubs.optionalShow);

        const result = route({ page: 2, sort: "latest" });

        expect(result.url).toBe("/optional?page=2&sort=latest");
    });

    it("falls through to empty for unrecognized arg types", () => {
        const route = Ts.defineRoute(Stubs.postsShow);

        // @ts-expect-error testing unrecognized arg type
        expect(() => route(true)).toThrow("'post' parameter is required");
    });
});

describe("URL edge cases", () => {
    it("returns / when URL resolves to empty after stripping trailing slashes", () => {
        const route = Ts.defineRoute(Stubs.rootOptional);
        const result = route();

        expect(result.url).toBe("/");
    });

    it("strips trailing slashes from URL", () => {
        const route = Ts.defineRoute(Stubs.rootOptional);
        const result = route({ slug: "hello" });

        expect(result.url).toBe("/hello");
    });
});

describe("Routes with domains defined", () => {
    it("resolves HTTP domain URL with named param", () => {
        const route = Ts.defineRoute(Stubs.invoke);
        const result = route({ post: 42 });

        expect(result.url).toBe("http://example.com/invokable-model-plus/42");
        expect(result.method).toBe("get");
    });

    it("resolves HTTPS domain URL with named param", () => {
        const route = Ts.defineRoute(Stubs.extra);
        const result = route({ post: 42 });

        expect(result.url).toBe("https://example.com/invokable-model-extra/42");
        expect(result.method).toBe("post");
    });

    it("resolves protocol-relative domain URL with named param", () => {
        const route = Ts.defineRoute(Stubs.surprise);
        const result = route({ post: 42 });

        expect(result.url).toBe("//example.com/invokable-model-surprise/42");
        expect(result.method).toBe("delete");
    });

    it("resolves domain URL with model object", () => {
        const route = Ts.defineRoute(Stubs.invoke);
        const result = route({ post: { id: 99 } });

        expect(result.url).toBe("http://example.com/invokable-model-plus/99");
    });

    it("resolves domain URL with spread scalar", () => {
        const route = Ts.defineRoute(Stubs.extra);
        const result = route(7);

        expect(result.url).toBe("https://example.com/invokable-model-extra/7");
    });

    it("resolves domain URL with array form", () => {
        const route = Ts.defineRoute(Stubs.surprise);
        const result = route([15]);

        expect(result.url).toBe("//example.com/invokable-model-surprise/15");
    });

    it("appends query string to domain URL", () => {
        const route = Ts.defineRoute(Stubs.invoke);
        const result = route({ post: 42, page: 3 });

        expect(result.url).toBe(
            "http://example.com/invokable-model-plus/42?page=3",
        );
    });

    it("per-verb method works on domain route", () => {
        const route = Ts.defineRoute(Stubs.extra);
        const result = route.post({ post: 42 });

        expect(result.url).toBe("https://example.com/invokable-model-extra/42");
        expect(result.method).toBe("post");
    });

    it(".url() returns full domain URL string", () => {
        const route = Ts.defineRoute(Stubs.surprise);

        expect(route.url({ post: 5 })).toBe(
            "//example.com/invokable-model-surprise/5",
        );
    });

    it("toString() returns full domain URL with defaults", () => {
        Ts.setRouteDefaults({ post: "1" });
        const route = Ts.defineRoute(Stubs.invoke);

        expect(route.toString()).toBe(
            "http://example.com/invokable-model-plus/1",
        );
    });
});

describe("mid-path optional parameters (double-slash fix)", () => {
    it("omitting first optional param does not produce double slashes", () => {
        const route = Ts.defineRoute(Stubs.optionalMidPath);
        const result = route({ member: "jane" });

        expect(result.url).toBe("/team/members/jane/profile");
    });

    it("omitting second optional param does not produce double slashes", () => {
        const route = Ts.defineRoute(Stubs.optionalMidPath);
        const result = route({ team: "alpha" });

        expect(result.url).toBe("/team/alpha/members/profile");
    });

    it("omitting all optional params collapses all internal double slashes", () => {
        const route = Ts.defineRoute(Stubs.optionalMidPath);
        const result = route();

        expect(result.url).toBe("/team/members/profile");
    });

    it("providing all optional params produces the full path", () => {
        const route = Ts.defineRoute(Stubs.optionalMidPath);
        const result = route({ team: "alpha", member: "jane" });

        expect(result.url).toBe("/team/alpha/members/jane/profile");
    });

    it("domain route omitting optional param does not produce double slashes", () => {
        const route = Ts.defineRoute(Stubs.domainOptional);
        const result = route();

        expect(result.url).toBe("https://example.com/org/dashboard");
    });

    it("domain route with optional param provided produces the full URL", () => {
        const route = Ts.defineRoute(Stubs.domainOptional);
        const result = route({ org: "acme" });

        expect(result.url).toBe("https://example.com/org/acme/dashboard");
    });

    it("existing optionalMulti omitting first still works", () => {
        const route = Ts.defineRoute(Stubs.optionalMulti);
        const result = route({ two: "b" });

        expect(result.url).toBe("/optional/b");
    });
});
