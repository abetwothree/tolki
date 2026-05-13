import { defineEnum } from "./enums";

export const SortDirection = defineEnum({
    Ascending: "Ascending",
    Descending: "Descending",
    backed: false,
    _cases: ["Ascending", "Descending"],
} as const);
