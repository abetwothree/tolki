import type { PaginatorLink } from "./pagination";

/**
 * The `meta` block of a resource collection paginated with `paginate()`.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#pagination
 */
export interface JsonResourceMeta {
    current_page: number;
    /** `null` on a page with no items. */
    from: number | null;
    last_page: number;
    links: PaginatorLink[];
    path: string;
    per_page: number;
    /** `null` on a page with no items. */
    to: number | null;
    total: number;
}

/**
 * The `meta` block of a resource collection paginated with `simplePaginate()`.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#pagination
 */
export interface JsonResourceSimpleMeta {
    current_page: number;
    /** Sent from Laravel 12.15. */
    current_page_url?: string;
    /** `null` on a page with no items. */
    from: number | null;
    path: string;
    per_page: number;
    /** `null` on a page with no items. */
    to: number | null;
}

/**
 * The `meta` block of a resource collection paginated with `cursorPaginate()`.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#pagination
 */
export interface JsonResourceCursorMeta {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
}

/**
 * The `links` block of a paginated resource collection, following Laravel's default JSON Resource format.
 *
 * `last` is always `null` over `simplePaginate()`, and `first` and `last` are always `null` over `cursorPaginate()`.
 */
export interface JsonResourceLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

/**
 * A resource collection paginated with `paginate()`, following Laravel's default JSON Resource format.
 *
 * This structure includes the paginated data array, along with the pagination metadata and links as defined by Laravel's default JSON Resource responses.
 */
export interface JsonResourcePaginator<T> {
    data: T[];
    meta: JsonResourceMeta;
    links: JsonResourceLinks;
}

/**
 * A resource collection paginated with `simplePaginate()`.
 */
export interface JsonResourceSimplePaginator<
    T,
> extends ResourceSimplePagination {
    data: T[];
}

/**
 * A resource collection paginated with `cursorPaginate()`.
 */
export interface JsonResourceCursorPaginator<
    T,
> extends ResourceCursorPagination {
    data: T[];
}

/**
 * Interface representing an anonymous JSON resource collection response, following Laravel's default JSON Resource format.
 */
export interface AnonymousResourceCollection<T> {
    data: T[];
}

/**
 * The `meta` and `links` blocks Laravel adds to a resource collection paginated with `paginate()`.
 *
 * This interface is meant to extend basic collection resources with pagination information.
 */
export interface ResourcePagination {
    meta: JsonResourceMeta;
    links: JsonResourceLinks;
}

/**
 * The `meta` and `links` blocks Laravel adds to a resource collection paginated with `simplePaginate()`.
 *
 * Like `ResourcePagination`, it is meant to extend a collection's own interface.
 */
export interface ResourceSimplePagination {
    meta: JsonResourceSimpleMeta;
    links: JsonResourceLinks;
}

/**
 * The `meta` and `links` blocks Laravel adds to a resource collection paginated with `cursorPaginate()`.
 *
 * Like `ResourcePagination`, it is meant to extend a collection's own interface.
 */
export interface ResourceCursorPagination {
    meta: JsonResourceCursorMeta;
    links: JsonResourceLinks;
}
