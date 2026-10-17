import type {
    JsonResourceCursorMeta,
    JsonResourceLinks,
    JsonResourceMeta,
    JsonResourceSimpleMeta,
} from "./resource-responses";

/**
 * A resource identifier object: how a relationship's `data` names a related resource.
 *
 * @see https://jsonapi.org/format/#document-resource-identifier-objects
 */
export interface JsonApiResourceIdentifier<TType extends string = string> {
    /** Always a string, even for an integer key. */
    id: string;
    type: TType;
}

/**
 * A to-one relationship object, whose `data` is `null` when the related model is missing.
 *
 * @see https://jsonapi.org/format/#document-resource-object-relationships
 */
export interface JsonApiToOneRelationship<TType extends string = string> {
    data: JsonApiResourceIdentifier<TType> | null;
}

/**
 * A to-many relationship object, whose `data` is an empty list when there are no related models.
 *
 * @see https://jsonapi.org/format/#document-resource-object-relationships
 */
export interface JsonApiToManyRelationship<TType extends string = string> {
    data: JsonApiResourceIdentifier<TType>[];
}

/**
 * A to-one or to-many relationship object.
 */
export type JsonApiRelationship<TType extends string = string> =
    | JsonApiToOneRelationship<TType>
    | JsonApiToManyRelationship<TType>;

/**
 * A resource object, as a JSON:API resource sends it under `data` and in `included`.
 *
 * With its defaults, it fits any resource object, such as an `included` entry of a type you have not declared.
 *
 * @see https://jsonapi.org/format/#document-resource-objects
 */
export interface JsonApiResourceObject<
    TType extends string = string,
    TAttributes extends object = Record<string, unknown>,
    TRelationships extends object = Record<string, JsonApiRelationship>,
> {
    /** Always a string, even for an integer key. */
    id: string;
    type: TType;
    attributes?: TAttributes;
    relationships?: TRelationships;
    links?: Record<string, unknown>;
    meta?: Record<string, unknown>;
}

/**
 * The top-level `jsonapi` member, sent once `JsonApiResource::configure()` has set it.
 *
 * @see https://jsonapi.org/format/#document-jsonapi-object
 */
export interface JsonApiObject {
    version?: string;
    ext?: string[];
    profile?: string[];
    meta?: Record<string, unknown>;
}

/**
 * The document a JSON:API resource sends for a single model.
 *
 * `TIncluded` is the union of the resource objects an `?include=` request can add to `included`.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#jsonapi-resources
 */
export interface JsonApiDocument<TResource, TIncluded = JsonApiResourceObject> {
    data: TResource;
    included?: TIncluded[];
    jsonapi?: JsonApiObject;
}

/**
 * The document `SomeResource::collection()` sends over a collection that is not paginated.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#jsonapi-resources
 */
export interface JsonApiCollection<
    TResource,
    TIncluded = JsonApiResourceObject,
> {
    data: TResource[];
    included?: TIncluded[];
    jsonapi?: JsonApiObject;
}

/**
 * The document `SomeResource::collection()` sends over a `paginate()` paginator.
 */
export interface JsonApiPaginator<
    TResource,
    TIncluded = JsonApiResourceObject,
> extends JsonApiCollection<TResource, TIncluded> {
    links: JsonResourceLinks;
    meta: JsonResourceMeta;
}

/**
 * The document `SomeResource::collection()` sends over a `simplePaginate()` paginator.
 */
export interface JsonApiSimplePaginator<
    TResource,
    TIncluded = JsonApiResourceObject,
> extends JsonApiCollection<TResource, TIncluded> {
    links: JsonResourceLinks;
    meta: JsonResourceSimpleMeta;
}

/**
 * The document `SomeResource::collection()` sends over a `cursorPaginate()` paginator.
 */
export interface JsonApiCursorPaginator<
    TResource,
    TIncluded = JsonApiResourceObject,
> extends JsonApiCollection<TResource, TIncluded> {
    links: JsonResourceLinks;
    meta: JsonResourceCursorMeta;
}

/**
 * A resource object read under a sparse fieldset (`?fields[type]=…`), where any attribute may be left out.
 *
 * Over a union, it reads each resource object on its own, so narrowing on `type` still narrows `attributes`.
 *
 * @see https://laravel.com/docs/master/eloquent-resources#jsonapi-sparse-fieldsets-and-includes
 */
export type JsonApiSparse<TResource extends { attributes?: object }> =
    TResource extends unknown
        ? Omit<TResource, "attributes"> & {
              attributes?: Partial<NonNullable<TResource["attributes"]>>;
          }
        : never;
