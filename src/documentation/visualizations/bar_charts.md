# Bar Charts

There are two types of bar charts.  _Two measure bar charts_ (gradient bar charts) and _Two Dimension Bar_ Charts (stacked bar charts).

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

## Simple Bar Chart
A basic bar chart takes a table where the first column is a string and the second is a number.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# bar_chart
run: flights ->  {
  group_by: carriers.nickname
  aggregate: flight_count
}
```

## Two Measures

This chart looks at flights and counts the number of aircraft owned by each carrier.  It also, using a gradient,
shows the number of flights made per plane.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# bar_chart
run: flights ->  {
  group_by: carriers.nickname
  aggregate: aircraft_count
  aggregate: flights_per_aircraft is flight_count / aircraft_count
}
```


## Two Dimensions
In this case we are going to look at carriers by flight count and stack the destination.  We are only going to look at flights
with the destination SFO, OAK or SJC.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# bar_chart
run: flights -> {
  where: destination ? 'SFO' | 'OAK' | 'SJC'
  group_by: carriers.nickname
  aggregate: flight_count
  group_by: destination
}
```


We could flip the dimensions around and look at the airports' flights by carrier.

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
# bar_chart
run: flights -> {
  where: destination ? 'SFO'| 'OAK' | 'SJC'
  group_by: destination
  aggregate: flight_count 
  group_by: carriers.nickname
}
```

## Nested bar Charts
Barcharts can be used in nested queries

```malloy
--! {"isRunnable": true, "isPaginationEnabled": true, "size": "large", "source": "/inline/e1.malloy", "pageSize":5000}
run: flights -> {
  group_by: carriers.nickname
  aggregate: flight_count 
  # bar_chart
  nest: top_destinations is {
    group_by:destination
    aggregate: flight_count
    limit: 10
  }
  # bar_chart
  nest: by_hour_of_day is {
    group_by: hour_of_day is hour(dep_time)
    aggregate: flight_count
  }
}
```