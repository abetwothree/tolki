export interface Model {
    id?: string | number;
    [key: string]: unknown;
}

export interface Timestamps {
    created_at: string | null;
    updated_at: string | null;
}

export interface SoftDeletes {
    deleted_at: string | null;
}

export interface TimestampModel extends Model, Timestamps {}
export interface SoftDeleteModel extends Model, SoftDeletes {}
export interface AllTimestampsModel extends Model, Timestamps, SoftDeletes {}

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
