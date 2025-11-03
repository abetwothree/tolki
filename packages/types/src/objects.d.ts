/**
 * Helper type to add a key-value pair to an object type
 */
export type AddToObject<
    T extends Record<PropertyKey, unknown>,
    K extends string,
    V,
> = T & Record<K, V>;
