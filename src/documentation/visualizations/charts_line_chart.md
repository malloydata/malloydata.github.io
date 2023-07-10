# Line Charts



The examples below all use the following semantic model.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.table('data/flights.parquet') {
  join_one: carriers is duckdb.table('data/carriers.parquet') 
    on carrier=carriers.code
  measure: 
    flight_count is count()
    aircraft_count is count(distinct tail_num)
}
```

Line charts take two or three parameters.

* First parameter -  X-axis is time field or numeric expression
* Second parameter - Y-axis is a numeric expression
* Third (optional) Pivot is dimensional field (numeric or string)

## Single line line_chart

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# line_chart
run: flights -> {
  group_by: departure_month is dep_time.month
  aggregate: flight_count
}
```

## Multi line line_chart

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# line_chart
run: flights -> {
  group_by: departure_month is dep_time.month
  aggregate: flight_count
  group_by: carriers.nickname
}
```

## Line Charts nested in tables

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}

run: flights -> {
  group_by: destination
  aggregate: flight_count
  # line_chart
  nest: by_month is {
    group_by: departure_month is dep_time.month
    aggregate: flight_count
    group_by: carriers.nickname
  }
  limit: 5
}
```