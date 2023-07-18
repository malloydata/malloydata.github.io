# Pivotting Results
Malloy's rederer has flexible and powerful way of pivotting data.  

```malloy
--! {"isModel": true, "modelPath": "/inline/e1.malloy"}
source: flights is duckdb.table('data/flights.parquet') {
  join_one: carriers is duckdb.table('data/carriers.parquet') on carrier=carriers.code
  join_one: dest is  duckdb.table('data/airports.parquet') on destination=dest.code
  join_one: orig is  duckdb.table('data/airports.parquet') on destination=orig.code

  measure: 
    flight_count is count()
    total_distance is distance.sum()
}
```

## The Classic Pivot

A classic data pivot is data is dimensionalized by two attributes the data can be rendered with one dimension along the x-axis and one dimension on the y-axis with the aggregate computations making up the center of the table.  The cross section of the data allows for easy comparison.  In Malloy, pivots columns are nested queries.

Carriers by FAA Region

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  # pivot
  nest: by_faa_region is {
    group_by: orig.faa_region
    aggregate: flight_count 
  }
}
```

## The Pivot Filtered

You can control which dimension are shown in the pivot with a filter (and their order)

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  # pivot
  nest: by_state is {
    where: orig.state = 'CA' | 'NY' | 'WA'  // only show these states
    group_by: orig.state
    aggregate: flight_count 
    order_by: state   // sort order of the pivotted columns
  }
}
```

## The Pivot with multiple aggreagtes

Pivots can have multiple aggregates.  In this case we show `flight_count` and `total_distance` for each of the states.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  # pivot
  nest: by_state is {
    where: orig.state = 'CA' | 'NY' | 'WA'  // only show these states
    group_by: orig.state
    aggregate: 
      flight_count 
      total_distance
    order_by: state   // sort order of the pivotted columns
  }
}
```

## Aggregates outside the pivot (and row ordering)

Malloy allows you to intermix unpivotted data along with pivotted data through nesting.  Since pivots are nests, any aggregate outside the nest is just shown normally.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  aggregate: 
    total_flights is flight_count   // outside the pivot
    total_distance
  # pivot
  nest: by_state is {
    where: orig.state = 'CA' | 'NY' | 'WA'  // only show these states
    group_by: orig.state
    aggregate: flight_count 
    order_by: state   // sort order of the pivotted columns
  }
}
```

## Multiple pivots in the same table

Malloy allows you to intermix unpivotted data along with pivotted data through nesting.  Since pivots are nests, any aggregate outside the nest is just shown normally.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  aggregate: 
    total_flights is flight_count   // outside the pivot
  # pivot
  nest: by_state is {
    where: orig.state = 'CA' | 'NY' | 'WA'  // only show these states
    group_by: orig.state
    aggregate: flight_count 
    order_by: state   // sort order of the pivotted columns
  }
  # pivot
  nest: by_year is {
    where: dep_time.year > @2003
    group_by: dep_year is dep_time.year
    aggregate: flight_count
  }
}
```

## Ordering by a column in the pivot 
Malloy sorts by the first aggregate column in finds, generally.  The `# hidden` tag allows you to not show a column in a result.  By adding a measure filtered by the column we are interested in, we can sort the entire table on a column in the pivot.

Rows sorted by 'CA' flights

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  # hidden
  aggregate: ca_count is flight_count {where: orig.state='CA'}
  # pivot
  nest: by_state is {
    where: orig.state = 'CA' | 'NY' | 'WA'  // only show these states
    group_by: orig.state
    aggregate: flight_count 
    order_by: state   // sort order of the pivotted columns
  }
}
```

# Multistage queries in a pivot
Malloy Renderer uses the metadata from the query to decide which columns to pivot (dimensions are pivotted, aggreates are not). In multistage queries this information is incorrect.  You can manually specify this information with a 'dimensions="..."' property on the pivot tag.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "medium", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights ->  {
  group_by: carriers.nickname
  aggregate: total_flights is flight_count
  # pivot dimensions="dep_year"
  nest: by_year is {
    group_by: dep_year is dep_time.year
    aggregate: flight_count
    calculate: growth is (flight_count-lag(flight_count,1))/flight_count
    order_by: dep_year
  }
  -> {
    where: dep_year > @2003
    project:
      dep_year
      flight_count
      # percent
      growth
  }
}
```