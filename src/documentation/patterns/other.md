## Producing a Chart or table with 'Other'
Often you want to limit the number of results in a chart and bucket the everything else into an 'other' bucket.  

top_states by elevation calculates the top states and nests the data it is going to need to aggregate.  The seconds pipeline stage produces the actual aggregation.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: airports is table('duckdb:data/airports.parquet') + {
  measure: 
    airport_count is count()
    avg_elevation is elevation.avg()

  query: top_states_by_elevation is {
    group_by: state
    aggregate: avg_elevation
    calculate: row_num is row_number()
    nest: data is {  
      group_by: code,elevation
    }
  }
  -> {
    group_by: state is 
      pick state when row_num < 5
      else 'OTHER'
    aggregate: 
      avg_elevation is data.elevation.avg()
      airport_count is data.count()
  }
}
```

## Basic Query
```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: airports -> top_states_by_elevation
```

## Nested Query
```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: airports -> {
  group_by: `Facility Type` is fac_type
  aggregate: 
    airport_count
    avg_elevation
  nest: top_states_by_elevation
}
```