# Sessionized Data - Map/Reduce

Flight data contains time, carrier, origin, destination and the plane that made the flight (`tail_num`).  Take the
flight data and sessionize it by carrier and date.  Compute statistics and the session, plane and flight level.
Retain the original flight events.

```malloy
--! {"isRunnable": true, "showAs": "json", "isPaginationEnabled": true, "size": "large"}
run: duckdb.table('data/flights.parquet') {
  where: carrier = 'WN' and dep_time ? @2002-03-03
  measure: flight_count is count()
} -> {
  group_by:
    flight_date is dep_time.day
    carrier
    tail_num
    aggregate: flight_count 
  nest: flight_legs is {
    order_by: 3
    calculate: flght_leg is row_number() 
    group_by:
      tail_num
      dep_minute is dep_time.minute
      origin
      destination
      dep_delay
      arr_delay
  } 
}
```
