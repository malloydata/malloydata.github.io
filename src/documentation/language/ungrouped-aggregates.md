# Ungrouped Aggregates

In a query which is grouped by multiple dimensions, it is often useful to be able to perform an aggregate calculation on sub-groups.

## Ungrouped Aggregate Functions

### all

```malloy
all(expr)
all(aggregate_expr, grouping_dimension, ...)
```

The `all()` function will perform the specified aggregate computation `aggregate_expr`, ignoring the grouping in the
current query to provide an overall value.

```malloy
--! {"isRunnable": true, "source": "airports.malloy"}
query: airports -> {
  group_by: faa_region
  aggregate: percent_of_total is count() / all(count())*100.0
}
```

When `grouping_dimension`s are provided, `all()` will preserve grouping by the named dimensions. For example, in the query below, grouping by `faa_region` is preserved, while `state` is ungrouped.

```malloy
--! {"isRunnable": true, "source": "airports.malloy"}
query: airports -> {
  group_by: faa_region, state
  aggregate:
    airports_in_state is count()
    airports_in_region is all(count(), faa_region)
  order_by: airports_in_state desc
}
```

Dimensions named in `all()` must be included in a `group_by` in the current query (in other words, they must be [output fields](./eval_space.md#outputs)).

### exclude

```malloy
exclude(aggregate_expr, ungroup_dimension, ...)
```

Similar to `all()`,  `exclude()` allows you to control which grouping dimensions are
used to compute `aggregate_expr`. In this case, dimensions which should _not_ be used are listed. For example, these two aggregates will do the exact same thing:

```malloy
--! {"isRunnable": true, "source": "airports.malloy"}
query: airports -> {
  group_by: faa_region, fac_type
  aggregate:
    count_airports is count()
    count_in_region_exclude is exclude(count(), fac_type)
    count_in_region_all is all(count(), faa_region)
}
```

The main difference is that in a nested query, it is legal to name a grouping dimension from an outer query which contains the inner query.

As with `all()`, `ungroup_dimension`s must be [output fields](./eval_space.md#outputs).
