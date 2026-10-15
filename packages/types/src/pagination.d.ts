/**
 * What Laravel's `simplePaginate()` paginator sends.
 *
 * @see https://laravel.com/docs/master/pagination#converting-results-to-json
 */
export interface SimplePaginator<T> {
    current_page: number;
    /** Sent from Laravel 12.15. */
    current_page_url?: string;
    data: T[];
    first_page_url: string;
    /** `null` on a page with no items. */
    from: number | null;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    /** `null` on a page with no items. */
    to: number | null;
}

/**
 * What Laravel's `paginate()` paginator sends.
 *
 * @see https://laravel.com/docs/master/pagination#converting-results-to-json
 */
export interface LengthAwarePaginator<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    /** `null` on a page with no items. */
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginatorLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    /** `null` on a page with no items. */
    to: number | null;
    total: number;
}

/**
 * What Laravel's `cursorPaginate()` paginator sends.
 *
 * @see https://laravel.com/docs/master/pagination#converting-results-to-json
 */
export interface CursorPaginator<T> {
    data: T[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
}

/**
 * One entry of a length-aware paginator's `links` list.
 */
export interface PaginatorLink {
    url: string | null;
    label: string;
    /** The page the link points to. Sent from Laravel 12.23, and never on the `...` separator. */
    page?: number | null;
    active: boolean;
}
