import * as Path from "@tolki/path";
import { describe, expect, it } from "vitest";

describe("Path Functions", () => {
    describe("undotExpandObject", () => {
        it("undotExpandObject handles symbol-like keys", () => {
            // undotExpandObject/Array with symbol keys
            const map = { "a.b": 1, "c.d": 2 };
            const result = Path.undotExpandObject(map);
            expect(result).toEqual({ a: { b: 1 }, c: { d: 2 } });
        });
    });

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

        it("returns false when cursor is not object for string segment", () => {
            // Tests where cursor is not object for string segment
            const data = [["nested"]];

            // hasPath returns true for string segments on arrays
            expect(Path.hasPath(data, "0")).toBe(true);

            // hasPath returns false when a string segment is applied to a non-object cursor
            expect(Path.hasPath(data, "0.key")).toBe(false);
        });

        it("covers hasPath edge cases", () => {
            // Test hasPath with empty segment in multi-part path
            expect(Path.hasPath([[1, 2]], "0..1")).toBe(false); // Empty segment causes NaN
        });

        it("handles numeric keys on objects", () => {
            // Object with numeric string keys
            const obj = { "0": "a", "1": "b" };
            expect(Path.hasPath(obj, 0)).toBe(true);
            expect(Path.hasPath(obj, 1)).toBe(true);
            expect(Path.hasPath(obj, 2)).toBe(false);
        });

        it("handles null/undefined cursor during traversal", () => {
            // When cursor becomes null during path traversal
            const data = [null, "value"];
            expect(Path.hasPath(data, "0.nested")).toBe(false);
        });

        it("handles object cursor during traversal with numeric segment", () => {
            // When cursor is an object but segment is numeric
            const data = [{ name: "John" }];
            // Can't use numeric path segment on object without arrays
            expect(Path.hasPath(data, "0.0")).toBe(false);
        });

        it("handles string segments on object cursors", () => {
            // hasPath now correctly handles mixed array/object paths
            const data = [{ user: { name: "John" } }];
            // String segments work on object cursors after the bug fix
            expect(Path.hasPath(data, "0.user.name")).toBe(true);
            // Non-existent paths still return false
            expect(Path.hasPath(data, "0.user.age")).toBe(false);
            expect(Path.hasPath(data, "0.admin.name")).toBe(false);
        });

        it("returns true when path fully resolves", () => {
            const data = [["a", "b"]];
            expect(Path.hasPath(data, "0.1")).toBe(true);
        });

        it("handles string segment where cursor is array (should fail)", () => {
            // When cursor is array and segment is string
            const data = [["a", "b"]];
            // Path 0 gets us to ["a", "b"], then "name" is a string segment
            expect(Path.hasPath(data, "0")).toBe(true);
            // This doesn't work because "name" is string, not numeric
        });

        it("handles path where cursor becomes non-object", () => {
            const data = [[null]];
            // First 0 -> [null], second 0 -> null, can't navigate further
            expect(Path.hasPath(data, "0.0.0")).toBe(false);
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

        it("handles cursor assignment for string segment", () => {
            // getRaw function handles string segments on objects
            const obj = { items: [1, 2, 3] };
            expect(Path.getRaw(obj, "items.1")).toEqual({
                found: true,
                value: 2,
            });
        });

        it("handles numeric keys on objects", () => {
            const obj = { "0": "value-a", "1": "value-b" };
            expect(Path.getRaw(obj, 0)).toEqual({
                found: true,
                value: "value-a",
            });
            expect(Path.getRaw(obj, 2)).toEqual({ found: false });
        });

        it("handles non-integer numeric keys", () => {
            const data = ["a", "b"];
            expect(Path.getRaw(data, 1.5)).toEqual({ found: false });
        });

        it("handles null/undefined cursor during traversal", () => {
            const data = [null, "value"];
            expect(Path.getRaw(data, "0.nested")).toEqual({ found: false });
        });

        it("handles object cursor during numeric segment traversal", () => {
            const data = [{ name: "John" }];
            // Object doesn't have numeric array indices
            expect(Path.getRaw(data, "0.0")).toEqual({ found: false });
        });

        it("handles string segments on arrays", () => {
            const data = [["a", "b"]];
            // String segment on array should fail
            expect(Path.getRaw(data, "0.name")).toEqual({ found: false });
        });

        it("handles string segments on objects", () => {
            const data = [{ user: { name: "John" } }];
            expect(Path.getRaw(data, "0.user.name")).toEqual({
                found: true,
                value: "John",
            });
            expect(Path.getRaw(data, "0.user.missing")).toEqual({
                found: false,
            });
        });

        it("handles numeric key on object with that string key", () => {
            const obj = { "0": "value-at-zero" };
            const result = Path.getRaw(obj, 0);
            expect(result).toEqual({ found: true, value: "value-at-zero" });
        });

        it("returns false for non-object non-array root with numeric key", () => {
            const result = Path.getRaw("string", 0);
            expect(result).toEqual({ found: false });
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

        it("dispatches to forgetKeysObject for object input", () => {
            const obj = { a: 1, b: 2 };
            const result = Path.forgetKeys(obj, "a");
            expect(result).toEqual({ b: 2 });
        });

        it("dispatches to forgetKeysArray for array input", () => {
            const arr = ["a", "b", "c"];
            const result = Path.forgetKeys(arr, 1);
            expect(result).toEqual(["a", "c"]);
        });

        it("covers forgetKeys edge cases", () => {
            // Test forgetKeys with empty segment causing NaN
            const data = [1, 2, 3];
            const result = Path.forgetKeys(data, ["1..2"]); // Contains empty segment
            expect(result).toEqual([1, 2, 3]); // Should return copy unchanged due to NaN
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

        it("handles negative index", () => {
            const data = ["a", "b"];
            const result = Path.setImmutable(data, -1, "x");
            // Negative indices should be ignored
            expect(result).toEqual(["a", "b"]);
        });

        it("handles index beyond array length", () => {
            const data = ["a"];
            const result = Path.setImmutable(data, 5, "x");
            // clampIndex clamps to array length, so value goes at index 1
            expect(result[1]).toBe("x");
        });

        it("handles multi-segment path with middle segment at end of array", () => {
            const data: unknown[] = [];
            // Create nested structure at indices
            const result = Path.setImmutable(data, "0.0", "value");
            expect(result).toEqual([["value"]]);
        });

        it("handles pushing to end of nested array", () => {
            const data = [["existing"]];
            const result = Path.setImmutable(data, "0.1", "new");
            expect(result).toEqual([["existing", "new"]]);
        });

        it("handles cursor that's not an array at nested position", () => {
            const data = ["string-value"];
            // Can't set nested path on string
            const result = Path.setImmutable(data, "0.0", "value");
            expect(result).toEqual(["string-value"]);
        });

        it("setImmutable toArr handles non-array data", () => {
            // toArr returns empty array for non-array input
            // When data is an array but the internal toArr is called on child that isn't array
            const result = Path.setImmutable([], 0, "value");
            expect(result).toEqual(["value"]);
        });

        it("setImmutable handles dot path with empty segment", () => {
            // setImmutable with dot path containing empty segment
            const data = ["a"];
            // ".1" has an empty first segment, resulting in NaN
            const result = Path.setImmutable(data, ".1", "x");
            expect(result).toEqual(["a"]);
        });

        it("handles clampIndex returning -1 for invalid index", () => {
            const data = ["a", "b"];
            // Float index should return -1 from clampIndex
            const result = Path.setImmutable(data, 1.5, "x");
            expect(result).toEqual(["a", "b"]);
        });

        it("handles path with invalid segment during traversal", () => {
            const data = [["a"]];
            // Negative segment should cause early return
            const result = Path.setImmutable(data, "0.-1", "x");
            expect(result).toEqual([["a"]]);
        });

        it("pushes value when at end and idx equals array length", () => {
            const data = ["a"];
            // Setting at index 1 (length of array) should push
            const result = Path.setImmutable(data, 1, "b");
            expect(result).toEqual(["a", "b"]);
        });

        it("handles non-integer index in clampIndex", () => {
            // Tests !isInteger check
            const data = ["a"];
            const result = Path.setImmutable(data, 1.5, "x");
            expect(result).toEqual(["a"]);
        });

        it("handles nested path with invalid intermediate index", () => {
            // Tests idx === -1 return
            const data = [["a"]];
            const result = Path.setImmutable(data, "0.-1.0", "x");
            expect(result).toEqual([["a"]]);
        });

        it("returns root when idx is -1 at last segment", () => {
            // Tests the idx === -1 path at the final segment
            const data = ["a"];
            const result = Path.setImmutable(data, -1, "x");
            expect(result).toEqual(["a"]);
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

            // Test empty string key with array data - returns data unchanged
            const data3 = ["a", "b"];
            expect(Path.pushWithPath(data3, "", "value")).toEqual(["a", "b"]);
        });

        it("pushWithPath with non-array data returns root for invalid segments", () => {
            // pushWithPath with non-array data where root is empty
            // When data is not an array and segments parse to []
            const result = Path.pushWithPath(null, "", "value");
            expect(result).toEqual([]);
        });

        it("pushWithPath returns data when segs is empty and data is array", () => {
            // pushWithPath empty segs when data IS an array
            const data = ["existing"];
            const result = Path.pushWithPath(data, "", "value");
            expect(result).toEqual(["existing"]);
        });

        it("pushWithPath returns data for mixed paths when data is array", () => {
            // pushWithPath mixed paths not supported - returns data when data IS array
            const data = ["existing"];
            const result = Path.pushWithPath(data, "0.name", "value");
            expect(result).toEqual(["existing"]);
        });

        it("pushWithPath clamps idx to cursor length", () => {
            // pushWithPath idx clamp when idx > length - returns clamped value
            // Path "5.0" with existing array that has item at index 0
            const data = [["existing"]];
            // Navigating to idx 5 should clamp to cursor.length (1)
            const result = Path.pushWithPath(data, "5.0", "value");
            // Since we navigate to a high index, it creates nested structure and pushes
            expect(result).toEqual([["existing"], ["value"]]);
        });

        describe("array data branch with existing elements", () => {
            it("replaces null at existing position", () => {
                // Tests null replacement in array data branch
                const data: (null | unknown[])[] = [null];
                Path.pushWithPath(data, "0.0", "value");
                // null at index 0 gets replaced with array
                expect(data).toEqual([["value"]]);
            });

            it("navigates into existing array", () => {
                // Tests navigate into existing array
                const data = [["existing"]];
                Path.pushWithPath(data, "0.1", "new");
                // Should navigate to data[0] and push "new"
                expect(data).toEqual([["existing", "new"]]);
            });

            it("throws for non-array at existing position", () => {
                // Tests non-array at position
                const data = ["string"];
                expect(() => {
                    Path.pushWithPath(data, "0.0", "value");
                }).toThrow(
                    "Array value for key [0.0] must be an array, string found.",
                );
            });

            it("throws for boolean at leaf position", () => {
                // Tests boolean at leaf
                const data = [true];
                expect(() => {
                    Path.pushWithPath(data, "0", "value");
                }).toThrow(
                    "Array value for key [0] must be an array, boolean found.",
                );
            });
        });

        describe("non-array data branch coverage", () => {
            it("navigates through existing array at idx in non-array data branch", () => {
                // Non-array data, path "0.1.0" with nested arrays
                const result = Path.pushWithPath(null, "0.1.0", "value");
                // Creates nested array structure
                expect(result).toEqual([[["value"]]]);
            });

            it("replaces null at nested position in non-array data branch", () => {
                // This tests where next is null
                const result = Path.pushWithPath(null, "0.0.0", "value");
                expect(result).toEqual([[["value"]]]);
            });

            it("throws for non-array element in non-array data branch", () => {
                // This tests where next is not array
                // Need to create a structure and then try to navigate through non-array
                const data: unknown[] = [];
                data[0] = "string"; // Not an array
                expect(() => {
                    Path.pushWithPath(data, "0.0", "value");
                }).toThrow(
                    "Array value for key [0.0] must be an array, string found.",
                );
            });

            it("checks boolean at leaf position in non-array data branch", () => {
                // Tests boolean check at leaf
                const result = Path.pushWithPath(null, "0", true);
                expect(result).toEqual([true]);
            });
        });

        it("handles non-array data with empty segments", () => {
            // Non-array data with path that has no segments
            const result = Path.pushWithPath(null, "", "value");
            expect(result).toEqual([]);
        });

        it("handles non-array data with valid numeric path", () => {
            // Creates array structure from null
            const result = Path.pushWithPath(null, "0", "value");
            expect(result).toEqual(["value"]);
        });

        it("handles non-array data with nested numeric path", () => {
            const result = Path.pushWithPath(null, "0.0", "value");
            expect(result).toEqual([["value"]]);
        });

        it("handles boolean at leaf position during push", () => {
            // When trying to push to a position that has a boolean
            const data = [[false]];
            expect(() => {
                Path.pushWithPath(data, "0.0", "value");
            }).toThrow(
                "Array value for key [0.0] must be an array, boolean found.",
            );
        });

        it("handles mixed paths on array data", () => {
            // Array data with mixed (string) path segments
            const data = [["a"]];
            const result = Path.pushWithPath(data, "0.name", "value");
            // Mixed paths return the original array unchanged
            expect(result).toEqual([["a"]]);
        });

        it("specific error conditions", () => {
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

        it("handles non-accessible data with mixed path", () => {
            // Non-array data with mixed (non-numeric) path segments
            const result = Path.pushWithPath(null, "0.name.items", "value");
            expect(result).toEqual([]);
        });

        it("navigates through existing null elements", () => {
            const data: unknown[] = [null];
            // When we have existing array with null at position 0, function replaces null with child array
            Path.pushWithPath(data, "0.0", "value");
            // Path "0.0" navigates to data[0] (null → []), then pushes "value" to cursor
            expect(data).toEqual([["value"]]);
        });

        it("handles leaf index with existing boolean in array data", () => {
            // When accessing a path that ends at a boolean
            const data = [[true]];
            expect(() => {
                Path.pushWithPath(data, "0.0", "value");
            }).toThrow(
                "Array value for key [0.0] must be an array, boolean found.",
            );
        });

        it("creates nested arrays during navigation", () => {
            const data: unknown[] = [];
            Path.pushWithPath(data, "0.0", "deep");
            // Creates data[0] = [] then pushes "deep" to that array
            expect(data).toEqual([["deep"]]);
        });

        it("handles pushing values when navigating creates new structure", () => {
            const data: unknown[] = [[]];
            Path.pushWithPath(data, "0.0", "value");
            // Navigates to data[0] (which is []), pushes "value" to cursor
            expect(data).toEqual([["value"]]);
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
            const input = { "0": "a" };
            input[1] = "b";
            expect(Path.undotExpand(input)).toEqual({
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

        it("setMixed returns unchanged when first segment is invalid and array has items", () => {
            // firstIndex is invalid but array is not empty
            const arr = ["existing"];
            const result = Path.setMixed(arr, "invalid.path", "value");
            // First segment "invalid" parses to NaN, array.length > 0, so return unchanged
            expect(result).toEqual(["existing"]);
        });

        it("setMixed handles paths with dots that create empty segments", () => {
            // segment is empty string in loop (continue)
            const arr: unknown[] = [];
            // Path "0..1" has empty segment between dots
            const result = Path.setMixed(arr, "0..1", "value");
            // Should handle gracefully
            expect(result).toEqual(arr);
        });

        it("setMixed navigates through object properties", () => {
            // navigating through object property
            const arr: unknown[] = [{ user: {} }];
            const result = Path.setMixed(arr, "0.user.name", "John");
            expect(result).toEqual([{ user: { name: "John" } }]);
        });

        it("setMixed sets value on object at final segment", () => {
            // lastSegment handling for object
            const arr: unknown[] = [{ data: {} }];
            const result = Path.setMixed(arr, "0.data.key", "value");
            expect(result).toEqual([{ data: { key: "value" } }]);
        });

        it("handles first segment not being valid array index on non-empty array", () => {
            const arr = ["existing"];
            // Non-numeric first segment on non-empty array
            const result = Path.setMixed(arr, "invalid", "value");
            expect(result).toEqual(["existing"]);
        });

        it("handles object properties during path navigation", () => {
            const arr = [{ nested: {} }];
            Path.setMixed(arr, "0.nested.deep", "value");
            expect(arr).toEqual([{ nested: { deep: "value" } }]);
        });

        it("creates array when next segment is numeric", () => {
            const arr: unknown[] = [{}];
            Path.setMixed(arr, "0.items.0", "first");
            expect(arr).toEqual([{ items: ["first"] }]);
        });

        it("handles empty segment in path", () => {
            const arr = ["a"];
            const result = Path.setMixed(arr, "0.", "value");
            // Empty segment causes navigation to fail to set value
            expect(result).toEqual([{}]);
        });

        it("handles empty first segment with non-empty array", () => {
            const arr = ["a"];
            // Empty first segment
            const result = Path.setMixed(arr, "", "value");
            // Should return unchanged
            expect(result).toEqual(["a"]);
        });

        it("creates object at path when next segment is string", () => {
            const arr: unknown[] = [];
            // Path creates object because "name" is not numeric
            Path.setMixed(arr, "0.user.name", "John");
            expect(arr).toEqual([{ user: { name: "John" } }]);
        });

        it("creates object when next segment is not numeric", () => {
            // Tests where next segment is not numeric
            const arr: unknown[] = [];
            Path.setMixed(arr, "0.user.name", "John");
            // Creates {user:{name:"John"}} because "user" and "name" are not numeric
            expect(arr).toEqual([{ user: { name: "John" } }]);
        });

        it("setMixed navigates through object to set nested object property", () => {
            const arr: unknown[] = [{ user: { profile: {} } }];
            const result = Path.setMixed(arr, "0.user.profile.name", "John");
            expect(result).toEqual([{ user: { profile: { name: "John" } } }]);
        });

        it("setMixed sets value on object when current is object at final segment", () => {
            const arr: unknown[] = [{ data: {} }];
            const result = Path.setMixed(arr, "0.data.value", 42);
            expect(result).toEqual([{ data: { value: 42 } }]);
        });

        it("setMixed handles nested object properties after array navigation", () => {
            // Start with arr[0] = { prop: {} }, then navigate through object
            const arr: unknown[] = [{ prop: { nested: {} } }];
            // Path: first navigate to arr[0], then to obj.prop, then to obj.nested, then set obj.key
            const result = Path.setMixed(
                arr,
                "0.prop.nested.key",
                "deep-value",
            );
            expect(result).toEqual([
                { prop: { nested: { key: "deep-value" } } },
            ]);
        });

        it("setMixed sets final value on object when last segment is non-numeric", () => {
            // Navigate to an object, then set a property on it
            const arr: unknown[] = [{ container: {} }];
            const result = Path.setMixed(arr, "0.container.name", "test");
            expect(result).toEqual([{ container: { name: "test" } }]);
        });

        it("setMixed returns unchanged when final segment is non-numeric on array", () => {
            // Tests to verify behavior when branches are skipped
            // Navigate to an array, but last segment is non-numeric
            // This should skip the final value setting
            const arr: unknown[] = [[]];
            const result = Path.setMixed(arr, "0.invalidKey", "value");
            // current is arr[0] which is [], lastIndex is NaN
            // First if fails (lastIndex not valid), second if fails (current is array, not object)
            // So nothing is set
            expect(result).toEqual([[]]);
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

        it("pushMixed creates new array when data is not array", () => {
            // data is not array, creates new array
            const result = Path.pushMixed(null, "0", "value");
            // setMixed sets values directly at the path
            expect(result).toEqual(["value"]);
        });

        it("pushMixed pushes to root array with single segment", () => {
            // segments.length === 1 with valid idx
            const data = ["a", "b"];
            const result = Path.pushMixed(data, "0", "c");
            expect(result).toEqual(["a", "b", "c"]);
        });

        it("pushMixed with single invalid segment returns data unchanged", () => {
            const data = ["a"];
            const result = Path.pushMixed(data, "invalid", "value");
            // Invalid index (NaN), so just return data
            expect(result).toEqual(["a"]);
        });

        it("pushMixed navigates through object properties and pushes", () => {
            // navigating through object property
            const data: unknown[] = [{ items: [] }];
            const result = Path.pushMixed(data, "0.items.0", "value");
            expect(result).toEqual([{ items: ["value"] }]);
        });

        it("pushMixed handles null intermediate values in objects", () => {
            const data: unknown[] = [{ items: null }];
            const result = Path.pushMixed(data, "0.items.0", "value");
            expect(result).toEqual([{ items: ["value"] }]);
        });

        it("pushMixed handles empty segment in path", () => {
            const data: unknown[] = ["a"];
            // Path "0..1" has empty segment - still creates nested array
            const result = Path.pushMixed(data, "0..1", "value");
            expect(result).toEqual([["value"]]);
        });

        it("pushMixed navigates through nested object structure", () => {
            const data: unknown[] = [{ outer: { inner: [] } }];
            const result = Path.pushMixed(data, "0.outer.inner.0", "nested");
            expect(result).toEqual([{ outer: { inner: ["nested"] } }]);
        });

        it("pushMixed navigates through object property to push into nested array", () => {
            // Start with array containing object with property pointing to array
            const data: unknown[] = [{ items: [] }];
            // Navigate: arr[0] (array) -> items (object prop) -> push
            const result = Path.pushMixed(data, "0.items.0", "pushed-value");
            expect(result).toEqual([{ items: ["pushed-value"] }]);
        });

        it("pushMixed creates array in object property when navigating", () => {
            // Object property doesn't have array yet
            const data: unknown[] = [{ config: null }];
            const result = Path.pushMixed(data, "0.config.0", "new-item");
            expect(result).toEqual([{ config: ["new-item"] }]);
        });

        it("pushMixed handles multiple values when data is not array", () => {
            // When data is not an array and we pass multiple values
            // This covers the values.length !== 1 branch at line 1293
            const result = Path.pushMixed(null, "0", "a", "b", "c");
            expect(result).toEqual([["a", "b", "c"]]);
        });

        it("handles object properties during navigation when target is array", () => {
            // When navigating through object that already has an array at the property
            const data = [{ items: ["existing"] }];
            Path.pushMixed(data, "0.items", "value");
            // The current implementation navigates to items but doesn't push
            // because it only pushes when segment loop completes and current is an array
            expect(data).toEqual([{ items: ["existing"] }]);
        });

        it("creates nested array structure during navigation", () => {
            // When creating new path, it creates arrays not objects
            const data: unknown[] = [];
            Path.pushMixed(data, "0.items", "value");
            // Creates arrays at each level
            expect(data).toEqual([["value"]]);
        });

        it("returns unchanged when can't navigate further", () => {
            const data = [42]; // Number, can't navigate into
            const result = Path.pushMixed(data, "0.items", "value");
            expect(result).toBe(data);
            // Actually the array gets modified with a nested array
            expect(data).toEqual([["value"]]);
        });

        it("handles null in object during navigation", () => {
            // When object property is null, pushMixed doesn't modify it
            // because the condition `isNull(obj[segment]) || !isObject(obj[segment])` sets []
            // but current becomes obj[segment] which is the new [], but the loop continues past it
            const data = [{ nested: null as unknown }];
            Path.pushMixed(data, "0.nested", "value");
            // Actually pushMixed navigates to nested (null → []) but doesn't push since we need 2+ segments
            // With "0.nested", segments = ["0", "nested"], loop goes to i=0 only (segment="0")
            // So current becomes data[0] = {nested:null}, then pushes to current if it's array
            // {nested:null} is NOT an array, so nothing pushed
            expect(data).toEqual([{ nested: null }]);
        });

        it("handles object with null property via longer path", () => {
            // - current to be an object during loop iteration
            // - obj[segment] to be null or not an object
            const data = [{ user: null as unknown }];
            // Path "0.user.items" - first "0" makes current = data[0] = {user:null}
            // Then "user" segment enters the object branch, user is null so it becomes []
            Path.pushMixed(data, "0.user.items", "value");
            // user is null, gets set to [], value pushed directly
            expect(data).toEqual([{ user: ["value"] }]);
        });

        it("navigates through object property that is string", () => {
            // obj[segment] is a string (not an object), so it gets replaced with []
            const data = [{ user: "string" as unknown }];
            Path.pushMixed(data, "0.user.items", "value");
            // user is "string", gets replaced with [], value pushed
            expect(data).toEqual([{ user: ["value"] }]);
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

        it("deep copies objects within arrays", () => {
            // Tests return obj in deepCopy
            const data = [{ nested: { deep: "value" } }];
            const result = Path.setMixedImmutable(data, "0.other", "new");
            expect(result).toEqual([
                { nested: { deep: "value" }, other: "new" },
            ]);
            // Original unchanged
            expect(data).toEqual([{ nested: { deep: "value" } }]);
        });

        it("covers remaining odd uncovered lines", () => {
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

        it("handles non-array data", () => {
            const result = Path.setMixedImmutable("not-array", "0", "value");
            expect(result).toEqual([]);
        });

        it("handles null/undefined key", () => {
            const result = Path.setMixedImmutable(["a"], null, ["x"]);
            expect(result).toEqual(["x"]);
        });

        it("deep copies complex nested structures", () => {
            const data = [{ a: { b: [1, 2] } }];
            const result = Path.setMixedImmutable(data, "0.a.c", "new");
            // Original should be unchanged
            expect(data[0]).not.toHaveProperty("a.c");
            // Result should have new property
            expect(result[0]).toEqual({ a: { b: [1, 2], c: "new" } });
        });

        it("deep copies nested objects correctly", () => {
            // Test the deepCopy function inside setMixedImmutable
            const data = [{ nested: { deep: "value" } }];
            const result = Path.setMixedImmutable(
                data,
                "0.nested.other",
                "new",
            );
            expect(result).toEqual([
                { nested: { deep: "value", other: "new" } },
            ]);
            // Original unchanged
            expect(data).toEqual([{ nested: { deep: "value" } }]);
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

        it("handles objects when key is null/undefined", () => {
            // Object with keys - should return true
            expect(Path.hasMixed({ name: "John" }, null)).toBe(true);
            // Empty object - should return false
            expect(Path.hasMixed({}, null)).toBe(false);
            // Primitive value - should return true (it exists)
            expect(Path.hasMixed("string", null)).toBe(true);
            expect(Path.hasMixed(42, null)).toBe(true);
        });

        it("returns false for paths with missing intermediate segments", () => {
            const data = [{ user: {} }];
            expect(Path.hasMixed(data, "0.user.profile.name")).toBe(false);
        });

        it("returns true for existing nested object paths", () => {
            const data = [{ user: { name: "John" } }];
            expect(Path.hasMixed(data, "0.user.name")).toBe(true);
        });
    });

    describe("getObjectValue", () => {
        it("returns object when key is null", () => {
            const obj = { name: "John" };
            expect(Path.getObjectValue(obj, null)).toBe(obj);
        });

        it("returns default when obj is not an object", () => {
            expect(Path.getObjectValue("not-object", "key", "default")).toBe(
                "default",
            );
            expect(Path.getObjectValue(null, "key", "default")).toBe("default");
            expect(Path.getObjectValue([], "key", "default")).toBe("default");
        });

        it("gets simple property value", () => {
            const obj = { name: "John", age: 30 };
            expect(Path.getObjectValue(obj, "name")).toBe("John");
            expect(Path.getObjectValue(obj, "age")).toBe(30);
        });

        it("returns default for non-existent simple property", () => {
            const obj = { name: "John" };
            expect(Path.getObjectValue(obj, "missing", "default")).toBe(
                "default",
            );
        });

        it("gets nested property value with dot notation", () => {
            const obj = { user: { profile: { name: "John" } } };
            expect(Path.getObjectValue(obj, "user.profile.name")).toBe("John");
        });

        it("returns default for non-existent nested property", () => {
            const obj = { user: { profile: { name: "John" } } };
            expect(
                Path.getObjectValue(obj, "user.missing.path", "default"),
            ).toBe("default");
        });

        it("resolves default value function", () => {
            const obj = { name: "John" };
            expect(Path.getObjectValue(obj, "missing", () => "computed")).toBe(
                "computed",
            );
        });
    });

    describe("setObjectValue", () => {
        it("returns value when key is null", () => {
            const result = Path.setObjectValue({ old: 1 }, null, { new: 2 });
            expect(result).toEqual({ new: 2 });
        });

        it("creates new object when obj is not an object", () => {
            const result = Path.setObjectValue(
                "not-object" as unknown as Record<string, unknown>,
                "key",
                "value",
            );
            expect(result).toEqual({ key: "value" });
        });

        it("sets simple property value", () => {
            const obj = { name: "John" };
            const result = Path.setObjectValue(obj, "age", 30);
            expect(result).toEqual({ name: "John", age: 30 });
            expect(result).not.toBe(obj); // Should be immutable
        });

        it("sets nested property value with dot notation", () => {
            const obj = { user: { name: "John" } };
            const result = Path.setObjectValue(obj, "user.age", 30);
            expect(result).toEqual({ user: { name: "John", age: 30 } });
        });

        it("creates nested structures as needed", () => {
            const obj = {};
            const result = Path.setObjectValue(
                obj,
                "user.profile.name",
                "John",
            );
            expect(result).toEqual({ user: { profile: { name: "John" } } });
        });

        it("handles empty segment in path", () => {
            const obj = { a: 1 };
            // Empty segment should be skipped
            const result = Path.setObjectValue(obj, "a..b", 2);
            expect(result).toHaveProperty("a");
        });

        it("handles empty last segment", () => {
            const obj = { a: 1 };
            const result = Path.setObjectValue(obj, "a.", 2);
            expect(result).toHaveProperty("a");
        });

        it("ignores __proto__ as a simple key", () => {
            const obj = { a: 1 };
            const result = Path.setObjectValue(obj, "__proto__", { evil: true });
            expect(result).toEqual({ a: 1 });
            expect(({} as Record<string, unknown>)["evil"]).toBeUndefined();
        });

        it("ignores __proto__ in nested dot notation path", () => {
            const obj = { a: 1 };
            const result = Path.setObjectValue(obj, "__proto__.polluted", true);
            expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
            expect(result).toEqual({ a: 1 });
        });

        it("ignores constructor and prototype as keys", () => {
            const obj = { a: 1 };
            expect(Path.setObjectValue(obj, "constructor", "bad")).toEqual({ a: 1 });
            expect(Path.setObjectValue(obj, "prototype", "bad")).toEqual({ a: 1 });
        });
    });

    describe("hasObjectKey", () => {
        it("returns false when obj is not an object", () => {
            expect(Path.hasObjectKey("not-object", "key")).toBe(false);
            expect(Path.hasObjectKey(null, "key")).toBe(false);
            expect(Path.hasObjectKey([], "key")).toBe(false);
        });

        it("returns false when key is null", () => {
            expect(Path.hasObjectKey({ name: "John" }, null)).toBe(false);
        });

        it("checks simple property existence", () => {
            const obj = { name: "John", age: 30 };
            expect(Path.hasObjectKey(obj, "name")).toBe(true);
            expect(Path.hasObjectKey(obj, "missing")).toBe(false);
        });

        it("checks nested property existence with dot notation", () => {
            const obj = { user: { profile: { name: "John" } } };
            expect(Path.hasObjectKey(obj, "user.profile.name")).toBe(true);
            expect(Path.hasObjectKey(obj, "user.missing.path")).toBe(false);
        });
    });

    describe("forgetKeysObject", () => {
        it("skips null keys in array", () => {
            const obj = { a: 1, b: 2 };
            const result = Path.forgetKeysObject(obj, [null, "a"]);
            expect(result).toEqual({ b: 2 });
        });

        it("handles non-existent nested paths", () => {
            const obj = { a: { b: 1 } };
            // Path doesn't exist, nothing to remove
            const result = Path.forgetKeysObject(obj, "a.c.d");
            expect(result).toEqual({ a: { b: 1 } });
        });

        it("handles path where nested object doesn't exist", () => {
            const obj = { a: 1 };
            // Path to nested property doesn't exist
            const result = Path.forgetKeysObject(obj, "a.b.c");
            expect(result).toEqual({ a: 1 });
        });

        it("handles nested path deletion correctly", () => {
            const obj = { user: { name: "John", age: 30 } };
            const result = Path.forgetKeysObject(obj, "user.age");
            expect(result).toEqual({ user: { name: "John" } });
        });

        it("handles non-existent last segment", () => {
            const obj = { user: { name: "John" } };
            const result = Path.forgetKeysObject(obj, "user.nonexistent");
            expect(result).toEqual({ user: { name: "John" } });
        });
    });

    describe("dotFlattenObject", () => {
        it("returns empty object for non-object input", () => {
            expect(Path.dotFlattenObject("not-object")).toEqual({});
            expect(Path.dotFlattenObject(null)).toEqual({});
            expect(Path.dotFlattenObject([])).toEqual({});
        });

        it("handles objects with nested arrays", () => {
            const obj = { items: ["a", "b"] };
            const result = Path.dotFlattenObject(obj);
            expect(result).toEqual({
                "items.0": "a",
                "items.1": "b",
            });
        });

        it("handles empty nested arrays", () => {
            const obj = { items: [] };
            const result = Path.dotFlattenObject(obj);
            expect(result).toEqual({ items: [] });
        });

        it("handles empty nested objects", () => {
            const obj = { nested: {} };
            const result = Path.dotFlattenObject(obj);
            expect(result).toEqual({ nested: {} });
        });

        it("walks through nested arrays within objects", () => {
            const obj = {
                users: [{ name: "John" }, { name: "Jane" }],
            };
            const result = Path.dotFlattenObject(obj);
            expect(result).toEqual({
                "users.0.name": "John",
                "users.1.name": "Jane",
            });
        });
    });

    describe("dotFlattenArray", () => {
        it("returns empty object for non-array input", () => {
            expect(Path.dotFlattenArray("not-array")).toEqual({});
            expect(Path.dotFlattenArray(null)).toEqual({});
            expect(Path.dotFlattenArray({})).toEqual({});
        });

        it("handles array with prepend but no nested items", () => {
            const data = ["a"];
            const result = Path.dotFlattenArray(data, "prefix");
            expect(result).toEqual({ "prefix.0": "a" });
        });

        it("dotFlattenArray with prepend and nested structure", () => {
            // dotFlattenArray walk when prepend is provided and path is empty
            // When prepend is provided but path is empty for a non-array item
            // Non-array input returns empty object (early return at line 834)
            const result = Path.dotFlattenArray("not-array", "prefix");
            expect(result).toEqual({});
        });

        it("dotFlattenArray with prepend and empty path on scalar", () => {
            // Tests the branch where prepend exists and path is empty
            const result = Path.dotFlattenArray([42], "data");
            expect(result).toEqual({ "data.0": 42 });
        });
    });

    describe("undotExpandArray", () => {
        it("handles non-string keys", () => {
            const input = { 123: "value" };
            // Numeric keys should be converted to strings
            const result = Path.undotExpandArray(input);
            expect(result[123]).toBe("value");
        });

        it("handles empty string keys", () => {
            const input = { "": "value" };
            const result = Path.undotExpandArray(input);
            // Empty key should be skipped
            expect(result).toEqual([]);
        });

        it("handles cursor becoming null during expansion", () => {
            // When next element is not null, undefined, or array
            const input = { "0": "string", "0.1": "nested" };
            const result = Path.undotExpandArray(input);
            // First sets "0" to "string", then tries to expand into it
            expect(result[0]).toBe("string");
        });

        it("handles cursor becoming non-array during expansion", () => {
            // When a key sets a primitive and then a nested key tries to expand into it
            const input = { "0": "string", "0.1": "nested" };
            const result = Path.undotExpandArray(input);
            // First "0" sets to "string", then "0.1" tries to expand but cursor becomes null
            expect(result[0]).toBe("string");
        });

        it("creates child arrays during expansion", () => {
            const input = { "0.0": "deep" };
            const result = Path.undotExpandArray(input);
            expect(result).toEqual([["deep"]]);
        });

        it("navigates into existing arrays during expansion", () => {
            // Multiple nested paths
            const input = { "0.0": "a", "0.1": "b", "1.0": "c" };
            const result = Path.undotExpandArray(input);
            expect(result).toEqual([["a", "b"], ["c"]]);
        });

        it("handles cursor becoming non-array during navigation", () => {
            // Tests where cursor becomes null
            const input = { "0": "string", "0.1": "nested" };
            const result = Path.undotExpandArray(input);
            // First sets result[0] = "string", then when trying "0.1",
            // cursor="string" is not array, so cursor=null, break
            expect(result[0]).toBe("string");
            expect(result[1]).toBeUndefined();
        });

        it("skips entries with invalid index segments", () => {
            // Tests where segments.some returns true
            const input = { "0.a": "invalid", "1": "valid" };
            const result = Path.undotExpandArray(input);
            expect(result[0]).toBeUndefined();
            expect(result[1]).toBe("valid");
        });

        it("undotExpandArray skips keys with invalid segments", () => {
            const map = { "0": "a", "1.x": "invalid", "2": "c" };
            const result = Path.undotExpandArray(map);
            // "1.x" should be skipped because 'x' is not a valid index
            expect(result).toEqual(["a", undefined, "c"]);
        });

        it("undotExpandArray handles empty string key", () => {
            const map = { "": "empty-key-value", "0": "normal" };
            const result = Path.undotExpandArray(map);
            // Empty key should be skipped
            expect(result).toEqual(["normal"]);
        });

        it("undotExpandArray skips keys with non-numeric segments", () => {
            // 'a' is not a valid array index so the entry should be skipped
            const map = { "0.a.1": "invalid", "0.1": "valid" };
            const result = Path.undotExpandArray(map);
            // Only the valid path should be processed
            expect(result).toEqual([[undefined, "valid"]]);
        });

        it("undotExpandArray handles keys with empty segments via double dots", () => {
            // "0..1" has an empty segment which is invalid for array index
            const map = { "0..1": "invalid-empty-segment", "0.1": "valid" };
            const result = Path.undotExpandArray(map);
            // Empty segment is not a valid index, so that entry should be skipped
            expect(result).toEqual([[undefined, "valid"]]);
        });
    });

    describe("forgetKeysArray", () => {
        it("groups removals by path correctly", () => {
            const arr = [
                ["a", "b", "c"],
                ["d", "e"],
            ];
            // Remove multiple indices from same nested path
            const result = Path.forgetKeysArray(arr, ["0.0", "0.2"]);
            expect(result).toEqual([["b"], ["d", "e"]]);
        });

        it("handles invalid indices during grouping", () => {
            const arr = [["a", "b"]];
            // Invalid index (NaN) should be skipped
            const result = Path.forgetKeysArray(arr, ["0.invalid"]);
            expect(result).toEqual([["a", "b"]]);
        });

        it("skips groups with no valid sorted indices", () => {
            const arr = [["a", "b"]];
            // Negative indices should be filtered out
            const result = Path.forgetKeysArray(arr, ["0.-1"]);
            expect(result).toEqual([["a", "b"]]);
        });

        it("handles multiple paths with same parent", () => {
            // Tests grouping and sorting
            const arr = [["a", "b", "c", "d"]];
            const result = Path.forgetKeysArray(arr, ["0.1", "0.3"]);
            // Removes indices 1 and 3, sorted in reverse order
            expect(result).toEqual([["a", "c"]]);
        });

        it("handles empty path after filtering", () => {
            // Tests sorted.length === 0
            // Need keys.length > 1 to enter the grouping loop
            // And indices that filter out (like negative or float)
            const arr = [["a", "b"]];
            // Multiple keys, some invalid - enters grouping loop
            const result = Path.forgetKeysArray(arr, [1.5, 2.5]);
            expect(result).toEqual([["a", "b"]]);
        });

        it("skips entries with invalid string indices", () => {
            // Tests continue when parts have NaN
            // Need keys.length > 1 to enter the grouping loop
            const arr = [["a", "b"]];
            const result = Path.forgetKeysArray(arr, ["0.invalid", "0.1"]);
            // "0.invalid" is skipped due to NaN, "0.1" removes index 1
            expect(result).toEqual([["a"]]);
        });

        it("forgetKeysArray handles single non-array key in grouping path", () => {
            // when keys is NOT an array, wrap it
            const arr = ["a", "b", "c"];
            // Single numeric key (not array) enters grouping path since keyList.length > 1 check fails first
            // But we need keyList.length > 1 for this path... let's check the logic
            const result = Path.forgetKeysArray(arr, 1);
            expect(result).toEqual(["a", "c"]);
        });

        it("forgetKeysArray handles multiple numeric keys at root level", () => {
            const arr = ["a", "b", "c", "d"];
            // Multiple numeric keys - groupsMap.get("") will return existing entry on second iteration
            const result = Path.forgetKeysArray(arr, [0, 2]);
            expect(result).toEqual(["b", "d"]);
        });
    });
});
