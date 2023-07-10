# Scatter Charts

Scatter charts compare two numeric values. The data styles for the subsequent examples is:

## Run as a nested subtable

```malloy
--! {"isRunnable": true, "size": "medium", "source": "flights.malloy", "pageSize":5000}
# scatter_chart
run: flights -> {
  where: origin_code = 'ORD'
  group_by: seats is aircraft.aircraft_models.seats
  group_by: distance is distance
  aggregate: route_count is count(distinct concat(origin_code, destination_code))
}
```

## Run as a trellis

```malloy
--! {"isRunnable": true, "size": "medium", "source": "flights.malloy", "pageSize":5000}
run: flights -> {
  group_by: origin_code
  # scatter_chart
  nest: seats_by_distance_scatter_chart is {
    group_by: seats is aircraft.aircraft_models.seats
    group_by: distance is distance
    aggregate: route_count is count(distinct concat(origin_code, destination_code))
  }
}
```
