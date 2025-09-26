export type ConditionableValue =
    | string
    | number
    | boolean
    | ((instance: Stringable) => string | number | boolean);
export type ConditionableClosure =
    | ((instance: Stringable, value: ConditionableValue) => unknown)
    | null;
