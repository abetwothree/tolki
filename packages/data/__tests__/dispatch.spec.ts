import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { collapse as arrCollapse, first as arrFirst } from "@tolki/arr";
import { collapse as objCollapse, first as objFirst } from "@tolki/obj";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
    copyKeyedData,
    dispatch,
    forwardData,
    isKeyedData,
    keepKeyedData,
    streamPositionalData,
    toKeyedData,
    toPositionalBacking,
} from "../src/dispatch.js";

describe("dispatch", () => {
    const dCollapse = dispatch(arrCollapse, objCollapse);

    it("sends a list to the array helper", () => {
        expect(dCollapse([[1, 2], [3]])).toEqual(arrCollapse([[1, 2], [3]]));
    });

    it("sends a record to the object helper", () => {
        const rec = { a: { x: 1 }, b: { y: 2 } };

        expect(dCollapse(rec)).toEqual(objCollapse(rec));
    });

    it("hands a Map to the object helper as it arrived", () => {
        const map = new Map([["a", { x: 1 }]]);
        const received: unknown[] = [];
        const dSpy = dispatch(arrCollapse, (data: unknown) => {
            received.push(data);

            return data;
        });

        dSpy(map);

        expect(received).toEqual([map]);
        expect(received[0]).toBe(map);
    });

    it("converts a Map to a record for a helper that addresses keys by path", () => {
        const map = new Map([["a", { x: 1 }]]);
        const dCollapseRecord = dispatch(
            arrCollapse,
            objCollapse,
            toPositionalBacking,
            toKeyedData,
        );

        expect(dCollapseRecord(map)).toEqual(objCollapse({ a: { x: 1 } }));
    });

    it("wraps a scalar into a list", () => {
        expect(dCollapse(5)).toEqual(arrCollapse([5]));
    });
});

describe("dispatch with a positional normalizer", () => {
    const dFirst = dispatch(arrFirst, objFirst, streamPositionalData);
    const dFirstDefault = dispatch(arrFirst, objFirst);

    it("walks a Set's elements instead of wrapping the Set", () => {
        expect(dFirst(new Set([7, 8]))).toBe(7);
    });

    it("treats missing data as nothing to walk", () => {
        expect(dFirst(undefined)).toBeNull();
    });

    it("still sends a record to the object helper", () => {
        const rec = { a: 7, b: 8 };

        expect(dFirst(rec)).toEqual(objFirst(rec));
    });

    it("wraps a scalar the default normalizer would also wrap", () => {
        expect(dFirst(7)).toBe(7);
    });

    it("normalizes a Set differently from the default, which answers first() the same", () => {
        const set = new Set([7, 8]);

        // The default materializes a Set; the streaming form hands the Set itself on, so a
        // callback-less `first` never reads an infinite generator past its first item.
        expect(streamPositionalData(set)).toBe(set);
        expect(toPositionalBacking(set)).toEqual([7, 8]);
        expect(dFirstDefault(set)).toBe(7);
    });

    it("differs from the default normalizer on missing data", () => {
        expect(dFirstDefault(undefined)).toBeUndefined();
    });
});

describe("isKeyedData", () => {
    it.each([
        ["a record", { a: 1 }, true],
        ["a Map", new Map(), true],
        ["a list", [1, 2], false],
        ["a Set", new Set([1]), false],
        ["a scalar", 5, false],
    ])("classifies %s", (_label, value, expected) => {
        expect(isKeyedData(value)).toBe(expected);
    });
});

describe("toPositionalBacking", () => {
    it("materializes a generator into its elements", () => {
        const generated = (function* () {
            yield 1;
            yield 2;
        })();

        expect(toPositionalBacking(generated)).toEqual([1, 2]);
    });

    it("hands an array back by reference, so mutators write through it", () => {
        const list = [1, 2];

        expect(toPositionalBacking(list)).toBe(list);
    });

    it.each([
        ["a string", "abc", ["abc"]],
        ["a Map", new Map([["a", 1]]), [new Map([["a", 1]])]],
        ["a scalar", 5, [5]],
        ["null", null, []],
    ])("wraps %s instead of materializing it", (_label, value, expected) => {
        expect(toPositionalBacking(value)).toEqual(expected);
    });
});

describe("toKeyedData", () => {
    it("converts a Map to a record", () => {
        expect(toKeyedData(new Map([["a", 1]]))).toEqual({ a: 1 });
    });

    it("passes a plain object through unchanged", () => {
        const rec = { a: 1 };

        expect(toKeyedData(rec)).toBe(rec);
    });
});

describe("copyKeyedData", () => {
    it("copies a Map, entries and order included, so a mutator leaves the caller's Map alone", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);
        const copy = copyKeyedData(map);

        expect(copy).not.toBe(map);
        expect(copy).toBeInstanceOf(Map);
        expect([...(copy as Map<number, string>)]).toEqual([
            [2, "c"],
            [0, "a"],
        ]);
    });

    it("hands a plain record on by reference, so a mutator writes through it", () => {
        const rec = { a: 1 };

        expect(copyKeyedData(rec)).toBe(rec);
    });
});

describe("keepKeyedData", () => {
    it("hands a Map on by reference, so its insertion order survives", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(keepKeyedData(map)).toBe(map);

        // The record toKeyedData builds cannot hold that order.
        expect(Object.keys(toKeyedData(map))).toEqual(["0", "2"]);
    });
});

describe("dispatch with a keyed normalizer", () => {
    const dFirstKeeping = dispatch(arrFirst, objFirst, streamPositionalData);
    const dFirstConverting = dispatch(
        arrFirst,
        objFirst,
        streamPositionalData,
        toKeyedData,
    );

    it("lets the object helper read the Map's own order by default", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(dFirstKeeping(map)).toBe("c");
        expect(dFirstConverting(map)).toBe("a");
    });

    it("changes nothing for a plain record, which carries its own order", () => {
        const rec = { b: 7, a: 8 };

        expect(dFirstKeeping(rec)).toBe(dFirstConverting(rec));
    });
});

describe("forwardData", () => {
    it("sends a list to the array helper and a record to the object helper", () => {
        const rec = { a: { x: 1 }, b: { y: 2 } };

        expect(
            forwardData(arrCollapse, objCollapse, [[1, 2], [3]], []),
        ).toEqual(arrCollapse([[1, 2], [3]]));
        expect(forwardData(arrCollapse, objCollapse, rec, [])).toEqual(
            objCollapse(rec),
        );
    });

    it("passes the other arguments on untouched", () => {
        const callback = (value: number): boolean => value > 1;

        expect(forwardData(arrFirst, objFirst, [1, 2, 3], [callback])).toBe(2);
        expect(
            forwardData(arrFirst, objFirst, { a: 1, b: 2 }, [callback]),
        ).toBe(2);
    });

    it("normalizes each backing with the functions it is given", () => {
        const map = new Map([
            [2, "c"],
            [0, "a"],
        ]);

        expect(forwardData(arrFirst, objFirst, map, [])).toBe("c");
        expect(
            forwardData(
                arrFirst,
                objFirst,
                map,
                [],
                streamPositionalData,
                toKeyedData,
            ),
        ).toBe("a");
        expect(
            forwardData(
                arrFirst,
                objFirst,
                undefined,
                [],
                streamPositionalData,
            ),
        ).toBeNull();
    });

    it("is what dispatch builds", () => {
        const rec = { a: 7, b: 8 };

        expect(dispatch(arrFirst, objFirst)(rec)).toBe(
            forwardData(arrFirst, objFirst, rec, []),
        );
    });
});

describe("data helper exports", () => {
    const file = ts.createSourceFile(
        "data.ts",
        readFileSync(
            path.resolve(
                fileURLToPath(import.meta.url),
                "../..",
                "src/data.ts",
            ),
            "utf-8",
        ),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const functions = new Map(
        file.statements
            .filter(ts.isFunctionDeclaration)
            .flatMap((fn) => (fn.name && fn.body ? [[fn.name.text, fn]] : [])),
    );
    const helpers = file.statements
        .filter(ts.isVariableStatement)
        .filter((statement) =>
            ts
                .getModifiers(statement)
                ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
        )
        .flatMap((statement) => [...statement.declarationList.declarations]);

    /**
     * Reads the delegate pair a helper's `Dispatched<typeof A, typeof B>` cast names.
     */
    const typedPair = (cast: ts.Expression): string[] => {
        const type = ts.isAsExpression(cast) ? cast.type : undefined;

        return type !== undefined &&
            ts.isTypeReferenceNode(type) &&
            type.typeName.getText(file) === "Dispatched"
            ? (type.typeArguments ?? []).map((arg) =>
                  ts.isTypeQueryNode(arg) ? arg.exprName.getText(file) : "?",
              )
            : [];
    };

    /**
     * Reads the delegate pair each `forwardData(A, B, …)` call in a function body names.
     */
    const forwardedPairs = (fn: ts.Node): string[][] => {
        const pairs: string[][] = [];
        const visit = (node: ts.Node): void => {
            if (
                ts.isCallExpression(node) &&
                node.expression.getText(file) === "forwardData"
            ) {
                pairs.push(
                    node.arguments.slice(0, 2).map((arg) => arg.getText(file)),
                );
            }

            ts.forEachChild(node, visit);
        };

        visit(fn);

        return pairs;
    };

    it("finds every exported helper", () => {
        expect(helpers.length).toBe(83);
    });

    // The build ships an alias of a same-file function as that function, which keeps the function's annotation.
    it("aliases a same-file function declaration in every exported const", () => {
        expect(
            helpers
                .filter((helper) => {
                    let target = helper.initializer;

                    while (target !== undefined && ts.isAsExpression(target)) {
                        target = target.expression;
                    }

                    return (
                        target?.getText(file) !==
                            `${helper.name.getText(file)}Impl` ||
                        !functions.has(target.getText(file))
                    );
                })
                .map((helper) => helper.name.getText(file)),
        ).toEqual([]);
    });

    it("names the same delegate pair in each helper's type and its forwardData call", () => {
        expect(
            helpers.flatMap((helper) => {
                const name = helper.name.getText(file);
                const typed = typedPair(helper.initializer!);
                const forwarded = forwardedPairs(functions.get(`${name}Impl`)!);

                return forwarded.length === 1 &&
                    typed.length === 2 &&
                    typed.join() === forwarded[0]!.join()
                    ? []
                    : [
                          `${name}: Dispatched<${typed.join()}> vs forwardData(${forwarded.join(" | ")})`,
                      ];
            }),
        ).toEqual([]);
    });
});
