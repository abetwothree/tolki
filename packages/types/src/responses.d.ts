import type { PaginatorLink } from "./pagination";

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

export interface JsonResourceLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

export interface JsonResource<T> {
    data: T[];
    meta: JsonResourceMeta;
    links: JsonResourceLinks;
}
