# Computing Moving Averages

Malloy can compute moving averages on resultsets.

The queries below use the following model

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: order_items is table('duckdb:data/order_items.parquet') + {
  measure: 
    user_count is count(distinct user_id)
    order_count is count()
}
```

## Simple Moving Average

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> {
  group_by: order_month is created_at.month
  aggregate: 
    order_count
  calculate: moving_avg_order_count is avg_moving(order_count, 3)
  order_by: order_month
}
```

## Visualizing the Results

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: order_items -> {
  # line_chart
  nest: non_averaged is {
    group_by: order_month is created_at.month
    aggregate: 
      order_count
    order_by: order_month
  }
  # line_chart
   nest: moving_averaged is {
    group_by: order_month is created_at.month
    calculate: moving_avg_order_count is avg_moving(order_count, 3)
    order_by: order_month
  }
}
```

## Displaying Charts in Nested Queries

In this example, we've added two queries to the `flights` source, one showing flights by month without the moving average applied, and one with the moving average applied. We then use these queries to show charts of flight count for each airport over time.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
source: flights is duckdb.table('data/flights.parquet')  {
  measure: flight_count is count()
  dimension: dep_month is dep_time.month

  # line_chart
  query: non_averaged is {
    group_by: dep_month
    aggregate: 
      flight_count
    order_by: dep_month
  }

  # line_chart
  query: moving_averaged is {
    group_by: dep_month
    calculate: moving_avg_flight_count is avg_moving(flight_count, 3)
    order_by: dep_month
  }
}

run: flights -> {
  group_by: destination
  aggregate: flight_count
  nest: non_averaged
  nest: moving_averaged
}
```