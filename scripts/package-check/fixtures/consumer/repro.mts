import { collect } from "@tolki/collection";
import { dataGet } from "@tolki/data";
import { accessible, objectifiable } from "@tolki/obj";
import { headline } from "@tolki/str";
import type { SimplePaginator } from "@tolki/types";

export const res = [
    accessible({}),
    objectifiable({}),
    headline("user_profile"),
    collect([1]),
    dataGet({ a: 1 }, "a"),
];
export type Page = SimplePaginator<string>;
