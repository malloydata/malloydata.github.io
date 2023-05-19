# Data Types In Malloy

Because Malloy writes SQL expressions, when queries are actually executed, all data will be in types understood by the SQL engine which is running the query.

Malloy does have a set of data types and there is a mapping between the types of the SQL engine and the Malloy datatypes, mostly this mapping is invisible.

## Numeric

An engine will have a large variety of storage formats for numeric data. Malloy doesn't distinguish between these, and simply folds them all into one type.

Although Malloy can use columns of any numberic type, there is no way to write a pure Malloy query to generate columns in a specific engine type.

### Numeric Literals

Malloy has a fairly basic syntac for numeric literals

* `123`
* `123.4`
* `.4`
* `0.4`
* `123E4`
* `123E+4`
* `123E-4`

## String

Malloy uses single quotes to wrap strings and uses the "backslash" (reverse virgule) to quote a single character within the string

* `'My name is Michael'`
* `'My name isn\'t Mike'`

## Boolean

Malloy has one interesting difference from most SQL engines in how it handles null values.

The expression `mightBeNull > 0` ...
* SQL result is a boolean column where the value could be `true`, `false`, or `NULL`
* Malloy result will only be `true` or `false`

### Boolean literals

* `true`
* `false`

## Timestamp

A timestamp represents an instant in time.

### Timestamp literals

Timestamp literals are specified in Malloy with the `@` character. Seconds, and subsecond resolution maybe be specified and an optional locale may also be added.

* `@2001-02-03 04:05:06.001 [America/Mexico_City]`
* `@2001-02-03 04:05:06.001`
* `@2001-02-03 04:05:06`
* `@2001-02-03 04:05`

In addition, in any of the above, a `T` can be used instead of a space between the date and time portion of the timestamp string, as in

* `@2001-02-03T04:05:06.001`

A date literal, when used in an expression with a timestamp, also functions as a timestamp literal. That is

* `myTimestamp > @2003` is equivalent to `myTimestamp > @2003-01-01 00:00`

## Date

A date represents combination of year, month, day into a single data item.

### Date Literals

Date literals are specified in Malloy with the `@` character. A literal can specify a date, a week, a month, a quarter or a year.

* Date: `@2001-02-03`
* Week: `@2001-WK2`
* Month: `@2001-02`
* Quarter: `@2001-Q2`
* Year: `@2001`

## Unsupported

Columns in sources which Malloy does not have a datatype for are considered "unsupported". The following operations are legal on unsupported types

* Two expressions of the same unsupported type can be compared
* An unsupported type can be compared to `NULL`
* An expression of unsupported type can be cast to a supported type

## Unknown

When parsing expressions, an error in an expression may result in an expression where the compiler does not know the resulting type. Error messages containing the phrase `type 'unknown'` indicate that there is an eariler error which has produced this condition.
