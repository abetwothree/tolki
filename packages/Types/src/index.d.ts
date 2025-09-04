export interface SimplePaginator<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
}

export interface LengthAwarePaginator<T> {
    current_page: number;
    data: T[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginatorLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface CursorPaginator<T> {
    data: T[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
}

export interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Model {
    [key: string]: unknown;
}

export interface Timestamps {
    created_at: string | null;
    updated_at: string | null;
}

export interface SoftDeletes {
    deleted_at: string | null;
}

export interface TimestampedModel extends Model, Timestamps {}
export interface SoftDeletableModel extends Model, SoftDeletes {}
export interface ModelWithTimestamps extends Model, Timestamps, SoftDeletes {}

export type AsCount<T extends string> = `${T}_count`;
export type AsMax<T extends string> = `${T}_max`;
export type AsMin<T extends string> = `${T}_min`;
export type AsSum<T extends string> = `${T}_sum`;
export type AsAvg<T extends string> = `${T}_avg`;
export type AsExists<T extends string> = `${T}_exists`;

export type WithCount<Relations extends string> = {
    [K in Relations as AsCount<K>]: number;
};
export type WithMax<Relations extends string> = {
    [K in Relations as AsMax<K>]: number | null;
};
export type WithMin<Relations extends string> = {
    [K in Relations as AsMin<K>]: number | null;
};
export type WithSum<Relations extends string> = {
    [K in Relations as AsSum<K>]: number | null;
};
export type WithAvg<Relations extends string> = {
    [K in Relations as AsAvg<K>]: number | null;
};
export type WithExists<Relations extends string> = {
    [K in Relations as AsExists<K>]: boolean;
};

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
