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

describe("domain without protocol (domainNoProtocol)", () => {
    it("prepends protocol-relative // to bare domain URL", () => {
        const route = Ts.defineRoute(Stubs.domainNoProtocol);
        const result = route();

        expect(result.url).toBe("//api.example.com/domain");
        expect(result.method).toBe("get");
    });

    it(".url() returns protocol-relative URL", () => {
        const route = Ts.defineRoute(Stubs.domainNoProtocol);

        expect(route.url()).toBe("//api.example.com/domain");
    });

    it("toString() returns protocol-relative URL", () => {
        const route = Ts.defineRoute(Stubs.domainNoProtocol);

        expect(route.toString()).toBe("//api.example.com/domain");
    });

    it("appends query string to protocol-relative domain URL", () => {
        const route = Ts.defineRoute(Stubs.domainNoProtocol);
        const result = route({ page: 3 });

        expect(result.url).toBe("//api.example.com/domain?page=3");
    });
});

describe("UUID-bound route (uuidRoute)", () => {
    it("resolves UUID scalar value via named param", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route({
            uuidPost: "550e8400-e29b-41d4-a716-446655440000",
        });

        expect(result.url).toBe(
            "/pk-test/550e8400-e29b-41d4-a716-446655440000",
        );
    });

    it("resolves model object with uuid route key", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route({ uuidPost: { uuid: "abc-123" } });

        expect(result.url).toBe("/pk-test/abc-123");
    });

    it("falls back to id when uuid key is missing from object", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route({ uuidPost: { id: 42 } });

        expect(result.url).toBe("/pk-test/42");
    });

    it("throws when object has neither uuid nor id", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);

        // @ts-expect-error testing object without uuid or id keys
        expect(() => route({ uuidPost: { slug: "nope" } })).toThrow(
            "missing route model binding key 'uuid'",
        );
    });

    it("resolves via spread scalar", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route("abc-def-123");

        expect(result.url).toBe("/pk-test/abc-def-123");
    });

    it("resolves via array form", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route(["some-uuid"]);

        expect(result.url).toBe("/pk-test/some-uuid");
    });

    it("appends query params", () => {
        const route = Ts.defineRoute(Stubs.uuidRoute);
        const result = route({ uuidPost: "abc-123", include: "comments" });

        expect(result.url).toBe("/pk-test/abc-123?include=comments");
    });
});

describe("integer where-constrained route (showInt)", () => {
    it("passes with valid integer value", () => {
        const route = Ts.defineRoute(Stubs.showInt);
        const result = route({ id: 42 });

        expect(result.url).toBe("/typed/42");
    });

    it("passes with integer as string", () => {
        const route = Ts.defineRoute(Stubs.showInt);
        const result = route({ id: "123" });

        expect(result.url).toBe("/typed/123");
    });

    it("throws when value is a non-numeric string", () => {
        const route = Ts.defineRoute(Stubs.showInt);

        expect(() => route({ id: "abc" })).toThrow(
            "does not match required format",
        );
    });

    it("throws when value is a mixed alphanumeric string", () => {
        const route = Ts.defineRoute(Stubs.showInt);

        expect(() => route({ id: "12abc" })).toThrow(
            "does not match required format",
        );
    });

    it("throws when value is a boolean", () => {
        const route = Ts.defineRoute(Stubs.showInt);

        // boolean true becomes "true" which doesn't match [0-9]+
        // @ts-expect-error testing boolean value on integer-constrained route
        expect(() => route({ id: true })).toThrow(
            "does not match required format",
        );
    });

    it("throws when value is a float string", () => {
        const route = Ts.defineRoute(Stubs.showInt);

        expect(() => route({ id: "3.14" })).toThrow(
            "does not match required format",
        );
    });

    it("passes with zero", () => {
        const route = Ts.defineRoute(Stubs.showInt);
        const result = route({ id: 0 });

        expect(result.url).toBe("/typed/0");
    });

    it("resolves via spread", () => {
        const route = Ts.defineRoute(Stubs.showInt);
        const result = route(99);

        expect(result.url).toBe("/typed/99");
    });
});

describe("plain enum parameter route (showRole)", () => {
    it("resolves a role name as a plain string", () => {
        const route = Ts.defineRoute(Stubs.showRole);
        const result = route({ role: "Admin" });

        expect(result.url).toBe("/typed/role/Admin");
    });

    it("resolves other role values", () => {
        const route = Ts.defineRoute(Stubs.showRole);

        expect(route({ role: "User" }).url).toBe("/typed/role/User");
        expect(route({ role: "Guest" }).url).toBe("/typed/role/Guest");
    });

    it("resolves via spread scalar", () => {
        const route = Ts.defineRoute(Stubs.showRole);
        const result = route("Admin");

        expect(result.url).toBe("/typed/role/Admin");
    });

    it("resolves via array form", () => {
        const route = Ts.defineRoute(Stubs.showRole);
        const result = route(["User"]);

        expect(result.url).toBe("/typed/role/User");
    });

    it("throws when required role parameter is missing", () => {
        const route = Ts.defineRoute(Stubs.showRole);

        // @ts-expect-error testing missing required param
        expect(() => route({})).toThrow("'role' parameter is required");
    });

    it("appends query params alongside role", () => {
        const route = Ts.defineRoute(Stubs.showRole);
        const result = route({ role: "Admin", verbose: true });

        expect(result.url).toBe("/typed/role/Admin?verbose=1");
    });
});

describe("addRouteDefault", () => {
    it("adds a single default without overwriting existing ones", () => {
        Ts.setRouteDefaults({ locale: "en" });
        Ts.addRouteDefault("tenant", "acme");

        const defaults = Ts.getRouteDefaults();

        expect(defaults).toEqual({ locale: "en", tenant: "acme" });
    });

    it("overwrites an existing key when re-added", () => {
        Ts.addRouteDefault("locale", "en");
        Ts.addRouteDefault("locale", "fr");

        const defaults = Ts.getRouteDefaults();

        expect(defaults["locale"]).toBe("fr");
    });

    it("works with setRouteDefaults replacing all", () => {
        Ts.addRouteDefault("locale", "en");
        Ts.addRouteDefault("tenant", "acme");
        Ts.setRouteDefaults({ locale: "de" });

        const defaults = Ts.getRouteDefaults();

        expect(defaults).toEqual({ locale: "de" });
    });

    it("thunk is evaluated lazily on each URL build", () => {
        let counter = 0;
        Ts.setRouteDefaults(() => {
            counter++;
            return { locale: "en" };
        });

        const route = Ts.defineRoute({
            name: "test",
            url: "/{locale}/page",
            domain: null,
            methods: ["get"] as const,
            args: [{ name: "locale", required: false }] as const,
        });

        route();
        route();

        expect(counter).toBe(2);
    });

    it("resetRouteDefaults clears incrementally-added defaults", () => {
        Ts.addRouteDefault("locale", "en");
        Ts.addRouteDefault("tenant", "acme");
        Ts.resetRouteDefaults();

        const defaults = Ts.getRouteDefaults();

        expect(defaults).toEqual({});
    });

    it("substitutes numeric and boolean values as defaults", () => {
        Ts.setRouteDefaults({ page: 1 });

        const route = Ts.defineRoute({
            name: "test",
            url: "/items/{page}",
            domain: null,
            methods: ["get"] as const,
            args: [{ name: "page", required: false }] as const,
        });
        const result = route();

        expect(result.url).toBe("/items/1");
    });
});

describe("formSafeOptions", () => {
    it("injects _method into _query by default", () => {
        const options = Ts.formSafeOptions("patch");

        expect(options).toEqual({ _query: { _method: "PATCH" } });
    });

    it("injects _method into mergeQuery when mergeQuery is present", () => {
        const options = Ts.formSafeOptions("delete", {
            mergeQuery: { page: 1 },
        });

        expect(options).toEqual({
            mergeQuery: { _method: "DELETE", page: 1 },
        });
    });

    it("preserves existing _query values alongside _method", () => {
        const options = Ts.formSafeOptions("put", {
            _query: { redirect: "back" },
        });

        expect(options).toEqual({
            _query: { _method: "PUT", redirect: "back" },
        });
    });

    it("uppercases the method", () => {
        const options = Ts.formSafeOptions("head");

        expect(options._query).toEqual({ _method: "HEAD" });
    });
});

describe(".form on routes", () => {
    it("returns a callable form property", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect(typeof route.form).toBe("function");
    });

    it(".form() on a GET route returns { action, method: 'get' }", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route.form();

        expect(result.action).toBe("/posts");
        expect(result.method).toBe("get");
    });

    it(".form() on a POST route returns { action, method: 'post' }", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.form();

        expect(result.action).toBe("/posts");
        expect(result.method).toBe("post");
    });

    it(".form() on a DELETE route returns method: 'post'", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.form({ post: 42 });

        expect(result.action).toBe("/posts/42");
        expect(result.method).toBe("post");
    });

    it(".form.patch() injects _method=PATCH into the URL", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.form.patch({ post: 42 });

        expect(result.action).toBe("/posts/42?_method=PATCH");
        expect(result.method).toBe("post");
    });

    it(".form.put() injects _method=PUT into the URL", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.form.put({ post: 42 });

        expect(result.action).toBe("/posts/42?_method=PUT");
        expect(result.method).toBe("post");
    });

    it(".form.delete() injects _method=DELETE into the URL", () => {
        const route = Ts.defineRoute(Stubs.postsDestroy);
        const result = route.form.delete({ post: 42 });

        expect(result.action).toBe("/posts/42?_method=DELETE");
        expect(result.method).toBe("post");
    });

    it(".form.get() on GET route returns method: 'get' without _method", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form.get({ post: 42 });

        expect(result.action).toBe("/posts/42");
        expect(result.method).toBe("get");
    });

    it(".form.post() on POST route returns method: 'post' without _method", () => {
        const route = Ts.defineRoute(Stubs.postsStore);
        const result = route.form.post();

        expect(result.action).toBe("/posts");
        expect(result.method).toBe("post");
    });

    it(".form() with query options preserves user query params", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form.get({ post: 42 }, { _query: { page: 2 } });

        expect(result.action).toBe("/posts/42?page=2");
    });

    it(".form.patch() with additional _query merges _method with user params", () => {
        const route = Ts.defineRoute(Stubs.postsUpdate);
        const result = route.form.patch(
            { post: 42 },
            { _query: { redirect: "back" } },
        );

        expect(result.action).toContain("_method=PATCH");
        expect(result.action).toContain("redirect=back");
    });

    it(".form() toString() returns the action URL", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route.form();

        expect(result.toString()).toBe("/posts");
    });

    it(".form() with args using spread scalars", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route.form(42);

        expect(result.action).toBe("/posts/42");
        expect(result.method).toBe("get");
    });

    it(".form() on zero-arg route with query options", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route.form({ _query: { search: "hello" } });

        expect(result.action).toBe("/posts?search=hello");
        expect(result.method).toBe("get");
    });
});

describe("mergeQuery", () => {
    it("passes through mergeQuery values as query params (no window)", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ mergeQuery: { search: "hello" } });

        expect(result.url).toBe("/posts?search=hello");
    });

    it("removes keys with null values in mergeQuery", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ mergeQuery: { search: null, page: 2 } });

        expect(result.url).toBe("/posts?page=2");
        expect(result.url).not.toContain("search");
    });

    it("removes keys with undefined values in mergeQuery", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({ mergeQuery: { search: undefined, page: 3 } });

        expect(result.url).toBe("/posts?page=3");
    });

    it("mergeQuery works alongside _query", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);
        const result = route({
            mergeQuery: { search: "hello" },
            _query: { debug: "true" },
        });

        expect(result.url).toContain("search=hello");
        expect(result.url).toContain("debug=true");
    });

    it("works on routes with args", () => {
        const route = Ts.defineRoute(Stubs.postsShow);
        const result = route(
            { post: 42 },
            { mergeQuery: { highlight: "true" } },
        );

        expect(result.url).toBe("/posts/42?highlight=true");
    });

    it("merges with existing window.location.search when available", () => {
        const originalWindow = globalThis.window;

        // Mock window.location.search
        Object.defineProperty(globalThis, "window", {
            value: {
                location: { search: "?page=2&sort=title" },
            },
            writable: true,
            configurable: true,
        });

        try {
            const route = Ts.defineRoute(Stubs.postsIndex);
            const result = route({ mergeQuery: { search: "hello" } });

            expect(result.url).toContain("page=2");
            expect(result.url).toContain("sort=title");
            expect(result.url).toContain("search=hello");
        } finally {
            if (originalWindow === undefined) {
                // @ts-expect-error restoring original undefined
                delete globalThis.window;
            } else {
                Object.defineProperty(globalThis, "window", {
                    value: originalWindow,
                    writable: true,
                    configurable: true,
                });
            }
        }
    });

    it("mergeQuery overrides existing window query params", () => {
        const originalWindow = globalThis.window;

        Object.defineProperty(globalThis, "window", {
            value: {
                location: { search: "?page=2&sort=title" },
            },
            writable: true,
            configurable: true,
        });

        try {
            const route = Ts.defineRoute(Stubs.postsIndex);
            const result = route({ mergeQuery: { page: 5 } });

            expect(result.url).toContain("page=5");
            expect(result.url).toContain("sort=title");
            expect(result.url).not.toContain("page=2");
        } finally {
            if (originalWindow === undefined) {
                // @ts-expect-error restoring original undefined
                delete globalThis.window;
            } else {
                Object.defineProperty(globalThis, "window", {
                    value: originalWindow,
                    writable: true,
                    configurable: true,
                });
            }
        }
    });

    it("mergeQuery removes existing window query params with null", () => {
        const originalWindow = globalThis.window;

        Object.defineProperty(globalThis, "window", {
            value: {
                location: { search: "?page=2&sort=title" },
            },
            writable: true,
            configurable: true,
        });

        try {
            const route = Ts.defineRoute(Stubs.postsIndex);
            const result = route({ mergeQuery: { sort: null } });

            expect(result.url).toContain("page=2");
            expect(result.url).not.toContain("sort");
        } finally {
            if (originalWindow === undefined) {
                // @ts-expect-error restoring original undefined
                delete globalThis.window;
            } else {
                Object.defineProperty(globalThis, "window", {
                    value: originalWindow,
                    writable: true,
                    configurable: true,
                });
            }
        }
    });
});

describe("single component (no args)", () => {
    it("exposes .component on the route", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);

        expect(route.component).toBe("Dashboard");
    });

    it("includes component in .definition", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);

        expect(route.definition.component).toBe("Dashboard");
    });

    it(".withComponent() returns call result with component", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        const result = route.withComponent();

        expect(result.url).toBe("/dashboard");
        expect(result.method).toBe("get");
        expect(result.component).toBe("Dashboard");
    });

    it(".withComponent() passes query options through", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        const result = route.withComponent({ page: 2 });

        expect(result.url).toBe("/dashboard?page=2");
        expect(result.component).toBe("Dashboard");
    });

    it(".withComponent() result has toString()", () => {
        const route = Ts.defineRoute(Stubs.dashboardPage);
        const result = route.withComponent();

        expect(result.toString()).toBe("/dashboard");
    });
});

describe("single component (with args)", () => {
    it("exposes .component on the route", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);

        expect(route.component).toBe("Users/Profile");
    });

    it(".withComponent() accepts named args", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        const result = route.withComponent({ user: 42 });

        expect(result.url).toBe("/users/42/profile");
        expect(result.component).toBe("Users/Profile");
    });

    it(".withComponent() accepts named args with options", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        const result = route.withComponent({ user: 42 }, { tab: "posts" });

        expect(result.url).toBe("/users/42/profile?tab=posts");
        expect(result.component).toBe("Users/Profile");
    });

    it(".withComponent() accepts positional args", () => {
        const route = Ts.defineRoute(Stubs.userProfilePage);
        const result = route.withComponent(42);

        expect(result.url).toBe("/users/42/profile");
        expect(result.component).toBe("Users/Profile");
    });
});

describe("multi component (no args)", () => {
    it("exposes .component as the component map", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);

        expect(route.component).toStrictEqual({
            authenticated: "Conditional/Authenticated",
            guest: "Conditional/Guest",
        });
    });

    it("includes component map in .definition", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);

        expect(route.definition.component).toStrictEqual({
            authenticated: "Conditional/Authenticated",
            guest: "Conditional/Guest",
        });
    });

    it(".withComponent() selects a component by value", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);
        const result = route.withComponent("Conditional/Guest");

        expect(result.url).toBe("/conditional");
        expect(result.method).toBe("get");
        expect(result.component).toBe("Conditional/Guest");
    });

    it(".withComponent() passes query options for multi component", () => {
        const route = Ts.defineRoute(Stubs.conditionalPage);
        const result = route.withComponent("Conditional/Authenticated", {
            ref: "home",
        });

        expect(result.url).toBe("/conditional?ref=home");
        expect(result.component).toBe("Conditional/Authenticated");
    });
});

describe("multi component (with args)", () => {
    it("exposes .component as the component map", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);

        expect(route.component).toStrictEqual({
            detail: "Items/Detail",
            preview: "Items/Preview",
        });
    });

    it(".withComponent() selects component and accepts args", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        const result = route.withComponent("Items/Detail", { item: 7 });

        expect(result.url).toBe("/multi/7");
        expect(result.component).toBe("Items/Detail");
    });

    it(".withComponent() selects component with args and options", () => {
        const route = Ts.defineRoute(Stubs.multiComponentWithArgs);
        const result = route.withComponent("Items/Preview", { item: 3 }, {
            expanded: "true",
        });

        expect(result.url).toBe("/multi/3?expanded=true");
        expect(result.component).toBe("Items/Preview");
    });
});

describe("no component", () => {
    it("does not expose .component on routes without component", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect("component" in route).toBe(false);
    });

    it("does not expose .withComponent on routes without component", () => {
        const route = Ts.defineRoute(Stubs.postsIndex);

        expect("withComponent" in route).toBe(false);
    });
});
