 # Timezones in Malloy

A timestamp represents a moment in time which does not change, however we often describe the moments in time relative to a timezone.

 Without any timezone specification, all timestamps in Malloy are described as being in the "UTC" or zero-offset timezone.

 A source or a query can specify a timezone with a locale name. When that is specified, the Malloy description of a timestamp which you would access through [truncation](expressions.md#time-truncation) or [extraction](expressions.md#time-extraction), chnages.

```
   timezone: 'America/Mexico_City'
```

 ## Literals

Timestamp literals without a timezone are assumed to be in the active timezone

```
query: showMe is emptySource -> {
  project: showMeVal is
    hours(
      @2021-01-01 00:00
      to
      @2021-01-01 00:00:00 [UTC]
    )
}
```

Without a timezone specification, `showMeVal` will be 0. Change it to

```
query: showMe is emptySource -> {
  timezone: 'America/Mexico_City'
  project: showMeVal is
    hours(
      @2021-01-01 00:00
      to
      @2021-01-01 00:00:00 [UTC]
    )
}
```

the result will be 6 (the difference in hours between UTC and Mexico City time, on that date)

## Extraction / Truncation

With a timezone active, extraction and truncation happen at the moment of that timestamp, in the current timezone.

```
query: showMe is emptySouce -> {
  project: year(@2021-01-01 00:00 [UTC])
}
```
will return 2021 but
```
query: showMe is emptySouce -> {
  timezone: 'America/Mexico_City'
  project: year(@2021-01-01 00:00 [UTC])
}
```

will return 2020, because at that UTC midnight moment, it is still 2020 in Mexico City.
