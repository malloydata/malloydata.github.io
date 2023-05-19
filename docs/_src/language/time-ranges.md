# Malloy time range expressions

## Range expressions

There are two forms of range expressions

* _expr_ `to` _expr_ ( `@2001 to @2003`)
* _expr_ `for` `N` _units_ ( `now for 15 minutes` )

A timestamp can be compared to a range. If the time stamp is within
the range it will be `=`. Before the range it will be `<` and after
the range it will be `>`. If you [apply](apply.md) a range, (for example, `eventDate: @2003 to @2004`) that will also check if the value is within the range.

## Range shortcuts

Because grouping and filtering by specific time ranges is such a common operation for a data transformation task, Malloy has a number of expressive short cuts. The full power of the underlying SQL engine is also available for any type of truncation or extraction not supported by these shortcuts.

Malloy supports two time-related types, `timestamp` and `date`.
Both of these can be used with these techniques, though the exact
truncations or extractions available will vary depending on the
data type (e.g. it would make no sense to attempt to truncate a `date` object by `minute`).

### Literals as ranges

Any time literal with resolution larger than seconds will function as a range, for duration of the units in which the literal is expressed. This works with year, quarter, month, week, day, hour and minute resolution literals.

 expression | true if
 ---- | ----
`expr ? @2021` | expr >= @2021-01-01 and expr < @2022-01-01
`expr ? @2021-01` | expr >= @2021-01-01 and expr < @2021-02-01
`expr ? @2021-01-02` | expr >= @2021-01-02 and expr < @2021-01-03

## Truncation

To create truncation, use the `.` operator followed by the desired timeframe.

By way of example, if the value of `expr` is the timestamp `@2021-08-06 00:36`, then the below truncations will produce the results on the right:

 expression | result
 ---- | ----
`expr.minute` | 2021-08-06 00:36
`expr.hour`   | 2021-08-06 00:00
`expr.day`    | 2021-08-06 00:00
`expr.week`   | 2021-08-01 00:00 _(the week containing the 10th)_
`expr.month`  | 2021-08-01 00:00
`expr.quarter` | 2021-06-01 00:00
`expr.year`   | 2021-01-01 00:00

### Truncations as ranges

A truncation made this way (unlike a truncation make in SQL with
`TIMESTAMP_TRUNC()`) can also function as a range. The range begins
at the moment of truncation and the duration is the timeframe unit
used to specify the truncation, so for example `eventDate.year`
would be a range covering the entire year which contains `eventDate`

This is extremely useful with the [Apply operator](apply.md), `?`. To see if two events happen in the same calendar year, for example, the boolean expression in Malloy could be `oneEvent ? otherEvent.year`

## Extraction

Another very common grouping for time related data is by particular components, and this extraction of a single component as an integer. In Malloy this gesture looks like a function call.

The "Result" column uses a value of `2021-08-06 00:55:05` for `expr`.

expression | meaning | result
---- | ---- | ----
`day_of_year(expr)` | day of year, 1-365 | 218
`day(expr)` | day of month 1-31 | 5
`day_of_week(expr)` | day of week 1-7 | 6 _(Note: 1 represents Sunday)_
`quarter(expr)` | quarter in year 1-4 | 3
`week(expr)` | week in year, 1-53 | 31
`hour(expr)` | hour of day 0-23 | 0
`minute(expr)` | minute of hour 0-59 | 55
`second(expr)` | second of minute 0-59 | 5

## Interval extraction

To measure the difference between two times, pass a range expression to
one of these extraction functions, which world time timestmap or date based data.

expression | meaning
---- | ----
`seconds(t1 to t2)` | Number of seconds from t1 until t2
`minutes(t1 to t2)` | ... minutes ...
`hours(t1 to t2)` | ... hours ...
`days(t1 to t2)` | ... days ...

The extractions compute the difference in seconds of the endpoints,
and use fixed ratios to convert to larger units than seconds.

If you are using date based data, you can also measure intervals in larger units.

expression | meaning
---- | ----
`weeks(t1 to t2)` | ... weeks ...
`months(t1 to t2)` | ... months ...
`quarters(t1 to t2)` | ... quarters ...
`years(t1 to t2)` | ... years ...

These will return a negative number if t1 is later than t2.
