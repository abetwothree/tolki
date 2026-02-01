# Data Package Type Overloads - Future Work

## Problem

Many functions in `data.ts` use `DataItems<TValue, TKey>` as both input and return types, which loses type specificity. When a user passes an array, they should get array-specific return types. When they pass an object, they should get object-specific return types.

## Solution Pattern

Follow the pattern established in `dataAdd`:

```typescript
// 1. Object overload - uses obj* function return type
export function dataFoo<TValue, TKey extends PropertyKey = PropertyKey>(
  data: Record<TKey, TValue>,
  ...otherParams
): ReturnType<typeof objFoo<TValue, TKey>>;

// 2. Array overload - uses arr* function return type
export function dataFoo<TValue>(
  data: TValue[],
  ...otherParams
): ReturnType<typeof arrFoo<TValue>>;

// 3. Implementation - uses DataItems union type
export function dataFoo<TValue, TKey extends PropertyKey = PropertyKey>(
  data: DataItems<TValue, TKey>,
  ...otherParams
) {
  if (isObject(data)) {
    return objFoo(data as Record<TKey, TValue>, ...otherParams);
  }
  return arrFoo(arrWrap(data), ...otherParams);
}
```

## Benefits

1. **Type inference** - TypeScript knows the return type based on input
2. **No manual type assertions** - Users don't need to cast results
3. **IDE autocomplete** - Better developer experience with accurate suggestions
4. **Collection.ts integration** - Better type inference in collection methods that use data.ts

## Functions That Need This Treatment

Functions that currently use `DataItems` as return type and need overloads:

- [ ] dataBoolean
- [ ] dataChunk (partially done)
- [ ] dataCollapse (partially done)
- [ ] dataCombine (partially done)
- [ ] dataCrossJoin
- [ ] dataDivide
- [ ] dataDot
- [ ] dataUndot
- [ ] dataUnion
- [ ] dataExcept
- [ ] dataExceptValues
- [ ] dataExists
- [ ] dataTake
- [ ] dataFlatten
- [ ] dataFlip
- [ ] dataFloat
- [ ] dataForget
- [ ] dataFrom
- [ ] dataGet
- [ ] dataHas
- [ ] dataHasAll
- [ ] dataHasAny
- [ ] dataEvery
- [ ] dataSome
- [ ] dataInteger
- [ ] dataJoin
- [ ] dataKeyBy
- [ ] dataPrependKeysWith
- [ ] dataOnly
- [ ] dataOnlyValues
- [ ] dataSelect
- [ ] dataMapWithKeys
- [ ] dataMapSpread
- [ ] dataPrepend
- [ ] dataPull
- [ ] dataQuery
- [ ] dataRandom
- [ ] dataSearch
- [ ] dataBefore
- [ ] dataAfter
- [ ] dataShift
- [ ] dataSet
- [ ] dataPush
- [ ] dataUnshift (partially done)
- [ ] dataShuffle
- [ ] dataSlice
- [ ] dataSole
- [ ] dataSort
- [ ] dataSortDesc
- [ ] dataSortRecursive
- [ ] dataSortRecursiveDesc
- [ ] dataSplice
- [ ] dataString
- [ ] dataToCssClasses
- [ ] dataToCssStyles
- [ ] dataWhere
- [ ] dataReplace
- [ ] dataReplaceRecursive
- [ ] dataReject
- [ ] dataReverse
- [ ] dataPad
- [ ] dataPartition
- [ ] dataWhereNotNull
- [ ] dataValues
- [ ] dataKeys
- [ ] dataFilter
- [ ] dataMap
- [ ] dataFirst
- [ ] dataLast
- [ ] dataContains
- [ ] dataDiff
- [ ] dataDiffAssocUsing
- [ ] dataDiffKeysUsing
- [ ] dataPluck
- [ ] dataPop
- [ ] dataIntersect
- [ ] dataIntersectAssoc
- [ ] dataIntersectAssocUsing
- [ ] dataIntersectByKeys

## Already Properly Overloaded

- [x] dataAdd
- [x] dataItem
- [x] dataChunk (needs review)
- [x] dataCollapse (needs review)
- [x] dataCombine (needs review)
- [x] dataUnshift (partially)

## Notes

- Run `pnpm ts:check` after each batch of changes
- Run `pnpm test` to ensure no regressions
- The Collection class in `collection.ts` uses many of these functions, so improved typing here will cascade to better collection types
