# Automatically Binning Data
By examining the range of values over a dataset, we can compute the appropriate histogram bin size, while capturing the data at the same time.  We can then pipe the output to another query to display a histogram.

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: airports is table('duckdb:data/airports.parquet') + {
  measure: 
    airport_count is count()
  # bar_chart
  query: by_elevation is {
    aggregate: bin_size is (max(elevation) - min(elevation))/30
    nest: data is {
      group_by: elevation
      aggregate: row_count is count()
    }
  }
  -> {
    group_by: elevation is 
      floor(data.elevation/bin_size)*nullif(bin_size,0) + bin_size/2
    aggregate: airport_count is data.row_count.sum()
    order_by: elevation
  }
}
```
## Over all elevation distribution

The query can be used to show the overall distribution of the data.

We are showing the bin_size in this exmaple for clarity.
```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: airports -> by_elevation
```

## Distribution Adapts Automatically
Notice that when we look at Florida, the bin-width is different.
```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: airports {where: state='FL'} -> by_elevation
```

## Elevation within states.
This binning even adapts when the queries are nested.

Notice that all the binning is local to the individual states.  For example the bottom bin in Colorado starts at an elevation of 3000ish feet.
```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: airports -> {
  group_by: state is state
  aggregate: airport_count
  nest: by_elevation
}
```