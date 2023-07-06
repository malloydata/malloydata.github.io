# Line Charts
Line charts take two or three parameters.

* First parameter -  X-axis is time field or numeric expression
* Second parameter - Y-axis is a numeric expression
* Third (optional) Pivot is dimensional field (numeric or string)

Data Style is <code>'line_chart'</code>

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "dataStyles": {"departures_by_month":{"renderer":"line_chart","size":"large"}}}
query: duckdb.table('data/flights.parquet') -> {
  nest: departures_by_month is {
    group_by: departure_month is dep_time.month
    aggregate: flight_count is count()
  }
}
```

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "dataStyles": {"carriers_by_month":{"renderer":"line_chart","size":"large"}}}
query: duckdb.table('data/flights.parquet') -> {
  nest: carriers_by_month is {
    group_by: departure_month is dep_time.month
    aggregate: flight_count is count()
    group_by: carrier
  }
}
```

Style
```json
{
  "carriers_by_month" : {
    "renderer": "line_chart"
  },
  "departures_by_month" : {
    "renderer": "line_chart"
  }
}
```
