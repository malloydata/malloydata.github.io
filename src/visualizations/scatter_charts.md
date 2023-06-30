# Scatter Charts

Scatter charts compare two numeric values. The data styles for the subsequent examples is:

```json
{
  "seats_by_distance": {
    "renderer": "scatter_chart"
  }
}
```

## Run as a nested subtable

```malloy
--! {"isRunnable": true, "size": "medium", "source": "flights.malloy"}
query: flights -> {
  where: origin_code = 'ORD'
  nest: seats_by_distance_scatter_chart is {
    group_by: seats is aircraft.aircraft_models.seats
    group_by: distance is distance
    aggregate: route_count is count(distinct concat(origin_code, destination_code))
  }
}
```

## Run as a trellis

```malloy
--! {"isRunnable": true, "size": "large", "source": "flights.malloy"}
query: flights -> {
  group_by: origin_code
  nest: seats_by_distance_scatter_chart is {
    group_by: seats is aircraft.aircraft_models.seats
    group_by: distance is distance
    aggregate: route_count is count(distinct concat(origin_code, destination_code))
  }
}
```
