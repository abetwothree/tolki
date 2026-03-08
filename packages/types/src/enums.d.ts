/**
 * Extract the case key names from the _cases tuple.
 */
export type CaseKeys<TEnum extends EnumConst> = TEnum["_cases"][number];

/**
 * Extracts the instance method key names from the `_methods` tuple.
 */
export type MethodKeys<TEnum extends EnumConst> = TEnum["_methods"][number];

/**
 * Extracts the static helper key names from the `_static` tuple.
 */
export type StaticKeys<TEnum extends EnumConst> = TEnum["_static"][number];

/**
 * Extracts the helper key names from the `_helpers` tuple.
 */
export type HelperKeys<TEnum extends EnumConst> = TEnum["_helpers"][number];

/**
 * Constraint for all generated enum const objects.
 *
 * - `_cases` lists the case key names (matches PHP enum cases).
 * - `_methods` lists instance method names whose values are per-case maps.
 *   Only these properties are resolved per-case by `from`; everything else
 *   passes through as-is. Use an empty array when there are no instance methods.
 * - `_helpers` lists helper method names added to the enum.
 * - `_static` lists static helper method names added to the enum.
 */
export type EnumConst = {
    readonly _cases: readonly string[];
    readonly _methods: readonly string[];
    readonly _static: readonly string[];
    readonly [key: string]: unknown;
};

/**
 * Resolves the case key name whose value matches the provided value.
 * Uses a mapped type to find case keys where the value type matches bidirectionally.
 */
export type MatchedCaseKey<TEnum extends EnumConst, TValue> = {
    [K in CaseKeys<TEnum>]: TEnum[K] extends TValue
        ? TValue extends TEnum[K]
            ? K
            : never
        : never;
}[CaseKeys<TEnum>];

/**
 * Resolves the value of an instance method for a given case value.
 * Iterates case keys to find the one whose value matches TValue bidirectionally,
 * then looks up the method's value at that case key.
 */
export type ResolveMethodForValue<
    TEnum extends EnumConst,
    K extends keyof TEnum,
    TValue,
> = {
    [C in CaseKeys<TEnum>]: TEnum[C] extends TValue
        ? TValue extends TEnum[C]
            ? C extends keyof TEnum[K]
                ? TEnum[K][C]
                : never
            : never
        : never;
}[CaseKeys<TEnum>];

/**
 * Builds the resolved instance type by iterating over all non-case, non-meta keys.
 *
 * - value: set directly to TValue.
 * - Instance methods (listed in _methods): resolved per-case via ResolveMethodForValue.
 * - Static methods / other values: passed through unchanged.
 */
export type ResolvedEnumInstance<TEnum extends EnumConst, TValue> = {
    readonly value: TValue;
} & {
    readonly [K in Exclude<
        keyof TEnum,
        CaseKeys<TEnum> | "_cases" | "_methods" | "_helpers" | "_static"
    >]: K extends MethodKeys<TEnum>
        ? ResolveMethodForValue<TEnum, K, TValue>
        : TEnum[K];
};

/**
 * Extracts the union of all case values from an enum const.
 */
export type CaseValue<TEnum extends EnumConst> = {
    [K in CaseKeys<TEnum>]: TEnum[K];
}[CaseKeys<TEnum>];

/**
 * The fully inferred return type of `from`.
 */
export type ToEnumResult<TEnum extends EnumConst, TValue> =
    MatchedCaseKey<TEnum, TValue> extends never
        ? never
        : ResolvedEnumInstance<TEnum, TValue>;

/**
 * Overrides properties in T with properties in U.
 * Equivalent to a spread: `{ ...T, ...U }`.
 * Keys to omit are derived automatically from U — no manual list needed.
 */
type Override<T, U> = Omit<T, keyof U> & U;

/**
 * The return type of `defineEnum`.
 *
 * Enriches a raw enum const object with bound `from`, `tryFrom`, and `cases`
 * methods so callers don't need to pass the enum object every time.
 *
 * Uses `Omit` to strip any existing `from`, `tryFrom`, or `cases` properties
 * from the original enum before intersecting, avoiding `never` from conflicting
 * property types (e.g. when the enum has `from: null` as a helper stub).
 */
export type DefineEnumResult<TEnum extends EnumConst> = Override<
    TEnum,
    {
        readonly _helpers: string[];
        readonly from: <const TValue extends CaseValue<TEnum>>(
            value: TValue,
        ) => ToEnumResult<TEnum, TValue>;
        readonly tryFrom: <const TValue extends CaseValue<TEnum>>(
            value: TValue,
        ) => ToEnumResult<TEnum, TValue> | null;
        readonly cases: () => Array<ToEnumResult<TEnum, CaseValue<TEnum>>>;
    }
>;
