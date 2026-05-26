import type { PaginatorLink } from "./pagination";

/**
 * Interface representing the pagination structure of a JSON resource collection response, following Laravel's default JSON Resource format.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#pagination
 */
export interface JsonResourceMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: PaginatorLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

/**
 * Interface representing the structure of a JSON resource collection response with pagination links, following Laravel's default JSON Resource format.
 */
export interface JsonResourceLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

/**
 * Interface representing a paginated JSON resource collection response, following Laravel's default JSON Resource format.
 *
 * This structure includes the paginated data array, along with the pagination metadata and links as defined by Laravel's default JSON Resource responses.
 */
export interface JsonResourcePaginator<T> {
    data: T[];
    meta: JsonResourceMeta;
    links: JsonResourceLinks;
}

/**
 * Interface representing an anonymous JSON resource collection response, following Laravel's default JSON Resource format.
 */
export interface AnonymousResourceCollection<T> {
    data: T[];
}

/**
 * Interface representing a paginated JSON resource collection response with pagination metadata and links, following Laravel's default JSON Resource format.
 *
 * This interface is meant to extend basic collection resources with pagination information.
 */
export interface ResourcePagination {
    meta: JsonResourceMeta;
    links: JsonResourceLinks;
}
