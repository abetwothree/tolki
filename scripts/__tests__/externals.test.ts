import { describe, expect, it } from "vitest";

import { packageExternals } from "../build/externals.ts";

const external = packageExternals({
    name: "@tolki/fake",
    dependencies: { "markdown-it": "^14", "to-words": "^5" },
    peerDependencies: { vue: "^3" },
});

describe("packageExternals", () => {
    it.each([
        "node:fs",
        "fs",
        "markdown-it",
        "markdown-it/lib/x.mjs",
        "to-words/locales/en-US",
        "vue",
        "@tolki/fake",
        "@tolki/fake/sub",
    ])("treats %s as external", (id) => {
        expect(external(id)).toBe(true);
    });

    it.each([
        "./x.js",
        "../x.js",
        "/abs/x.js",
        "C:\\abs\\x.js",
        "\0vite/preload-helper.js",
    ])("bundles %s", (id) => {
        expect(external(id)).toBe(false);
    });

    it("throws on an undeclared bare import, naming the package and the import", () => {
        expect(() => external("lodash")).toThrow(
            '@tolki/fake imports "lodash", which is not in its dependencies or peerDependencies',
        );
        expect(() => external("@scope/pkg/sub")).toThrow('"@scope/pkg/sub"');
    });
});
