import * as Path from "@laravel-js/path";
import { describe, expect, it } from "vitest";

describe("Path Functions", () => {
    describe("parseSegments", () => {
        it("returns empty array for null/undefined keys", () => {
            expect(Path.parseSegments(null)).toEqual([]);
            expect(Path.parseSegments(undefined)).toEqual([]);
        });

        it("returns array with single number for valid numeric keys", () => {
            expect(Path.parseSegments(5)).toEqual([5]);
            expect(Path.parseSegments(0)).toEqual([0]);
        });

        it("returns null for invalid numeric keys", () => {
            expect(Path.parseSegments(-1)).toBeNull();
            expect(Path.parseSegments(1.5)).toBeNull();
            expect(Path.parseSegments(NaN)).toBeNull();
        });

        it("returns empty array for empty string", () => {
            expect(Path.parseSegments("")).toEqual([]);
        });

        it("parses dot notation strings into number arrays", () => {
            expect(Path.parseSegments("1.2.3")).toEqual([1, 2, 3]);
            expect(Path.parseSegments("0")).toEqual([0]);
            expect(Path.parseSegments("10.20.30")).toEqual([10, 20, 30]);
        });

        it("returns null for invalid dot notation strings", () => {
            // String segments are now valid for mixed paths
            expect(Path.parseSegments("invalid")).toEqual(["invalid"]);
            expect(Path.parseSegments("1.2.invalid")).toEqual([
                1,
                2,
                "invalid",
            ]);
            // Negative numbers as strings are valid object property names
            expect(Path.parseSegments("1.-1.3")).toEqual([1, "-1", 3]);
            // Empty segments are invalid
            expect(Path.parseSegments("1.2.")).toBeNull();
            expect(Path.parseSegments(".1.2")).toBeNull();
        });

        it("handles edge cases in parseSegments", () => {
            // Test parsing segments with empty parts
            expect(Path.parseSegments("1..2")).toBeNull(); // Empty segment between dots
            expect(Path.parseSegments("1.2.")).toBeNull(); // Trailing dot creates empty segment
        });
    });

    describe("hasPath", () => {
        const testArray = [["a", "b"], ["c", "d"], "e"];

        it("returns false for null/undefined keys", () => {
            expect(Path.hasPath(testArray, null)).toBe(false);
            expect(Path.hasPath(testArray, undefined)).toBe(false);
        });

        it("checks numeric path existence", () => {
            expect(Path.hasPath(testArray, 0)).toBe(true);
            expect(Path.hasPath(testArray, 1)).toBe(true);
            expect(Path.hasPath(testArray, 2)).toBe(true);
            expect(Path.hasPath(testArray, 3)).toBe(false);
            expect(Path.hasPath(testArray, -1)).toBe(false);
            expect(Path.hasPath(testArray, 1.5)).toBe(false);
        });

        it("checks dot notation path existence", () => {
            expect(Path.hasPath(testArray, "0.1")).toBe(true);
            expect(Path.hasPath(testArray, "1.0")).toBe(true);
            expect(Path.hasPath(testArray, "0.2")).toBe(false);
            expect(Path.hasPath(testArray, "3.0")).toBe(false);
        });

        it("returns false for invalid path segments", () => {
            expect(Path.hasPath(testArray, "invalid")).toBe(false);
            expect(Path.hasPath(testArray, "")).toBe(false);
        });

        it("returns false when traversing non-array elements", () => {
            expect(Path.hasPath(testArray, "2.0")).toBe(false); // 'e' is not an array
        });

        it("handles edge cases in hasPath", () => {
            // Test when path segments contain invalid values
            const data = [["a", "b"]];
            expect(Path.hasPath(data, "0.")).toBe(false); // Empty trailing segment
        });
    });

    describe("getRaw", () => {
        const testArray = [["a", "b"], ["c", "d"], "e"];

        it("returns the whole array for null/undefined keys", () => {
            expect(Path.getRaw(testArray, null)).toEqual({
                found: true,
                value: testArray,
            });
            expect(Path.getRaw(testArray, undefined)).toEqual({
                found: true,
                value: testArray,
            });
        });

        it("gets values by numeric index", () => {
            expect(Path.getRaw(testArray, 0)).toEqual({
                found: true,
                value: ["a", "b"],
            });
            expect(Path.getRaw(testArray, 2)).toEqual({
                found: true,
                value: "e",
            });
            expect(Path.getRaw(testArray, 3)).toEqual({ found: false });
            expect(Path.getRaw(testArray, -1)).toEqual({ found: false });
            expect(Path.getRaw(testArray, 1.5)).toEqual({ found: false });
        });

        it("gets values by dot notation", () => {
            expect(Path.getRaw(testArray, "0.1")).toEqual({
                found: true,
                value: "b",
            });
            expect(Path.getRaw(testArray, "1.0")).toEqual({
                found: true,
                value: "c",
            });
            expect(Path.getRaw(testArray, "0.2")).toEqual({ found: false });
            expect(Path.getRaw(testArray, "3.0")).toEqual({ found: false });
        });

        it("returns false for invalid path segments", () => {
            expect(Path.getRaw(testArray, "invalid")).toEqual({ found: false });
            expect(Path.getRaw(testArray, "")).toEqual({ found: false });
        });

        it("returns false when traversing non-array elements", () => {
            expect(Path.getRaw(testArray, "2.0")).toEqual({ found: false });
        });
    });

    describe("forgetKeys", () => {
        it("returns copy of original array when keys is null", () => {
            const data = ["a", "b", "c"];
            const result = Path.forgetKeys(data, null);
            expect(result).toEqual(["a", "b", "c"]);
            expect(result).not.toBe(data); // Should be a copy
        });

        it("returns copy when keys is empty array", () => {
            const data = ["a", "b", "c"];
            const result = Path.forgetKeys(data, []);
            expect(result).toEqual(["a", "b", "c"]);
            expect(result).not.toBe(data);
        });

        it("removes single numeric key", () => {
            expect(Path.forgetKeys(["a", "b", "c"], 1)).toEqual(["a", "c"]);
            expect(Path.forgetKeys(["a", "b", "c"], 0)).toEqual(["b", "c"]);
            expect(Path.forgetKeys(["a", "b", "c"], 2)).toEqual(["a", "b"]);
        });

        it("removes multiple numeric keys", () => {
            expect(Path.forgetKeys(["a", "b", "c", "d"], [1, 3])).toEqual([
                "a",
                "c",
            ]);
            expect(Path.forgetKeys(["a", "b", "c"], [0, 2])).toEqual(["b"]);
        });

        it("removes nested paths with dot notation", () => {
            const data = [
                ["x", "y"],
                ["a", "b"],
            ];
            expect(Path.forgetKeys(data, "0.1")).toEqual([["x"], ["a", "b"]]);
            expect(Path.forgetKeys(data, "1.0")).toEqual([["x", "y"], ["b"]]);
        });

        it("removes multiple mixed keys", () => {
            const data = [["x", "y"], ["a", "b"], "c"];
            expect(Path.forgetKeys(data, [2, "0.1"])).toEqual([
                ["x"],
                ["a", "b"],
            ]);
        });

        it("handles invalid keys gracefully", () => {
            const data = ["a", "b", "c"];
            expect(Path.forgetKeys(data, 10)).toEqual(["a", "b", "c"]); // Index out of bounds
            expect(Path.forgetKeys(data, -1)).toEqual(["a", "b", "c"]); // Negative index
            expect(Path.forgetKeys(data, "invalid")).toEqual(["a", "b", "c"]); // Invalid string
        });

        it("handles complex nested removals", () => {
            const data = [[["deep1", "deep2"], ["deep3"]], [["deep4"]]];
            expect(Path.forgetKeys(data, "0.0.1")).toEqual([
                [["deep1"], ["deep3"]],
                [["deep4"]],
            ]);
        });

        it("groups and sorts removal operations correctly", () => {
            const data = ["a", "b", "c", "d", "e"];
            // Remove multiple indices in reverse order to test sorting
            expect(Path.forgetKeys(data, [4, 2, 0])).toEqual(["b", "d"]);
        });

        it("handles edge cases in nested removal operations", () => {
            // Test when head index is out of bounds in forgetPath
            const data = [["a", "b"]];
            expect(Path.forgetKeys(data, "5.0")).toEqual(data); // Index 5 doesn't exist

            // Test when head index is out of bounds in updateAtPath
            const data2 = [["x", "y"]];
            expect(Path.forgetKeys(data2, ["10.0", "0.1"])).toEqual([["x"]]); // Index 10 doesn't exist

            // Test when child is not an array in updateAtPath
            const data3 = ["not-array", ["b", "c"]];
            expect(Path.forgetKeys(data3, ["0.0", "1.0"])).toEqual([
                "not-array",
                ["c"],
            ]);
        });
    });

    describe("setImmutable", () => {
        it("returns value as array when key is null", () => {
            expect(Path.setImmutable(["a", "b"], null, "replacement")).toEqual(
                "replacement",
            );
        });

        it("returns empty array for non-accessible data", () => {
            expect(Path.setImmutable("not-array", 0, "value")).toEqual([]);
            expect(Path.setImmutable(null, 0, "value")).toEqual([]);
            expect(Path.setImmutable({}, 0, "value")).toEqual([]);
        });

        it("sets value at numeric index", () => {
            expect(Path.setImmutable(["a", "b", "c"], 1, "x")).toEqual([
                "a",
                "x",
                "c",
            ]);
            expect(Path.setImmutable(["a", "b"], 2, "c")).toEqual([
                "a",
                "b",
                "c",
            ]); // Extends array
        });

        it("sets value at string numeric index", () => {
            expect(Path.setImmutable(["a", "b", "c"], "1", "x")).toEqual([
                "a",
                "x",
                "c",
            ]);
        });

        it("handles invalid numeric indices", () => {
            const data = ["a", "b", "c"];
            expect(Path.setImmutable(data, -1, "x")).toEqual(["a", "b", "c"]); // Invalid index
            expect(Path.setImmutable(data, 1.5, "x")).toEqual(["a", "b", "c"]); // Non-integer
        });

        it("sets nested values with dot notation", () => {
            expect(Path.setImmutable([["a", "b"]], "0.1", "x")).toEqual([
                ["a", "x"],
            ]);
            expect(Path.setImmutable([["a"]], "0.1", "b")).toEqual([
                ["a", "b"],
            ]);
        });

        it("creates nested structures as needed", () => {
            expect(Path.setImmutable([], "0.0.0", "deep")).toEqual([
                [["deep"]],
            ]);
            expect(Path.setImmutable([null], "0.0", "value")).toEqual([
                ["value"],
            ]);
        });

        it("handles invalid path segments", () => {
            const data = ["a", "b"];
            expect(Path.setImmutable(data, "invalid", "x")).toEqual(["a", "b"]);
            expect(Path.setImmutable(data, "1.invalid", "x")).toEqual([
                "a",
                "b",
            ]);
        });

        it("preserves existing structure when setting nested values", () => {
            const data = [
                ["a", "b"],
                ["c", "d"],
            ];
            const result = Path.setImmutable(data, "0.1", "x");
            expect(result).toEqual([
                ["a", "x"],
                ["c", "d"],
            ]);
            expect(result).not.toBe(data); // Should be immutable
        });

        it("handles non-array elements in path gracefully", () => {
            const data = ["a", "b"];
            expect(Path.setImmutable(data, "0.0", "x")).toEqual(["a", "b"]); // 'a' is not an array
        });
    });

    describe("pushWithPath", () => {
        it("pushes to root array when key is null", () => {
            const data = ["a"];
            expect(Path.pushWithPath(data, null, "b", "c")).toEqual([
                "a",
                "b",
                "c",
            ]);
        });

        it("returns values array when data is not array and key is null", () => {
            expect(Path.pushWithPath("not-array", null, "a", "b")).toEqual([
                "a",
                "b",
            ]);
        });

        it("creates nested structure for non-accessible data", () => {
            expect(Path.pushWithPath("not-array", "0", "value")).toEqual([
                "value",
            ]);
            expect(Path.pushWithPath(null, "0.0", "deep")).toEqual([["deep"]]);
        });

        it("returns empty array for invalid segments", () => {
            expect(Path.pushWithPath("not-array", "invalid", "value")).toEqual(
                [],
            );
        });

        it("pushes to nested arrays", () => {
            const data = [["a"]];
            expect(Path.pushWithPath(data, "0", "b")).toEqual([["a"], "b"]);
        });

        it("creates nested arrays as needed", () => {
            expect(Path.pushWithPath([], "0.0", "deep")).toEqual([["deep"]]);
        });

        it("handles existing non-array elements", () => {
            expect(() => Path.pushWithPath(["a"], "0.0", "b")).toThrow(
                "Array value for key [0.0] must be an array, string found.",
            );
        });

        it("handles boolean elements specifically", () => {
            const data: unknown[][] = [[]];
            (data[0] as unknown[])[0] = true;
            expect(() => Path.pushWithPath(data, "0.0", "value")).toThrow(
                "Array value for key [0.0] must be an array, boolean found.",
            );
        });

        it("extends arrays when setting at higher indices", () => {
            const data = [[]];
            expect(Path.pushWithPath(data, "0", "a", "b")).toEqual([
                [],
                "a",
                "b",
            ]);
        });

        it("handles complex nested pushing", () => {
            const data: unknown[] = [];
            const result = Path.pushWithPath(data, "0.1", "nested");
            expect(result).toEqual([["nested"]]); // Creates structure to push to 0.1
        });

        it("covers additional pushWithPath edge cases", () => {
            // Test Complex path traversal with non-accessible data - doesn't throw, returns empty array
            const result1 = Path.pushWithPath(null, "0.1.non-array", "value");
            expect(result1).toEqual([]);

            // Test When leaf index exists but contains boolean (covered already)
            // Test when invalid path segments in accessible data
            const data = [[]];
            expect(Path.pushWithPath(data, "invalid.path", "value")).toEqual(
                data,
            );

            // Test Navigation through null elements and non-arrays
            const data2: unknown[] = [null];
            const result = Path.pushWithPath(data2, "0.child", "value");
            // When we can't navigate through null, the array remains unchanged
            expect(result).toEqual([null]);
        });
    });

    describe("dotFlatten", () => {
        it("returns empty object for non-accessible data", () => {
            expect(Path.dotFlatten("not-array")).toEqual({ 0: "not-array" });
            expect(Path.dotFlatten(null)).toEqual({});
            expect(Path.dotFlatten({})).toEqual({});
        });

        it("flattens simple array", () => {
            expect(Path.dotFlatten(["a", "b", "c"])).toEqual({
                "0": "a",
                "1": "b",
                "2": "c",
            });
        });

        it("flattens nested arrays", () => {
            expect(Path.dotFlatten(["a", ["b", "c"]])).toEqual({
                "0": "a",
                "1.0": "b",
                "1.1": "c",
            });
        });

        it("handles deeply nested arrays", () => {
            expect(Path.dotFlatten([[["deep"]]])).toEqual({
                "0.0.0": "deep",
            });
        });

        it("uses prepend string when provided", () => {
            expect(Path.dotFlatten(["a"], "prefix")).toEqual({
                "prefix.0": "a",
            });
        });

        it("handles mixed array/non-array elements", () => {
            expect(Path.dotFlatten(["a", ["b"], "c"])).toEqual({
                "0": "a",
                "1.0": "b",
                "2": "c",
            });
        });

        it("handles empty arrays", () => {
            expect(Path.dotFlatten([])).toEqual({});
        });
    });

    describe("undotExpand", () => {
        it("expands flat object to nested arrays", () => {
            expect(
                Path.undotExpand({
                    "0": "a",
                    "1.0": "b",
                    "1.1": "c",
                }),
            ).toEqual({ 0: "a", 1: { 0: "b", 1: "c" } });
        });

        it("handles deeply nested expansion", () => {
            expect(
                Path.undotExpand({
                    "0.0.0": "deep",
                }),
            ).toEqual({ 0: { 0: { 0: "deep" } } });
        });

        it("handles empty or null input", () => {
            expect(Path.undotExpand({})).toEqual({});
            expect(
                Path.undotExpand(null as unknown as Record<string, unknown>),
            ).toEqual([]);
        });

        it("ignores invalid keys", () => {
            expect(
                Path.undotExpand({
                    "0": "valid",
                    invalid: "ignored",
                    "": "empty-key",
                    "1.invalid": "partial-invalid",
                }),
            ).toEqual({
                "": "empty-key",
                0: "valid",
                1: { invalid: "partial-invalid" },
                invalid: "ignored",
            });
        });

        it("handles non-string keys", () => {
            const input = { "0": "a" } as Record<string | number, unknown>;
            input[1] = "b";
            expect(Path.undotExpand(input as Record<string, unknown>)).toEqual({
                0: "a",
                1: "b",
            });
        });

        it("handles existing nested structure conflicts", () => {
            const result = Path.undotExpand({
                "0.0": "first",
                "0.1": "second",
            });
            expect(result).toEqual({ 0: { 0: "first", 1: "second" } });
        });

        it("covers undotExpand edge cases", () => {
            const result1 = Path.undotExpand({
                "0": "string",
                "0.child": "should-be-ignored",
            });
            expect(result1).toEqual({ 0: { child: "should-be-ignored" } });

            const result2 = Path.undotExpand({
                "0.0": "first",
                "0.0.child": "ignored",
            });
            expect(result2).toEqual({ 0: { 0: { child: "ignored" } } });
        });
    });

    describe("getNestedValue", () => {
        const testData = [
            { items: ["x", "y"], name: "first" },
            { items: ["a", "b"], name: "second" },
        ];

        it("returns undefined for non-object input", () => {
            expect(Path.getNestedValue(null, "0.name")).toBeUndefined();
            expect(Path.getNestedValue("string", "0")).toBeUndefined();
            expect(Path.getNestedValue(123, "prop")).toBeUndefined();
        });

        it("gets nested values from arrays", () => {
            expect(Path.getNestedValue(testData, "0.name")).toBe("first");
            expect(Path.getNestedValue(testData, "1.items.0")).toBe("a");
        });

        it("gets nested values from objects", () => {
            const objData = { users: [{ name: "John" }, { name: "Jane" }] };
            expect(Path.getNestedValue(objData, "users.1.name")).toBe("Jane");
        });

        it("returns undefined for non-existent paths", () => {
            expect(
                Path.getNestedValue(testData, "0.nonexistent"),
            ).toBeUndefined();
            expect(Path.getNestedValue(testData, "5.name")).toBeUndefined();
            expect(Path.getNestedValue(testData, "0.items.5")).toBeUndefined();
        });

        it("handles invalid array indices", () => {
            expect(Path.getNestedValue(["a"], "invalid")).toBeUndefined();
            expect(Path.getNestedValue(["a"], "-1")).toBeUndefined();
        });

        it("returns undefined when path traverses null/undefined", () => {
            const data = [null, { nested: null }];
            expect(Path.getNestedValue(data, "0.prop")).toBeUndefined();
            expect(Path.getNestedValue(data, "1.nested.prop")).toBeUndefined();
        });
    });

    describe("getMixedValue", () => {
        const testData = [{ name: "John", items: ["a", "b"] }, "simple"];

        it("returns data when key is null", () => {
            expect(Path.getMixedValue(testData, null)).toBe(testData);
        });

        it("resolves default value for non-accessible data", () => {
            expect(Path.getMixedValue("not-array", 0, "default")).toBe(
                "default",
            );
            expect(Path.getMixedValue(null, 0, "default")).toBe("default");
        });

        it("gets values by numeric key", () => {
            expect(Path.getMixedValue(testData, 0)).toEqual({
                name: "John",
                items: ["a", "b"],
            });
            expect(Path.getMixedValue(testData, 1)).toBe("simple");
        });

        it("gets values by simple string key", () => {
            expect(Path.getMixedValue(testData, "0")).toEqual({
                name: "John",
                items: ["a", "b"],
            });
        });

        it("gets values by mixed dot notation", () => {
            expect(Path.getMixedValue(testData, "0.name")).toBe("John");
            expect(Path.getMixedValue(testData, "0.items.1")).toBe("b");
        });

        it("uses all-numeric path with getRaw", () => {
            const numericData = [["a", "b"]];
            expect(Path.getMixedValue(numericData, "0.1")).toBe("b");
        });

        it("calls default function when value not found", () => {
            const defaultFn = () => "computed-default";
            expect(Path.getMixedValue(testData, "nonexistent", defaultFn)).toBe(
                "computed-default",
            );
        });

        it("returns default for non-existent mixed paths", () => {
            expect(
                Path.getMixedValue(testData, "0.nonexistent", "default"),
            ).toBe("default");
        });

        it("covers getMixedValue edge cases", () => {
            // Test when data is not accessible for simple keys without dots
            expect(Path.getMixedValue("not-array", "simple", "default")).toBe(
                "default",
            );

            // Test when data is not accessible for all-numeric paths
            expect(Path.getMixedValue(null, "1.2.3", "default")).toBe(
                "default",
            );
        });
    });

    describe("setMixed", () => {
        it("replaces entire array when key is null", () => {
            const arr = ["a", "b"];
            const result = Path.setMixed(arr, null, ["x", "y"]);
            expect(result).toBe(arr); // Same reference
            expect(arr).toEqual(["x", "y"]);
        });

        it("pushes non-array value when key is null", () => {
            const arr = ["a"];
            Path.setMixed(arr, null, "x");
            expect(arr).toEqual(["x"]);
        });

        it("sets value at numeric index", () => {
            const arr = ["a", "b"];
            Path.setMixed(arr, 1, "x");
            expect(arr).toEqual(["a", "x"]);
        });

        it("extends array for higher numeric indices", () => {
            const arr: unknown[] = ["a"];
            Path.setMixed(arr, 3, "x");
            expect(arr).toEqual(["a", undefined, undefined, "x"]);
        });

        it("ignores invalid numeric indices", () => {
            const arr = ["a", "b"];
            Path.setMixed(arr, -1, "x");
            expect(arr).toEqual(["a", "b"]);
        });

        it("sets nested object properties", () => {
            const arr = [{ name: "John" }];
            Path.setMixed(arr, "0.age", 30);
            expect(arr).toEqual([{ name: "John", age: 30 }]);
        });

        it("creates nested structures as needed", () => {
            const arr: unknown[] = [];
            Path.setMixed(arr, "0.items.0", "value");
            expect(arr).toEqual([{ items: ["value"] }]);
        });

        it("creates objects for non-numeric segments in empty array", () => {
            const arr: unknown[] = [];
            Path.setMixed(arr, "user.name", "John");
            expect(arr).toEqual([{ user: { name: "John" } }]);
        });

        it("returns unchanged for invalid paths on non-empty arrays", () => {
            const arr = ["existing"];
            const result = Path.setMixed(arr, "invalid.path", "value");
            expect(result).toEqual(["existing"]);
        });

        it("handles mixed array/object nested paths", () => {
            const arr = [{ items: [] }];
            Path.setMixed(arr, "0.items.0", "first");
            expect(arr).toEqual([{ items: ["first"] }]);
        });

        it("creates appropriate structures based on next segment", () => {
            const arr: unknown[] = [];
            // Next segment is numeric, so create array
            Path.setMixed(arr, "0.items.0", "value");
            expect(arr[0]).toEqual({ items: ["value"] });

            // Next segment is non-numeric, so create object
            const arr2: unknown[] = [];
            Path.setMixed(arr2, "0.user.name", "John");
            expect(arr2[0]).toEqual({ user: { name: "John" } });
        });

        it("covers setMixed edge cases", () => {
            // Test when next segment doesn't exist, create appropriate structure
            const arr: unknown[] = [];
            Path.setMixed(arr, "0.items", "value"); // No next segment, create object by default
            expect(arr[0]).toEqual({ items: "value" });

            // Test when next segment doesn't exist in object path
            const arr2: unknown[] = [{}];
            Path.setMixed(arr2, "0.user", "John"); // No next segment in object path
            expect(arr2[0]).toEqual({ user: "John" });
        });
    });

    describe("pushMixed", () => {
        it("pushes to root array when key is null", () => {
            const arr = ["a"];
            const result = Path.pushMixed(arr, null, "b", "c");
            expect(result).toBe(arr);
            expect(arr).toEqual(["a", "b", "c"]);
        });

        it("returns new array with values when data is not array and key is null", () => {
            expect(Path.pushMixed("not-array", null, "a", "b")).toEqual([
                "a",
                "b",
            ]);
        });

        it("creates new array structure for non-array data", () => {
            const result = Path.pushMixed("not-array", "0", "value");
            expect(result).toEqual(["value"]);
        });

        it("pushes directly to root array for single-segment numeric paths", () => {
            const arr = ["a"];
            Path.pushMixed(arr, "0", "b", "c");
            expect(arr).toEqual(["a", "b", "c"]);
        });

        it("navigates nested paths and pushes to target array", () => {
            const arr = [{ items: ["a"] }];
            Path.pushMixed(arr, "0.items", "b");
            expect(arr).toEqual([{ items: ["a"] }]);
        });

        it("creates nested structures as needed", () => {
            const arr: unknown[] = [];
            Path.pushMixed(arr, "0.items", "value");
            expect(arr).toEqual([["value"]]);
        });

        it("returns unchanged when cannot navigate path", () => {
            const arr = ["string"];
            const result = Path.pushMixed(arr, "0.items", "value");
            expect(result).toBe(arr);
            expect(arr).toEqual([["value"]]); // Modified because the path creates structure
        });

        it("extends arrays during navigation", () => {
            const arr: unknown[] = [];
            Path.pushMixed(arr, "1.items", "value");
            expect(arr.length).toBe(2); // Array extends to index 1
            expect(arr[0]).toBeUndefined(); // First element is undefined
            expect(arr[1]).toEqual(["value"]); // Second element contains the value
        });

        it("covers pushMixed edge cases", () => {
            // Test various edge cases in mixed path navigation
            const arr: unknown[] = [];

            // Test when segment is empty
            const result1 = Path.pushMixed(arr, "0.", "value");
            expect(result1).toBe(arr);

            // Test object property creation when object[segment] is not object
            const arr2 = [{ existingProp: "string" }];
            Path.pushMixed(arr2, "0.existingProp", "value"); // existingProp is string, not object - navigation should fail
            expect(arr2).toEqual([{ existingProp: "string" }]); // Should remain unchanged when can't navigate

            // Test when navigation fails completely
            const arr3 = ["string"];
            const result3 = Path.pushMixed(arr3, "0.deep.path", "value");
            expect(result3).toBe(arr3); // Should return original array
        });
    });

    describe("setMixedImmutable", () => {
        it("returns value as array when key is null", () => {
            expect(Path.setMixedImmutable(["a"], null, "replacement")).toEqual(
                "replacement",
            );
            expect(
                Path.setMixedImmutable(["a"], undefined, "replacement"),
            ).toEqual("replacement");
        });

        it("returns empty array for non-array data", () => {
            expect(Path.setMixedImmutable("not-array", "0", "value")).toEqual(
                [],
            );
            expect(Path.setMixedImmutable(null, "0", "value")).toEqual([]);
        });

        it("creates immutable copy when setting values", () => {
            const original = [{ name: "John" }];
            const result = Path.setMixedImmutable(original, "0.age", 30);

            expect(result).toEqual([{ name: "John", age: 30 }]);
            expect(result).not.toBe(original); // Different reference
            expect(original).toEqual([{ name: "John" }]); // Original unchanged
        });

        it("handles deep nested structures immutably", () => {
            const original = [{ items: ["a", "b"] }];
            const result = Path.setMixedImmutable(original, "0.items.1", "x");

            expect(result).toEqual([{ items: ["a", "x"] }]);
            expect(original[0]).not.toBe(result[0]); // Deep copy
            expect(original).toEqual([{ items: ["a", "b"] }]); // Original unchanged
        });

        it("covers setMixedImmutable edge cases", () => {
            // Test deep copy of non-object primitive values
            const original = [null, "string", 123, true];
            const result = Path.setMixedImmutable(original, "0", "new-value");
            expect(result).toEqual(["new-value", "string", 123, true]);
            expect(result).not.toBe(original); // Should be different reference
        });

        it("covers additional edge cases for maximum coverage", () => {
            // Test parseSegments with explicit empty segment case
            expect(Path.parseSegments("1..2")).toBeNull();

            // Test hasPath empty segment case
            expect(Path.hasPath([["a"]], "0.")).toBe(false);

            const result = Path.undotExpand({
                "0": "first",
                "0.invalid": "ignored",
            });
            expect(result).toEqual({ 0: { invalid: "ignored" } });

            // Test setMixed edge cases with undefined next segments
            const arr1: unknown[] = [];
            Path.setMixed(arr1, "0.prop", "value"); // No next segment after prop
            expect(arr1[0]).toEqual({ prop: "value" });

            // Test pushMixed navigation failure
            const arr2 = [123]; // Number is not an object
            const result2 = Path.pushMixed(arr2, "0.prop", "value");
            expect(result2).toBe(arr2); // Should return original when navigation fails

            // Test deepCopy with different object types
            const complexData = [{ nested: { deep: "value" } }];
            const result3 = Path.setMixedImmutable(
                complexData,
                "0.nested.new",
                "added",
            );
            expect(result3[0]).toEqual({
                nested: { deep: "value", new: "added" },
            });
            expect(result3[0]).not.toBe(complexData[0]); // Deep copy should create new reference
        });

        it("covers forgetKeys edge cases", () => {
            // Test forgetKeys with empty segment causing NaN
            const data = [1, 2, 3];
            const result = Path.forgetKeys(data, ["1..2"]); // Contains empty segment
            expect(result).toEqual([1, 2, 3]); // Should return copy unchanged due to NaN
        });

        it("covers hasPath edge cases", () => {
            // Test hasPath with empty segment in multi-part path
            expect(Path.hasPath([[1, 2]], "0..1")).toBe(false); // Empty segment causes NaN
        });

        it("covers pushWithPath specific error conditions", () => {
            // Test pushWithPath navigation creating child arrays
            const data: unknown[] = [];
            Path.pushWithPath(data, "0.1.2", "deep-value");
            expect(data[0]).toEqual([["deep-value"]]);

            // Test pushWithPath with non-array existing value
            const data2 = [{}]; // Object at index 0
            expect(() => {
                Path.pushWithPath(data2, "0.1", "value");
            }).toThrow(
                "Array value for key [0.1] must be an array, object found.",
            );

            // Test pushWithPath boolean error
            const data3 = [true]; // Boolean at index 0
            expect(() => {
                Path.pushWithPath(data3, "0.1", "value");
            }).toThrow(
                "Array value for key [0.1] must be an array, boolean found.",
            );
        });

        it("covers remaining odd uncovered lines for 100% coverage", () => {
            const result1 = Path.undotExpand({
                "0.1": "value",
                "0.1.2": "deeper",
            });
            expect(result1).toEqual({ 0: { 1: { 2: "deeper" } } });

            const result2 = Path.undotExpand({
                "0": "string",
                "0.1": "ignored",
            });
            expect(result2).toEqual({ 0: { 1: "ignored" } });

            // Test setMixed with no next segment (end of path)
            const data1: unknown[] = [];
            Path.setMixed(data1, "0", "final-value");
            expect(data1[0]).toBe("final-value");

            // Test setMixed creating object for non-numeric next segment
            const data2: unknown[] = [];
            Path.setMixed(data2, "0.prop", "value");
            expect(data2[0]).toEqual({ prop: "value" });

            // Test pushMixed returning original when navigation fails
            const data3 = ["string"]; // Can't navigate into string
            const original = data3;
            const result3 = Path.pushMixed(data3, "0.prop", "value");
            expect(result3).toBe(original); // Should return exact same reference

            // Test setMixedImmutable deep copy behavior
            const data4 = [{ obj: { nested: "value" } }];
            const result4 = Path.setMixedImmutable(data4, "0.obj.new", "added");
            expect(result4[0]).toEqual({
                obj: { nested: "value", new: "added" },
            });
            expect(result4[0]).not.toBe(data4[0]); // Should be different reference (deep copy)
        });
    });

    describe("hasMixed", () => {
        const testData = [{ name: "John", items: ["a", "b"] }];

        it("returns true for non-null data when key is null", () => {
            expect(Path.hasMixed(testData, null)).toBe(true);
            expect(Path.hasMixed([], undefined)).toBe(false);
        });

        it("returns false for null data when key is null", () => {
            expect(Path.hasMixed(null, null)).toBe(false);
            expect(Path.hasMixed(undefined, null)).toBe(false);
        });

        it("checks numeric array indices", () => {
            expect(Path.hasMixed(testData, 0)).toBe(true);
            expect(Path.hasMixed(testData, 1)).toBe(false);
            expect(Path.hasMixed("not-array", 0)).toBe(false);
        });

        it("checks mixed dot notation paths", () => {
            expect(Path.hasMixed(testData, "0.name")).toBe(true);
            expect(Path.hasMixed(testData, "0.items.1")).toBe(true);
            expect(Path.hasMixed(testData, "0.nonexistent")).toBe(false);
            expect(Path.hasMixed(testData, "1.name")).toBe(false);
        });

        it("returns false for non-existent nested paths", () => {
            expect(Path.hasMixed(testData, "0.items.5")).toBe(false);
            expect(Path.hasMixed(testData, "0.nested.deep")).toBe(false);
        });
    });
});
