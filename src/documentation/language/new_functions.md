# Functions Changes in v0.0.39

In Malloy version 0.0.39, treatment of functions changed dramatically. 

## The Old Way ("SQL Functions")

Prior to v0.0.39:

* Any function call of the form `SOME_NAME(arg1, arg2, ..., argN)` was translated directly into SQL as-is. 
* If the dialect had no function called `SOME_NAME` a dialect SQL error would be generated. 
* Arguments were not typechecked, meaning you could call `SIN('seven')` or `BYTE_LENGTH(42)`. 
* The Malloy return type was inferred to be the same as the first argument's type, except in special cases where the type was known.
* There was no way to tell Malloy that the return type was different than the inferred type, except to cast the result, e.g. `TIMESTAMP_SECONDS(num_seconds)::timestamp`.
* Sources and other top-level model objects could have the same name as functions.

## The New Way ("Malloy Functions")

Starting in v0.0.39:

* There is a [list of "built-in" functions available in Malloy](./functions.md#all-functions).
* Some functions, such as `sin(x)` are translated to SQL as-is.
* Other functions are translated with compatibility transformations; e.g. `starts_with(val, 'prefix')` is translated into SQL as <code>COALESCE(STARTS_WITH(val, 'prefix'), FALSE)</code> to abide by Malloy's guarantees about nullability of boolean comparisons; or, `log(value, base)` in Postgres is translated to <code>LOG(base, value)</code> so that Malloy has a consistent argument order across dialects. See the [function documentation](./functions.md) for specifics on a function-by-function basis.
* Function arguments are typechecked, making `sin('seven')` an error, 'No matching overload for function sin(string).'
* Return types of all Malloy functions are known.
* Functions not known to Malloy may be called like `cbrt!(x)` or `timestamp_seconds!timestamp(value)`, the latter form instructing Malloy that the function call yields a value of type `timestamp`. When called in this way, functions are translated into SQL as-is, and the return type is inferred to be the same as the first argument (or `number` if there are no arguments) unless specified. 
* Sources and other top-level model objects can not have the same name as functions.