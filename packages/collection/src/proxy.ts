import type { PropertyName,ProxyTarget } from "@laravel-js/types";

export function initProxyHandler<TValue>() {
    const handler: ProxyHandler<ProxyTarget> = {
        // Intercept property access
        get: (
            target: ProxyTarget,
            property: PropertyName,
            receiver: unknown,
        ) => {
            // Handle numeric/index access for arrays
            if (typeof property === "string" && !isNaN(Number(property))) {
                // const index = Number(property);
                // Check if items is array-like (has numeric indices)
                const items = target.items;
                if (
                    Array.isArray(items) ||
                    (items && typeof items === "object" && property in items)
                ) {
                    return (items as Record<PropertyName, TValue>)[property];
                }
            }

            // Handle string key access for objects
            if (typeof property === "string" && property in target.items) {
                return (target.items as Record<PropertyName, TValue>)[property];
            }

            // Handle internal class properties and methods
            if (property in target || typeof property === "symbol") {
                const value = Reflect.get(target, property, receiver);

                // Bind methods to maintain correct 'this' context
                if (
                    typeof value === "function" &&
                    value !==
                        (
                            target.constructor.prototype as Record<
                                PropertyName,
                                unknown
                            >
                        )[property]
                ) {
                    return (value as (...args: unknown[]) => unknown).bind(
                        target,
                    );
                }

                return value;
            }

            // For undefined properties, return undefined
            return undefined;
        },

        // Intercept property assignment
        set: (
            target: ProxyTarget,
            property: PropertyName,
            value: unknown,
            receiver: unknown,
        ): boolean => {
            // Handle numeric/index assignment for arrays
            if (typeof property === "string" && !isNaN(Number(property))) {
                const index = Number(property);
                const items = target.items;

                // If items is an array, set by index
                if (Array.isArray(items)) {
                    items[index] = value as TValue;
                    return true;
                }
                // If items is an object, set the numeric property
                else if (items && typeof items === "object") {
                    (items as Record<PropertyName, TValue>)[property] =
                        value as TValue;
                    return true;
                }
            }

            // Handle string key assignment for objects
            if (typeof property === "string" && property in target.items) {
                (target.items as Record<PropertyName, TValue>)[property] =
                    value as TValue;
                return true;
            }

            // Allow setting new properties on object-style collections
            if (
                typeof property === "string" &&
                target.items &&
                typeof target.items === "object" &&
                !Array.isArray(target.items)
            ) {
                (target.items as Record<PropertyName, TValue>)[property] =
                    value as TValue;
                return true;
            }

            // Allow setting other properties on the instance itself
            return Reflect.set(target, property, value, receiver);
        },

        // Intercept 'in' operator
        has: (target: ProxyTarget, property: PropertyName): boolean => {
            if (typeof property === "string") {
                // Check numeric indices
                if (!isNaN(Number(property))) {
                    const index = Number(property);
                    const items = target.items;
                    if (Array.isArray(items)) {
                        return index >= 0 && index < items.length;
                    }
                    return property in (items as Record<PropertyName, TValue>);
                }
                // Check string keys
                return (
                    property in (target.items as Record<PropertyName, TValue>)
                );
            }

            return Reflect.has(target, property);
        },

        // Intercept Object.keys(), for...in, etc.
        ownKeys: (target: ProxyTarget): Array<PropertyName> => {
            const itemKeys = Object.keys(target.items).map(
                (key) => key as PropertyName,
            );
            const instanceKeys = Reflect.ownKeys(target).filter(
                (key) => key !== "items" && typeof key !== "symbol",
            );

            return [...new Set([...itemKeys, ...instanceKeys])];
        },

        // Intercept property descriptor access
        getOwnPropertyDescriptor: (
            target: ProxyTarget,
            property: PropertyName,
        ): PropertyDescriptor | undefined => {
            if (typeof property === "string") {
                // Handle numeric indices
                if (!isNaN(Number(property))) {
                    const index = Number(property);
                    const items = target.items;
                    if (
                        (Array.isArray(items) &&
                            index >= 0 &&
                            index < items.length) ||
                        (items &&
                            property in (items as Record<PropertyName, TValue>))
                    ) {
                        return {
                            value: (items as Record<PropertyName, TValue>)[
                                property
                            ],
                            writable: true,
                            enumerable: true,
                            configurable: true,
                        };
                    }
                }
                // Handle string keys
                else if (
                    property in (target.items as Record<PropertyName, TValue>)
                ) {
                    return {
                        value: (target.items as Record<PropertyName, TValue>)[
                            property
                        ],
                        writable: true,
                        enumerable: true,
                        configurable: true,
                    };
                }
            }

            return Reflect.getOwnPropertyDescriptor(target, property);
        },
    };

    return handler;
}
