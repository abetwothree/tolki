import { defineEnum } from "./enums";

export const SortDirection = /* @__PURE__ */ defineEnum({
    Ascending: "Ascending",
    Descending: "Descending",
    backed: false,
    _cases: ["Ascending", "Descending"],
} as const);
