# Functions

Malloy has a standard set of functions available at all times. These include scalar functions (e.g. `concat`), aggregate functions (e.g. `stddev`), and analytic (or "window") functions (e.g. `lag`).

These functions are defined in Malloy in order to provide basic typechecking of arguments and return types, as well as _some_ compatibility transformations. Perfect compatibility across all dialects for all functions is not guaranteed, and specific differences are noted on a case-by-case basis. 

For quick function lookup, see the [alphebetized table of all available functions](#all-functions).

Note: the behavior of functions changed in v0.0.40. For more information, see [a description of that change](./new_functions.md).

```malloy
--! {"isModel": true, "modelPath": "/inline/empty.malloy", "isHidden": true}
sql: my_sql_query is {
  select: """
    SELECT 1
  """
}

source: empty is from_sql(my_sql_query) {}
```

## Syntax

### Built-In Functions

Functions that are "built-in" to Malloy can be called the usual way with the name of the function, an open parenthesis, a comma separated list of Malloy expressions, and a close parenthesis, e.g. `concat(upper(first), ' ', upper(last))`.

### Raw SQL Functions

Functions that are _not_ built in may be called in the same way, but with an `!` in between the function name and argument list: `sinh!(x)`. In this case, Malloy assumes the return type of the function is the same as that of the first argument (or `number` if there are no arguments). When this is not correct, the return type can be specified after the `!`, e.g. `hash!number(username)`.

## Function Documentation

| Section |
|---|
| [String Functions](#string-functions)  |
| [Numeric Functions](#numeric-functions)  |
| [Interval Functions](#interval-functions) |
| [Date and Timestamp Functions](#date-and-timestamp-functions) |
| [Other Functions](#other-functions) |
| [Aggregate Functions](#aggregate-functions)  |
| [Ungrouped Aggregate Functions](#ungrouped-aggregate-functions)  |
| [Analytic Functions](#analytic-functions)  |

<!-- 
 | [Missing SQL Functions](#missing-sql-functions)  | 
 -->

## String Functions

<table class="transpose">
  <tr>
    <td><a href="#ascii">ascii</a></td>
    <td><a href="#byte_length">byte_length</a></td>
    <td><a href="#chr">chr</a></td>
    <td><a href="#concat">concat</a></td>
    <td><a href="#ends_with">ends_with</a></td>
  </tr>
  <tr>
    <td><a href="#length">length</a></td>
    <td><a href="#lower">lower</a></td>
    <td><a href="#ltrim">ltrim</a></td>
    <td><a href="#regexp_extract">regexp_extract</a></td>
    <td><a href="#repeat">repeat</a></td>
  </tr>
  <tr>
    <td><a href="#replace">replace</a></td>
    <td><a href="#repeat">repeat</a></td>
    <td><a href="#rtrim">rtrim</a></td>
    <td><a href="#starts_with">starts_with</a></td>
    <td><a href="#strpos">strpos</a></td>
  </tr>
  <tr>
    <td><a href="#substr">substr</a></td>
    <td><a href="#trim">trim</a></td>
    <td><a href="#unicode">unicode</a></td>
    <td><a href="#upper">upper</a></td>
    <td>&nbsp;</td>
  </tr>
</table>

### concat

```malloy
concat(value, ...)
```

Concatenates multiple values together, casting non-`string` values to `string`. The exact behavior of string casting may depend on the dialect.

If no values are given, `concat` returns the empty string.

Behavior for `null` depends on dialect: in BigQuery, if any argument is `null`, the result is `null`; in DuckDB and Postgres, `null` is treated as an empty string.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is concat('foo', 'bar')
    e2 is concat(1, null)
    e4 is concat('Date: ', @2021-01-23)
    e3 is concat()
}
```

### lower

```malloy
lower(value)
```

Returns a string like `value` but with all alphabetic characters in lowercase.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: e1 is lower('FOO')
}
```

### upper

```malloy
upper(value)
```

Returns a string like `value` but with all alphabetic characters in uppercase.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: e1 is upper('foo')
}
```

### strpos

```
strpos(test_string, search_string)
```

Returns the 1-based position of the first occurrence of `search_string` in `test_string`, or `0` if `search_string` is not found.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is strpos('abc', 'b')
    e2 is strpos('abc', 'd')
    e3 is strpos('abc', null)
    e4 is strpos(null, 'a')
}
```

### starts_with

```malloy
starts_with(value, prefix)
```

Returns `true` if `value` begins with `prefix` and `false` otherwise. If either `value` or `prefix` is `null`, the result is `false` (unlike in SQL, where it would be `null`).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is starts_with('abc', 'a')
    e2 is starts_with('abc', 'b')
    e3 is starts_with('abc', null)
    e4 is starts_with(null, 'a')
}
```

### ends_with

```malloy
ends_with(value, suffix)
```

Returns `true` if `value` ends with `prefix` and `false` otherwise. If either `value` or `suffix` is `null`, the result is `false` (unlike in SQL, where it would be `null`).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is ends_with('abc', 'c')
    e2 is ends_with('abc', 'b')
    e3 is ends_with('abc', null)
    e4 is ends_with(null, 'a')
}
```

### trim

```malloy
trim(value)
trim(value, trim_characters)
```

Returns a string with leading and trailing characters in `trim_characters` (or whitespace, if `trim_characters` is unspecified) removed.

```malloy
--! {"isRunnable": true, "showAs":"json", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is trim('  keep this  ')
    e2 is trim('_ _keep_this_ _', '_ ')
    e3 is trim(' keep everything ', '')
    e4 is trim('null example', null)
    e5 is trim(null, ' _')
}
```

### ltrim

```malloy
ltrim(value)
ltrim(value, trim_characters)
```

Like `trim(value, trim_characters)` but only removes leading characters.

```malloy
--! {"isRunnable": true, "showAs":"json", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is ltrim('  keep this ->  ')
    e2 is ltrim('_ _keep_this -> _ _', '_ ')
    e3 is ltrim(' keep everything ', '')
    e4 is ltrim('null example', null)
    e5 is ltrim(null, ' _')
}
```

### rtrim

```malloy
rtrim(value)
rtrim(value, trim_characters)
```

Like `trim(value, trim_characters)` but only removes trailing characters.

```malloy
--! {"isRunnable": true, "showAs":"json", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is rtrim('  <- keep this  ')
    e2 is rtrim('_ _ <- keep_this _ _', '_ ')
    e3 is rtrim(' keep everything ', '')
    e4 is rtrim('null example', null)
    e5 is rtrim(null, ' _')
}
```

### substr

```malloy
substr(value, position)
substr(value, position, length)
```

Returns a substring of `value` starting at the 1-based index `position`. If `length` is specified, the returned string will be at most `length` characters long; otherwise the returned string will extend to the end of `value`. Negative values of `position` index the starting value from the end of the string (with `-1` for the last character of the string). A `position` of `0` is equivalent to a `position` of `1`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is substr('123456789', 1)
    e2 is substr('123456789', 0)
    e3 is substr('123456789', 5)
    e4 is substr('123456789', -4)
    e5 is substr('123456789', 1, 3)
    e6 is substr('123456789', -5, 3)
    e7 is substr('123456789', null, 1)
    e8 is substr('123456789', 1, null)
    e9 is substr(null, 1, 1)
}
```

### regexp_extract

```malloy
regexp_extract(value, pattern)
```

Returns the first substring of `value` which matches `pattern`. Returns `null` if there is no matching substring.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is regexp_extract('the Malloy language', r'M....y')
    e2 is regexp_extract('the SQL language', r'M....y')
    e3 is regexp_extract('the null language', null)
    e4 is regexp_extract(null, r'nothing')
}
```

### replace

```malloy
replace(value, pattern, replacement)
```

Returns a copy of `value` with all occurrences of `pattern` replaced with `replacement`. 

If `pattern` is empty, no replacement occurs and `value` is returned unchanged.

If `pattern` is a regular expression, parenthesized capturing groups can be included in the `replacement` string with `'\\1'` to `'\\9'`. In BigQuery and DuckDB, the full matched string can be referenced with `'\\0'`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is replace('the SQL language', 'SQL', 'Malloy')
    e2 is replace('the SQL language', r'S.L', 'Malloy')
    e3 is replace('SQL SQL SQL', 'SQL', 'Malloy')
    e4 is replace('SQL SQL SQL', r'S.L', 'Malloy')
    e5 is replace(null, 'SQL', 'Malloy')
    e6 is replace('the null language', null, 'Malloy')
    e7 is replace('the null language', 'SQL', null)
    e8 is replace('the language', '', 'Malloy')
    e9 is replace('axbxc', r'(a).(b).(c)', '\\0 - \\1 - \\2 - \\3')
}
```

### length

```malloy
length(value)
```

Returns the number of characters in `value`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is length('Malloy')
    e2 is length('')
    e3 is length('𝔐𝔞𝔩𝔩𝔬𝔶')
    e4 is length(null)
}
```

### byte_length

```malloy
byte_length(value)
```

Returns the number of bytes in the unicode encoding of `value`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is byte_length('Malloy')
    e2 is byte_length('')
    e3 is byte_length('𝔐𝔞𝔩𝔩𝔬𝔶')
    e4 is byte_length(null)
}
```

### chr

```malloy
chr(value)
```

Returns a unicode code point `value` and returns a string containing the character with the matching code point. If `value` is 0, returns an empty string _not_ a string containing the null character.

```malloy
--! {"isRunnable": true, "showAs":"json", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is chr(65)
    e2 is chr(255)
    e3 is chr(0)
    e4 is chr(null)
}
```

Returns an error if `value` is not a valid unicode code point.

### ascii

```malloy
ascii(value)
```

Returns the ASCII code point of the first character of `value`. If `value` is empty, returns 0.

In BigQuery, `ascii` errors if the first character of `value` is not representable in ASCII. In Postgres and DuckDB, `ascii` returns the Unicode code point of the first character.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is ascii('Malloy')
    e2 is ascii('')
    e3 is ascii(null)
}
```

### unicode

```malloy
unicode(value)
```

Returns the Unicode code point of the first character of `value`. If `value` is empty, returns 0.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is unicode('Malloy')
    e2 is unicode('𝔐𝔞𝔩𝔩𝔬𝔶')
    e3 is unicode('')
    e4 is unicode(null)
}
```

### repeat

```malloy
repeat(value, num_repetitions)
```

Return a string consisting of `value` repeated `num_repetitions` times.

Undefined behavior if `num_repetitions` is negative or a non-integer.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is repeat('(A)', 3)
    e2 is repeat('(A)', 1)
    e3 is repeat('(A)', 0)
    e4 is repeat('', 3)
    e5 is repeat(null, 1)
    e6 is repeat('(A)', null)
}
```

### reverse

```malloy
reverse(value)
```

Return a copy of `value` with the characters in reverse order.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is reverse('Malloy')
    e2 is reverse('𝔶𝔬𝔩𝔩𝔞𝔐')
    e3 is reverse('racecar')
    e4 is reverse('')
    e5 is reverse(null)
}
```

## Numeric Functions

<table class="transpose">
  <tr>
    <td><a href="#abs">abs</a></td>
    <td><a href="#acos">acos</a></td>
    <td><a href="#asin">asin</a></td>
    <td><a href="#atan">atan</a></td>
    <td><a href="#atan2">atan2</a></td>
    <td><a href="#ceil">ceil</a></td>
  </tr>
  <tr>
    <td><a href="#cos">cos</a></td>
    <td><a href="#div">div</a></td>
    <td><a href="#exp">exp</a></td>
    <td><a href="#floor">floor</a></td>
    <td><a href="#is_inf">is_inf</a></td>
    <td><a href="#is_nan">is_nan</a></td>
  </tr>
  <tr>
    <td><a href="#log">log</a></td>
    <td><a href="#ln">ln</a></td>
    <td><a href="#pi">pi</a></td>
    <td><a href="#pow">pow</a></td>
    <td><a href="#rand">rand</a></td>
    <td><a href="#round">round</a></td>
  </tr>
  <tr>
    <td><a href="#sign">sign</a></td>
    <td><a href="#sin">sin</a></td>
    <td><a href="#sqrt">sqrt</a></td>
    <td><a href="#tan">tan</a></td>
    <td><a href="#trunc">trunc</a></td>
    <td>&nbsp;</td>
  </tr>
</table>

### round

```malloy
round(value)
round(value, precision)
```

Round `value` to the nearest integer, or if `precision` is specified, round to `precision` decimal places right of the decimal. If `precision` is negative, round to a precision that many places to the left of the decimal. Halfway cases are rounded away from zero.


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is round(1.49)
    e2 is round(1.51)
    e3 is round(1.5)
    e4 is round(-1.5)
    e5 is round(1.5, 0)
    e6 is round(1.551, 1)
    e7 is round(14.12, -1)
    e8 is round(1.4, null)
    e9 is round(null, 1)
}
```

<!-- | Example | Result |
| --- | --- |
| `round(1.49)` | 1 |
| `round(1.51)` | 2 |
| `round(1.5)` | 2 |
| `round(-1.5)` | -2 |
| `round(1.5, 0)` | 2 |
| `round(1.551, 1)` | 1.6 |
| `round(14.12, -1)` | 10 |
| `round(1.4, null)` | ∅ |
| `round(null, 1)` | ∅ | -->

### trunc

```malloy
trunc(value)
trunc(value, precision)
```

Truncate `value` to an integer, or if `precision` is specified, truncate after that many decimal places. If `precision` is negative, truncate to that many decimal places to the left of the decimal point. Similar to `round(value, precision)` but always rounds toward zero.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    e1 is trunc(1.49)
    e2 is trunc(1.51)
    e3 is trunc(1.5)
    e4 is trunc(-1.5)
    e5 is trunc(1.5, 0)
    e6 is trunc(1.551, 1)
    e7 is trunc(19.999, -1)
    e8 is trunc(1.4, null)
    e9 is trunc(null, 1)
}
```

### floor

```malloy
floor(value)
```

Round `value` down to the greatest integer not larger than `value`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is floor(1.0)
    b is floor(1.9)
    c is floor(-1.1)
    d is floor(null)
}
```

### ceil

```malloy
ceil(value)
```

Round `value` up to the smallest integer not less than `value`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is ceil(1.0)
    b is ceil(1.1)
    c is ceil(-1.9)
    d is ceil(null)
}
```

### cos

```malloy
cos(angle)
```

Computes the cosine of `angle` where `angle` is specified in radians.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is cos(0)
    b is cos(pi())
    c is cos(pi() / 2)
    d is cos(null)
}
```

### acos

```malloy
acos(value)
```

Computes the principal value of the inverse cosine of `value`. The return value is in the range [0,π]. Generates an error if `value` is a value outside of the range [-1, 1].

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is acos(0)
    b is acos(1)
    c is acos(-1)
    d is acos(null)
}
```

### sin

```malloy
sin(angle)
```

Computes the sine of `angle` where `angle` is specified in radians.


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is sin(0)
    b is sin(pi())
    c is sin(pi() / 2)
    d is sin(null)
}
```

### asin

```malloy
asin(value)
```

Computes the principal value of the inverse sine of `value`. The return value is in the range [-π/2,π/2]. Generates an error if `value` is outside of the range [-1, 1].

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is asin(0)
    b is asin(1)
    c is asin(-1)
    d is asin(null)
}
```


### tan

```malloy
tan(angle)
```

Computes the tangent of `angle` where `angle` is specified in radians.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is tan(0)
    b is tan(pi())
    c is tan(pi() / 4)
    d is tan(3 * pi() / 4)
    e is tan(null)
}
```

### atan

```malloy
atan(value)
```

Computes the principal value of the inverse tangent of `value`. The return value is in the range [-π/2,π/2].

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is atan(0)
    b is atan(1)
    c is atan(-1)
    d is atan(null)
}
```

### atan2

```malloy
atan2(y, x)
```

Calculates the principal value of the inverse tangent of `x / y` using the signs of the two arguments to determine the quadrant. The return value is in the range [-π,π].


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is atan2(1, 0)
    b is atan2(0, 1)
    c is atan2(-1, 0)
    d is atan2(0, -1)
    e is atan2(null, 1)
    f is atan2(1, null)
}
```

### sqrt

```malloy
sqrt(value)
```

Computes the square root of `value`. Generates an error if `value < 0`.


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is sqrt(9)
    b is sqrt(0)
    c is sqrt(null)
}
```

<!-- TODO add exp function -->

### pow

```malloy
pow(base, exponent)
```

Returns `base` raised to the power of `exponent`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is pow(2, 3)
    b is pow(100, 0)
    c is pow(10, -1)
    d is pow(0, 10)
    e is pow(null, 1)
    f is pow(1, null)
}
```

Generates an error if `base` is 0 and `exponent < 0`.

<!-- TODO document behavior for NaN and Inf -->

### abs

```malloy
abs(value)
```

Returns the absolute value of `value`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is abs(100)
    b is abs(-100)
    c is abs(0)
    d is abs(null)
}
```

### sign

```malloy
sign(value)
```

Returns `-1`, `0`, or `1` for negative, zero and positive arguments respectively. For floating point arguments, this function does not distinguish between positive and negative zero.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is sign(100)
    b is sign(-100)
    c is sign(0)
    d is sign(null)
}
```

### is_inf

```malloy
is_inf(value)
```

Returns `true` if `value` is infinite (positive or negative), `false` otherwise. Unlike in SQL, `is_inf(null) = false` (not `null`).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is is_inf(100)
    b is is_inf('inf'::number)
    c is is_inf('-inf'::number)
    d is is_inf('NaN'::number)
    e is is_inf(null)
}
```

### is_nan

```malloy
is_nan(value)
```

Returns `true` if `value` is `NaN`, `false` otherwise. Unlike in SQL, `is_nan(null) = false` (not `null`).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is is_nan(100)
    b is is_nan('NaN'::number)
    c is is_nan('inf'::number)
    d is is_nan(null)
}
```

### div

```malloy
div(dividend, divisor)
```

Returns the (truncated) integer part of the division of `dividend` by `divisor`. Division by zero returns an error. 

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is div(9, 2)
    a2 is trunc(9 / 2)
    b is div(-9, 2)
    c is div(10, 1)
    d is div(null, 1)
    e is div(1, null)
}
```

### rand

```malloy
rand()
```

Returns a random number in the range [0, 1).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is rand()
    b is rand()
    c is rand()
}
```

### pi

```malloy
pi()
```

Returns the value of π.

```malloy
--! {"isRunnable": true, "showAs":"json", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: pi is pi()
}
```

### log

```malloy
log(value, base)
```

Returns the logarithm of `value` with the specified `base`. Note that `base` is required. Errors if `value <= 0`, `base <= 0`, or if `base = 1`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is log(10, 10)
    b is log(100, 10)
    c is log(32, 2)
    d is log(null, 2)
    e is log(10, null)
}
```

### ln

```malloy
ln(value)
```

Returns the natural log (log base _e_) of `value`. Equivalent to `log(value, exp(1))`. Errors if `value <= 0`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is ln(exp(1))
    b is ln(exp(2))
    c is ln(100)
    d is ln(null)
}
```

### exp

```malloy
exp(power)
```

Returns _e_ (Euler's number) raised to the given `power`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is exp(1)
    b is exp(null)
}
```

## Interval Functions

<table class="transpose">
  <tr>
    <td><a href="#days">days</a></td>
    <td><a href="#hours">hours</a></td>
  </tr>
  <tr>
    <td><a href="#minutes">minutes</a></td>
    <td><a href="#months">months</a></td>
  </tr>
  <tr>
    <td><a href="#seconds">seconds</a></td>
    <td><a href="#quarters">quarters</a></td>
  </tr>
  <tr>
    <td><a href="#weeks">weeks</a></td>
    <td><a href="#years">years</a></td>
  </tr>
</table>

### seconds

```malloy
seconds(interval)
```

Calculate the number of seconds in `interval`.

### minutes

```malloy
minutes(interval)
```

Calculate the number of minutes in `interval`.

### hours

```malloy
hours(interval)
```

Calculate the number of hours in `interval`. 

### days

```malloy
days(interval)
```

Calculate the number of days in `interval`. 

### weeks

```malloy
weeks(interval)
```

Calculate the number of weeks in `interval`. Note: this function does not currently work.

### months

```malloy
months(interval)
```

Calculate the number of months in `interval`. Note: this function does not currently work.

### quarters

```malloy
quarters(interval)
```

Calculate the number of quarters in `interval`. Note: this function does not currently work.

### years

```malloy
years(interval)
```

Calculate the number of years in `interval`. Note: this function does not currently work.


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is seconds(now to now + 1 second)
    b is minutes(now to now + 1 minute)
    c is hours(now to now + 1 hour)
    d is days(now to now + 1 day)
    // e is weeks(now::date to now::date + 1 week)
    // f is months(now::date to now::date + 1 month)
    // g is quarters(now::date to now::date + 1 quarter)
    // h is years(now::date to now::date + 1 year)
}
```

## Date and Timestamp Functions

<table class="transpose">
  <tr>
    <td><a href="#day">day</a></td>
    <td><a href="#day_of_week">day_of_week</a></td>
    <td><a href="#day_of_year">day_of_year</a></td>
  </tr>
  <tr>
    <td><a href="#hour">hour</a></td>
    <td><a href="#minute">minute</a></td>
    <td><a href="#month">month</a></td>
  </tr>
  <tr>
    <td><a href="#quarter">quarter</a></td>
    <td><a href="#second">second</a></td>
    <td><a href="#week">week</a></td>
  </tr>
  <tr>
    <td><a href="#year">year</a></td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
</table>

### day_of_year

```malloy
day_of_year(moment)
```

Returns the day of the year (from 1 to 365) of `moment`.

### day

```malloy
day(moment)
```

Returns the day of the month (from 1 to 31) of `moment`.

### day_of_week

```malloy
day_of_week(moment)
```

Returns the day of the week (from 1 to 7) of `moment`, where 1 represents Sunday.

### week

```malloy
week(moment)
```

Returns the week of the year (from 1 to 53) of `moment`.

### month

```malloy
month(moment)
```

Returns the month of the year (from 1 to 12) of `moment`.

### quarter

```malloy
quarter(moment)
```

Returns the quarter of the year (from 1 to 53) of `moment`.

### year

```malloy
year(moment)
```

Returns the year of `moment`.

### hour

```malloy
hour(time)
```

Returns the hour of the day (from 0 to 23) of `time`.

### minute

```malloy
minute(time)
```

Returns the minute of the hour (from 0 to 59) of `time`.

### second

```malloy
second(time)
```

Returns the second of the minute (from 0 to 59) of `time`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty { dimension: t is @2023-12-31 23:59:59 } -> {
  group_by: 
    doy is day_of_year(t)
    dom is day(t)
    dow is day_of_week(t)
    woy is week(t)
    moy is month(t)
    qoy is quarter(t)
    yyy is year(t)
    hod is hour(t)
    moh is minute(t)
    som is second(t)
}
```

## Other Functions

<table class="transpose">
  <tr>
    <td><a href="#greatest">greatest</a></td>
    <td><a href="#least">least</a></td>
  </tr>
  <tr>
    <td><a href="#ifnull">ifnull</a></td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td><a href="#nullif">nullif</a></td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td><a href="#coalesce">coalesce</a></td>
    <td>&nbsp;</td>
  </tr>
</table>

### greatest

```malloy
greatest(value, ...)
```

Returns the greatest value of all arguments, supporting, `number`, `string`, `date`, and `timestamp`. Returns `null` if any argument is `null`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is greatest(3, 1, 8)
    b is greatest('z', 'b', 'f')
    c is greatest(@2003-11-03, @2001-10-21)
    d is greatest(@2003-11-03 11:25, @2003-11-03 11:24)
    e is greatest(100, 99, null)
}
```

### least

```malloy
least(value, ...)
```

Returns the least value of all arguments, supporting, `number`, `string`, `date`, and `timestamp`. Returns `null` if any argument is `null`.


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is least(3, 1, 8)
    b is least('z', 'b', 'f')
    c is least(@2003-11-03, @2001-10-21)
    d is least(@2003-11-03 11:25, @2003-11-03 11:24)
    e is least(100, 99, null)
}
```

### ifnull

```malloy
ifnull(value, default)
```

Return `value` unless it is `null`, or `default` otherwise.

Note: it is more idiomatic in Malloy to use `??`, the null-coalescing operator.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a_sql is ifnull(null, 1)
    a_malloy is null ?? 1     
}
```

### coalesce

```malloy
ifnull(value, ...)
```

Return the first `value` which is not `null`, or `null` if all `value`s are `null`. Essentially the same as `ifnull` but allowing more than two arguments.

Note: it is more idiomatic in Malloy to use `??`, the null-coalescing operator.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a_sql is coalesce(null, 1, 2)
    a_malloy is null ?? 1 ?? 2   
}
```

### nullif

```malloy
nullif(value, condition)
```

Equivalent to the SQL <code>NULLIF</code> function: returns `value` unless `value = condition`, in which case it returns `null`.

Note: the use of `nullif` is not idiomatic to Malloy; use `pick` statements instead, as they are more flexible.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty { dimension: value is 1 } -> {
  group_by: 
    a_sql is nullif(value, 2)
    a_malloy is value ? pick null when 2
    b_malloy is value ? pick null when < 2
}
```

<!-- ## Missing SQL Functions

There are many functions which are useful in SQL which are not part of Malloy for a variety of reasons including a) there is a different way to do it in Malloy, b) it is not generalizable to other dialects, c) it just hasn't been added yet. Some of the more common ones are listed here.

### IFNULL, COALESCE

Neither <code>IFNULL</code> nor <code>COALESCE</code> is available in Malloy, because Malloy has a specific coalescing operator: `??`.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty -> {
  group_by: 
    a is null ?? 1      // same as IFNULL(NULL, 1)
    b is null ?? 1 ?? 2 // same as COALESCE(NULL, 1, 2)
}
```

### NULLIF

The <code>NULLIF</code> SQL function is not available in Malloy, because the same thing is expressible in a more Malloy-like way, using a `pick` statement. This is also more flexible, as the pick statement allows for partial comparisons.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "/inline/empty.malloy" }
query: empty { dimension: value is 1 } -> {
  group_by: 
    a is value ? pick null when 2   // same as NULLIF(value, 2)
    b is value ? pick null when < 2 // same as CASE NULL WHEN value < 2 ELSE value END
}
``` -->


## Aggregate Functions

Malloy has several "native" aggregate functions, `sum`, `avg`, `max`, `min`, and `count`, as well as "non-native" aggregate functions, which currently only includes `stddev`. All of these support [aggregate locality](../language/aggregates.md#aggregate-locality) and [symmetric aggregate](https://help.looker.com/hc/en-us/articles/360023722974-A-Simple-Explanation-of-Symmetric-Aggregates-or-Why-On-Earth-Does-My-SQL-Look-Like-That-) handling.

Note: Aggregate locality is currently not supported in BigQuery for `stddev`.

<table class="transpose">
  <tr>
    <td><a href="./aggregates.html#avg">avg</a></td>
    <td><a href="./aggregates.html#count">count</a></td>
  </tr>
  <tr>
    <td><a href="./aggregates.html#max">max</a></td>
    <td><a href="./aggregates.html#min">min</a></td>
  </tr>
  <tr>
    <td><a href="#stddev">stddev</a></td>
    <td><a href="./aggregates.html#sum">sum</a></td>
  </tr>
</table>

### stddev

```malloy
stddev(value)
```

Returns the standard deviation of values of `value` across all rows.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy" }
query: flights -> {
  group_by: carrier
  aggregate: dep_delay_avg is avg(dep_delay)
  aggregate: dep_delay_stddev is stddev(dep_delay)
  order_by: dep_delay_avg asc
}
```

## Ungrouped Aggregate Functions

Malloy has two [ungrouped aggregate functions](./ungrouped-aggregates.md), `all()`, and `exclude()`, which allow you to control which dimensional values are included in the grouping while calculating a particular aggregate expression. 

<table class="transpose">
  <tr>
    <td><a href="./ungrouped-aggregates.html#all">all</a></td>
  </tr>
  <tr>
    <td><a href="./ungrouped-aggregates.html#exclude">exclude</a></td>
  </tr>
</table>

## Analytic Functions

### Syntax

Analytic functions can only appear in a `calculate:` statement:


```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy" }
query: flights -> {
  group_by: carrier
  calculate: prev_carrier is lag(carrier)
}
```

For more detailed information, see the [Calculations](./calculations.md) section.

<!-- Field references in a `calculate:` statement by default use the "output" field with that name if it exists. In the above example, `group_by: carrier` creates an _output field_ called `carrier`. In a `calculate:` statement we can reference that output field.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: 
    carrier is 'CA'
    carrier2 is carrier
  calculate: prev_carrier is lag(carrier)
}
```

In the above example, `carrier` in the _output_ refers to the `carrier is 'CA'`, whereas `carrier` in the _input_ refers to the column in `flights`. Inside a `group_by` it is not possible to reference an output field, so `carrier2 is carrier` refers to the column `carrier`. In the `calculate: prev_carrier is lag(carrier)`, however, `carrier` refers to the _output_ field, i.e. `carrier is 'CA'`.

Most arguments to analytic functions are _required_ to be output fields or aggregate fields (see specific requirements below). 

```malloy
query: flights -> {
  // ERROR: Parameter 1 ('value') of lag must be literal, constant, or output, but received input
  calculate: prev_carrier is lag(carrier)
}
``` -->

<table class="transpose">
  <tr>
    <td><a href="#avg_moving">avg_moving</a></td>
    <td><a href="#first_value">first_value</a></td>
    <td><a href="#lag">lag</a></td>
    <td><a href="#last_value">last_value</a></td>
  </tr>
  <tr>
    <td><a href="#lead">lead</a></td>
    <td><a href="#max_cumulative">max_cumulative</a></td>
    <td><a href="#max_window">max_window</a></td>
    <td><a href="#min_cumulative">min_cumulative</a></td>
  </tr>
  <tr>
    <td><a href="#min_window">min_window</a></td>
    <td><a href="#rank">rank</a></td>
    <td><a href="#row_number">row_number</a></td>
    <td><a href="#sum_cumulative">sum_cumulative</a></td>
  </tr>
  <tr>
    <td><a href="#sum_window">sum_window</a></td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
</table>

### row_number

```malloy
row_number()
```

Returns the row number of the current result row after grouping and aggregating.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  calculate: row is row_number()
}
```

### rank

```malloy
rank()
```

Returns the rank according to the query ordering, with values having equal ordering value getting equal rank.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  aggregate: flight_count_bucket is round(flight_count, -6)
  order_by: flight_count_bucket desc
  calculate: flight_count_rank is rank()
}
```

### lag

```malloy
lag(expr)
lag(expr, offset)
lag(expr, offset, default)
```

Returns the value of `expr` for the previous row. If `offset` is specified, returns the value of `expr` for the row `offset` rows before the current row. Returns `default` (or `null` if unspecified) when the referenced row doesn't exist.

Generates an error if `offset` is `null`, negative, or not an integer.

The value of `offset` must be a _constant_.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  calculate: prev_carrier is lag(carrier)
  calculate: prev_prev_carrier is lag(carrier, 2)
  calculate: prev_carrier_or_none is lag(carrier, 1, 'NONE')
}
```

### lead

```malloy
lead(expr)
lead(expr, offset)
lead(expr, offset, default)
```

Returns the value of `expr` for the next row. If `offset` is specified, returns the value of `expr` for the row `offset` rows after the current row. Returns `default` (or `null` if unspecified) when the referenced row doesn't exist.

Generates an error if `offset` is `null`, negative, or not an integer.

The value of `offset` must be a _constant_.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> { 
  group_by: carrier
  limit: 5 
} -> {
  group_by: carrier
  calculate: next_carrier is lead(carrier)
  calculate: next_next_carrier is lead(carrier, 2)
  calculate: next_carrier_or_none is lead(carrier, 1, 'NONE')
}
```

### first_value

```malloy
first_value(expr)
```

Returns the first value of `expr` across all rows (i.e. the value for the first row).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  calculate: first_carrier is first_value(carrier)
}
```

### last_value

```malloy
last_value(expr)
```

Returns the last value of `expr` across all rows (i.e. the value for the last row).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> { 
  group_by: carrier
  limit: 5 
} -> {
  group_by: carrier
  calculate: last_carrier is last_value(carrier)
}
```

### min_cumulative

```malloy
min_cumulative(expr)
```

Returns the minimum value of `expr` among rows from the first row to the current row.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  order_by: carrier asc
  aggregate: flight_count
  calculate: min_cumulative_flight_count is min_cumulative(flight_count)
}
```

### max_cumulative

```malloy
max_cumulative(expr)
```

Returns the maximum value of `expr` among rows from the first row to the current row.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  order_by: carrier asc
  aggregate: flight_count
  calculate: max_cumulative_flight_count is max_cumulative(flight_count)
}
```

### sum_cumulative

```malloy
sum_cumulative(expr)
```

Returns the cumulative sum of values of `expr` from the first row to the current row.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  order_by: carrier asc
  aggregate: flight_count
  calculate: sum_cumulative_flight_count is sum_cumulative(flight_count)
}
```

### min_window

```malloy
min_window(expr)
```

Returns the minimum of all values of `expr` across all rows.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  aggregate: flight_count
  calculate: min_flight_count is min_window(flight_count)
}
```

### max_window

```malloy
max_window(expr)
```

Returns the maximum of all values of `expr` across all rows.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  aggregate: flight_count
  calculate: max_flight_count is max_window(flight_count)
}
```

### sum_window

```malloy
sum_window(expr)
```

Returns the sum of all values of `expr` across all rows.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  aggregate: flight_count
  calculate: total_flight_count1 is sum_window(flight_count)
  aggregate: total_flight_count2 is all(flight_count)
}
```

### avg_moving

```malloy
avg_moving(expr, preceding)
avg_moving(expr, preceding, following)
```

Produces a moving average (or 'rolling average') of values of `expr` among rows between `preceding` rows before the current row and `following` rows after the current row (or the current row if `following` is not specified).

Both `preceding` and `following` must be _literals_.

Note: `avg_moving(value, 3)` means that the average is computed over 4 rows (the current row and 3 preceding).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: carrier
  aggregate: flight_count
  nest: carrier_analysis is {
    group_by: yr is dep_time.year
    aggregate: flight_count
    order_by: yr asc
    calculate: three_year_avg is avg_moving(flight_count, 2)
    calculate: three_year_avg_centered is avg_moving(flight_count, 1, 1)
  }
}
```

### All Functions

<table class="transpose">
  <tr>
    <td><a href="#abs">abs</a></td>
    <td><a href="#acos">acos</a></td>
    <td><a href="./ungrouped-aggregates.html#all">all</a></td>
    <td><a href="#ascii">ascii</a></td>
    <td><a href="#asin">asin</a></td>
    <td><a href="#atan">atan</a></td>
    <td><a href="#atan2">atan2</a></td>
    <td><a href="./aggregates.html#avg">avg</a></td>
    <td><a href="#avg_moving">avg_moving</a></td>
    <td><a href="#byte_length">byte_length</a></td>
    <td><a href="#ceil">ceil</a></td>
    <td><a href="#chr">chr</a></td>
    <td><a href="#coalesce">coalesce</a></td>
    <td><a href="#cos">cos</a></td>
    <td><a href="#concat">concat</a></td>
    <td><a href="./aggregates.html#count">count</a></td>
    <td><a href="#day">day</a></td>
    <td><a href="#days">days</a></td>
    <td><a href="#day_of_week">day_of_week</a></td>
    <td><a href="#day_of_year">day_of_year</a></td>
    <td><a href="#div">div</a></td>
    <td><a href="#ends_with">ends_with</a></td>
  </tr>
  <tr>
    <td><a href="./ungrouped-aggregates.html#exclude">exclude</a></td>
    <td><a href="#exp">exp</a></td>
    <td><a href="#first_value">first_value</a></td>
    <td><a href="#floor">floor</a></td>
    <td><a href="#greatest">greatest</a></td>
    <td><a href="#hour">hour</a></td>
    <td><a href="#hours">hours</a></td>
    <td><a href="#ifnull">ifnull</a></td>
    <td><a href="#is_inf">is_inf</a></td>
    <td><a href="#is_nan">is_nan</a></td>
    <td><a href="#lag">lag</a></td>
    <td><a href="#last_value">last_value</a></td>
    <td><a href="#lead">lead</a></td>
    <td><a href="#least">least</a></td>
    <td><a href="#length">length</a></td>
    <td><a href="#ln">ln</a></td>
    <td><a href="#log">log</a></td>
    <td><a href="#lower">lower</a></td>
    <td><a href="#ltrim">ltrim</a></td>
    <td><a href="./aggregates.html#max">max</a></td>
    <td><a href="#max_cumulative">max_cumulative</a></td>
    <td><a href="#max_window">max_window</a></td>
  </tr>
  <tr>
    <td><a href="./aggregates.html#min">min</a></td>
    <td><a href="#min_cumulative">min_cumulative</a></td>
    <td><a href="#min_window">min_window</a></td>
    <td><a href="#minute">minute</a></td>
    <td><a href="#minutes">minutes</a></td>
    <td><a href="#month">month</a></td>
    <td><a href="#months">months</a></td>
    <td><a href="#nullif">nullif</a></td>
    <td><a href="#pi">pi</a></td>
    <td><a href="#pow">pow</a></td>
    <td><a href="#quarter">quarter</a></td>
    <td><a href="#quarters">quarters</a></td>
    <td><a href="#rand">rand</a></td>
    <td><a href="#rank">rank</a></td>
    <td><a href="#regexp_extract">regexp_extract</a></td>
    <td><a href="#repeat">repeat</a></td>
    <td><a href="#replace">replace</a></td>
    <td><a href="#repeat">repeat</a></td>
    <td><a href="#round">round</a></td>
    <td><a href="#row_number">row_number</a></td>
    <td><a href="#rtrim">rtrim</a></td>
    <td><a href="#second">second</a></td>
  </tr>
  <tr>
    <td><a href="#seconds">seconds</a></td>
    <td><a href="#sign">sign</a></td>
    <td><a href="#sin">sin</a></td>
    <td><a href="#sqrt">sqrt</a></td>
    <td><a href="#starts_with">starts_with</a></td>
    <td><a href="#stddev">stddev</a></td>
    <td><a href="#strpos">strpos</a></td>
    <td><a href="#substr">substr</a></td>
    <td><a href="./aggregates.html#sum">sum</a></td>
    <td><a href="#sum_cumulative">sum_cumulative</a></td>
    <td><a href="#sum_window">sum_window</a></td>
    <td><a href="#tan">tan</a></td>
    <td><a href="#trim">trim</a></td>
    <td><a href="#trunc">trunc</a></td>
    <td><a href="#unicode">unicode</a></td>
    <td><a href="#upper">upper</a></td>
    <td><a href="#week">week</a></td>
    <td><a href="#weeks">weeks</a></td>
    <td><a href="#year">year</a></td>
    <td><a href="#years">years</a></td>
    <td>&nbsp;</td>
    <td>&nbsp;</td>
  </tr>
</table>

<!-- ```malloy
calculate: lag(1).state
calculate: rows_between(-1, 0).avg()
calculate: rows().state.max()
``` 

Sorta feels like rank should allow rank_by(some_metric)

-->