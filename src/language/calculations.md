# Calculations

Calculations in Malloy are fields which operate on the results of a grouping, aggregating, or projecting query, while operating within the same query stage. Logically these calculation operations occur "after" the other operations, so their exact semantics can be challenging to understand.

## Window Functions

A _calculation_ is a kind of field which appears in a `calculate:` operation in a query. These _calculation_ fields are defined in terms of _analytic functions_, which tend to be translated into SQL window functions. So when you see the terms "calculation" or "window function" in Malloy documentation, it's safe to think "window function."

For more details, see a [full list of available analytic functions](./functions.md#analytic-functions).

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy" }
query: flights -> {
  where: carrier = 'WN'
  group_by: dep_year is dep_time.year
  aggregate: flight_count
  order_by: dep_year asc
  calculate: year_change is flight_count - lag(flight_count)
}
```

## Field References in Calculations

Because calculations operate logically on the output of the grouping/projecting/aggregating operations, field references behave somewhat differently inside a `calculate:` block. In particular, field references refer by default to output names from those operations.

```malloy
--! {"isRunnable": true, "showAs":"html", "runMode": "auto", "size": "large", "source": "faa/flights.malloy"}
query: flights -> {
  group_by: lower_carrier is lower(carrier)
  calculate: prev_carrier is lag(lower_carrier)
}
```

In a `group_by` or `aggregate`, you cannot reference `lower_carrier` because it is not a field defined inside of `flights`, but in `calculate`, you can.

For a detailed explanation of the exact semantics, see the [evaluation space documentation](./eval_space.md).