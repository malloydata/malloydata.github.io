# Comparing Timeframes Measuring Change over Time
There are a couple of different ways to go about this in Malloy.

## Method 1: Pivoting a Visualization

Compare performance of different years on the same scale.  Line charts take the X-Axis, Y-Axis and Dimensional Axis as parameters.
In this Case, the X-Axis is `month_of_year`, the Y-Axis is `flight_count` and the Dimensional Axis is the year.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.table('data/flights.parquet') {
  measure: flight_count is count()
}
```

By adding a thrid column that is year, we can display

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "small", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights -> {
  group_by: month_of_year is month(dep_time)
  aggregate: flight_count
  group_by: flight_year is dep_time.year
}
```

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# line_chart
run: flights -> {
  group_by: month_of_year is month(dep_time)
  aggregate: flight_count
  group_by: flight_year is dep_time.year
}
```

## Method 2: Filtered Aggregates
Filters make it easy to reuse aggregate calculations for trends analysis.


```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights->{
  group_by: carrier
  aggregate:
    flights_in_2002 is flight_count { where: dep_time = @2002 }
    flights_in_2003 is flight_count { where: dep_time = @2003 }
    # percent
    percent_change is 
      (flight_count { where: dep_time = @2003 } - flight_count { where: dep_time = @2002 })
        / nullif(flight_count { where: dep_time = @2003 }, 0)
}
```

## Method 3: Calculate with Lag


```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights -> {
  group_by: dep_year is dep_time.year
  aggregate: flight_count
  calculate: 
    last_year is lag(flight_count,1)
    # percent
    growth is (lag(flight_count,1) - flight_count)/ (lag(flight_count,1))
  order_by: dep_year
}
```

## Bonus: Relative timeframes and expression reuse
You might like to write queries that automatically adjust based on the current timeframe.  The query below uses date arrithmetic to filter the data to time frames relative to now.  These measures probably aren't generally useful in the model so we use the `extend:` operation to add these measure so they are only locally accessable within the query.


```malloy
--! {"isRunnable": true,   "isPaginationEnabled": true, "pageSize":100, "size":"medium"}
source: inventory_items is duckdb.table('data/inventory_items.parquet') 

source: order_items is duckdb.table('data/order_items.parquet') {
  join_one: inventory_items  on inventory_item_id=inventory_items.id
  measure: order_item_count is count()

  query: category_growth is {
    extend: {
      // add measures for use just in this query
      measure:
        last_year is order_item_count { where: created_at ? now.year - 1 year }
        prior_year is order_item_count { where: created_at ? now.year - 2 years }
    }
    top: 10
    group_by: inventory_items.product_category
    aggregate:
      last_year
      prior_year
      # percent
      percent_change is (last_year - prior_year) / nullif(last_year, 0)
  }
}

run: order_items -> category_growth
```
