# Change Log
_Breaking changes indicated with *_

We will use this space to highlight major and/or breaking changes to Malloy.

## v0.0.40

### *More strict expression types

Previously, `group_by:`, `nest:`, `aggregate:`, `dimension:`, `measure:`, etc. would all allow fields of the wrong expression type (dimension, measure, query). Now that is an error.

### *Function argument typechecking

Function arguments are now typechecked for a set of "built-in" functions. All unknown functions will error. See [the functions documentation](./functions.md) and [a detailed description of what changed](./new_functions.md).

### Forced function call syntax

For functions which are not "built-in", or to call the native SQL version of a function, there is special syntax:

```malloy
// Exclamation point indicates to not typecheck arguments and directly call the named SQL function
// Return type is by default the same as the first argument
dimension: cuberoot_value is cbrt!(value)
// A return type may be specified after the exclamation point
dimension: timestamp_value is timestamp_seconds!timestamp(value)
```

### Calculations (analytic functions / window functions)

There is a new keyword `calculate:` which can appear in a query, for use with [analytic functions](./functions.md#analytic-functions).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy" }
query: flights -> {
  group_by: carrier
  calculate: prev_carrier is lag(carrier)
}
```

### *New functions are in the global namespace

New functions are in the global namespace, which means that top level objects (SQL blocks, queries, sources) in a Malloy file cannot have the same name as a built-in function.

## v0.0.10

### The apply operator is now ? and not :

In the transition from filters being with an array like syntax ...

```
sourceName :[ fieldName: value1|value2 ]
```

The use of `:` as the apply operator became a readability problem ...

```
sourceName { where: fieldName: value1|value2 }
```

As of this release, use of the `:` as an apply operator will generate a warning,
and in a near future release it will be a compiler error. The correct
syntax for apply is now the `?` operator. As in

```
sourceName { where: fieldName ? value1|value2 }
```

## 0.0.9

### Deprecation of brackets for lists of items

Prior to version 0.0.9, lists of things were contained inside `[ ]`. Going forward, the brackets have been removed. Our hope is that this will be one less piece of punctuation to track, and will make it easier to change from a single item in a list to multiple without adding in brackets.

For example, this syntax:
```malloy
query: table('malloy-data.faa.airports') -> {
  top: 10
  group_by: [
    faa_region
    state
  ]
  aggregate: [
    airport_count is count()
    count_public is count() { where: fac_use = 'PU' },
    average_elevation is round(elevation.avg(),0)
  ]
  where: [
    faa_region: 'ANM' | 'ASW' | 'AWP' | 'AAL' | 'ASO' ,
    major = 'Y' ,
    fac_type = 'AIRPORT'
  ]
}
```

Is now written:
```malloy
query: table('malloy-data.faa.airports') -> {
  top: 10
  group_by:
    faa_region
    state
  aggregate:
    airport_count is count()
    count_public is count() { where: fac_use = 'PU' },
    average_elevation is round(elevation.avg(),0)
  where:
    faa_region: 'ANM' | 'ASW' | 'AWP' | 'AAL' | 'ASO' ,
    major = 'Y' ,
    fac_type = 'AIRPORT'
}
```
